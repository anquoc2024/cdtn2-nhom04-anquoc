import { supabase } from '../lib/supabaseClient'

// Danh mục, dịch vụ, mẫu nail (bảng đơn giản – đọc/ghi trực tiếp, RLS kiểm soát quyền)
export const catalogRepo = {
  serviceCategories: (all = false) => {
    let q = supabase.from('service_categories').select('*').order('sort_order').order('name')
    if (!all) q = q.eq('is_active', true)
    return q
  },
  services: ({ categoryId, all = false } = {}) => {
    let q = supabase.from('services').select('*, service_categories(name)').order('category_id').order('price')
    if (!all) q = q.eq('is_active', true)
    if (categoryId) q = q.eq('category_id', categoryId)
    return q
  },
  insertService: (row) => supabase.from('services').insert(row).select().single(),
  updateService: (id, patch) => supabase.from('services').update(patch).eq('id', id).select().single(),
  deleteService: (id) => supabase.from('services').delete().eq('id', id),
  priceHistory: (serviceId) =>
    supabase.from('service_price_history').select('*, profiles(full_name)').eq('service_id', serviceId).order('changed_at', { ascending: false }),
  insertServiceCategory: (row) => supabase.from('service_categories').insert(row).select().single(),
  updateServiceCategory: (id, patch) => supabase.from('service_categories').update(patch).eq('id', id).select().single(),
  deleteServiceCategory: (id) => supabase.from('service_categories').delete().eq('id', id),

  designCategories: () => supabase.from('design_categories').select('*').order('name'),
  designs: ({ categoryId, all = false, from, to } = {}) => {
    let q = supabase.from('nail_designs').select('*, design_categories(name), design_services(service_id)', { count: 'exact' })
      .order('created_at', { ascending: false }).order('id', { ascending: false })
    if (!all) q = q.eq('is_active', true)
    if (categoryId) q = q.eq('category_id', categoryId)
    if (from !== undefined) q = q.range(from, to)
    return q
  },
  design: (id) =>
    supabase.from('nail_designs').select('*, design_categories(name), design_services(service_id, services(id, name, price, duration_minutes, is_active))').eq('id', id).single(),
  insertDesign: (row) => supabase.from('nail_designs').insert(row).select().single(),
  updateDesign: (id, patch) => supabase.from('nail_designs').update(patch).eq('id', id).select().single(),
  deleteDesign: (id) => supabase.from('nail_designs').delete().eq('id', id),
  setDesignServices: async (designId, serviceIds) => {
    const del = await supabase.from('design_services').delete().eq('design_id', designId)
    if (del.error || !serviceIds.length) return del
    return supabase.from('design_services').insert(serviceIds.map((service_id) => ({ design_id: designId, service_id })))
  },
  insertDesignCategory: (row) => supabase.from('design_categories').insert(row).select().single(),
  updateDesignCategory: (id, patch) => supabase.from('design_categories').update(patch).eq('id', id).select().single(),
  deleteDesignCategory: (id) => supabase.from('design_categories').delete().eq('id', id),
}
