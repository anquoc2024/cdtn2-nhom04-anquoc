#!/usr/bin/env bash
# Kiểm thử NFR04: nhiều người đặt cùng một khung giờ không được vượt số chỗ phục vụ.
# Chạy sau run_local.sh (dùng lại CSDL nailcare_test):
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres bash supabase/tests/20_concurrency.sh [số_phiên]
# Mỗi phiên psql đặt 1 lịch vào cùng khung giờ 15:00 ngày mốt; số chỗ = store_settings.capacity.
set -uo pipefail
N=${1:-8}
DB=nailcare_test
ADMIN=00000000-0000-0000-0000-00000000000a
DAY=$(psql -d $DB -Atc "select (now() at time zone 'Asia/Ho_Chi_Minh')::date + 2")
CAP=$(psql -d $DB -Atc "select capacity_per_slot from store_settings where id = 1")
psql -d $DB -qc "delete from blocked_slots"   # bỏ mục chặn do 10_business_rules.sql tạo
SLOT="(('$DAY'::date + time '15:00') at time zone 'Asia/Ho_Chi_Minh')"
# BUG-01: bảo đảm khung giờ trống trước khi chạy – xóa lịch do các lần chạy trước của script này tạo ra
LEFT=$(psql -d $DB -Atc "with d as (delete from bookings where start_at = $SLOT
  and customer_name like 'Khách song song %' returning 1) select count(*) from d")
BEFORE=$(psql -d $DB -Atc "select count(*) from bookings where status in ('pending','confirmed','in_progress')
  and start_at = $SLOT")
if [ "$BEFORE" -ne 0 ]; then
  echo "Khung 15:00 ngày $DAY còn $BEFORE lịch không do script này tạo – hãy chạy lại run_local.sh rồi chạy lại script."
  exit 2
fi
OUT=$(mktemp -d)
for i in $(seq 1 "$N"); do
  psql -d $DB -At >"$OUT/$i.txt" 2>&1 <<SQL &
set role authenticated;
set request.jwt.claim.sub = '$ADMIN';
select (admin_create_booking(null, 'Khách song song $i', '0912000$(printf %03d "$i")', array[8], null,
        (('$DAY'::date + time '15:00') at time zone 'Asia/Ho_Chi_Minh')))->>'code';
SQL
done
wait
OK=$(grep -l '^NC-' "$OUT"/*.txt | wc -l)
FULL=$(grep -l 'SLOT_FULL' "$OUT"/*.txt | wc -l)
COUNT=$(psql -d $DB -Atc "select count(*) from bookings where status in ('pending','confirmed','in_progress')
  and start_at = $SLOT")
echo "Lịch cũ của lần chạy trước (đã xóa): $LEFT"
echo "Số phiên đặt đồng thời : $N"
echo "Số chỗ của khung giờ   : $CAP"
echo "Đặt thành công         : $OK"
echo "Bị từ chối SLOT_FULL   : $FULL"
echo "Lịch chiếm chỗ trong CSDL: $COUNT"
if [ "$COUNT" -le "$CAP" ] && [ "$OK" -eq "$COUNT" ]; then echo "KẾT QUẢ: ĐẠT"; else echo "KẾT QUẢ: KHÔNG ĐẠT"; exit 1; fi
