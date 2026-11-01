import { supabase } from '../lib/supabaseClient'

const DETAIL = '*, booking_services(service_id, service_name, price, duration_minutes), nail_designs(id, name, image_url)'

// Lịch hẹn: đọc bằng select (RLS), ghi bằng hàm SQL (rpc) để quy tắc nghiệp vụ chạy phía CSDL
export const bookingRepo = {
  freeSlots: (date, serviceIds, excludeBookingId = null) =>
    supabase.rpc('get_free_slots', { p_date: date, p_service_ids: serviceIds ?? null, p_exclude_booking_id: excludeBookingId }),
  create: (p) => supabase.rpc('create_booking', p),
  cancelMine: (id, reason) => supabase.rpc('cancel_my_booking', { p_booking_id: id, p_reason: reason }),
  markSeen: (id) => supabase.rpc('mark_booking_seen', { p_booking_id: id }),
  changeStatus: (id, status, reason) => supabase.rpc('change_booking_status', { p_booking_id: id, p_status: status, p_reason: reason ?? null }),
  adminCreate: (p) => supabase.rpc('admin_create_booking', p),
  reschedule: (id, startAt) => supabase.rpc('reschedule_booking', { p_booking_id: id, p_new_start_at: startAt }),

  mine: (userId) => supabase.from('bookings').select(DETAIL).eq('user_id', userId).order('start_at', { ascending: false }),
  one: (id) =>
    supabase.from('bookings')
      .select(`${DETAIL}, booking_status_logs(from_status, to_status, reason, changed_at), booking_reschedules(old_start_at, new_start_at, changed_at)`)
      .eq('id', id).single(),
  list: ({ from, to, status, q, page, limit }) => {
    let query = supabase.from('bookings').select(DETAIL, { count: 'exact' }).order('start_at')
    if (from) query = query.gte('start_at', from)
    if (to) query = query.lt('start_at', to)
    if (status) query = query.eq('status', status)
    if (q) query = query.or(`code.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`)
    return query.range((page - 1) * limit, page * limit - 1)
  },
  countByStatus: (status, from, to) => {
    let q = supabase.from('bookings').select('id', { count: 'exact', head: true })
    if (status) q = q.eq('status', status)
    if (from) q = q.gte('start_at', from)
    if (to) q = q.lt('start_at', to)
    return q
  },
  overlapping: (fromIso, toIso) =>
    supabase.from('bookings').select('id, code, customer_name, customer_phone, start_at, end_at, status')
      .in('status', ['pending', 'confirmed']).lt('start_at', toIso).gt('end_at', fromIso).order('start_at'),
  byUser: (userId) => supabase.from('bookings').select('id, code, start_at, status, total_price').eq('user_id', userId).order('start_at', { ascending: false }),
}
