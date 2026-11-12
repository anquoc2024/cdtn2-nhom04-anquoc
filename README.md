# NailCare – Website đặt lịch và quản lý tiệm Thủy Nail

Đồ án Chuyên đề tốt nghiệp 2 – Nhóm 04 (VLU). Khách xem dịch vụ, mẫu nail và đặt lịch trực tuyến; chủ tiệm quản lý lịch hẹn, dịch vụ, giá, mẫu nail, ngày nghỉ, người dùng và thống kê.

- **Giao diện:** React 18 + Vite, React Router, Tailwind CSS
- **Dữ liệu và xác thực:** Supabase (PostgreSQL, Auth, Storage). Quy tắc nghiệp vụ nằm trong hàm SQL; quyền truy cập bằng Row Level Security
- **Triển khai:** Vercel (giao diện) + Supabase (dữ liệu)

Tài liệu thiết kế tương ứng: SRS v1.2, Architecture Design v1.1, Database Design v1.1, API Contract v1.1.

## Cấu trúc thư mục (theo 4 lớp của Architecture Design v1.1)

```
src/
  pages/, components/, context/, hooks/   Lớp Presentation – màn hình MH01–MH12
  services/                               Lớp Service phía trình duyệt – kiểm tra dữ liệu, chuẩn hóa lỗi
  repositories/                           Lớp Repository – mọi lời gọi supabase-js
  lib/supabaseClient.js                   Kết nối Supabase
supabase/
  migrations/                             Lớp Service phía máy chủ + Data store: bảng, RLS, hàm SQL, kho ảnh
  seed.sql                                Dữ liệu mẫu (dịch vụ, mẫu nail, cấu hình cửa hàng)
  tests/                                  Kiểm thử hàm SQL trên PostgreSQL 16
public/designs/                           Hình minh họa cho 12 mẫu nail trong dữ liệu mẫu
```

| Màn hình | Đường dẫn | Use case |
|---|---|---|
| MH01 Đăng nhập / Đăng ký | `/dang-nhap`, `/dang-ky` | UC01, UC02 |
| MH02 Dịch vụ và bảng giá | `/`, `/dich-vu` | UC03 |
| MH03 Mẫu nail | `/mau-nail` | UC04 |
| Trang tĩnh: Giới thiệu, Liên hệ, Câu hỏi thường gặp | `/gioi-thieu` | UC16 (FR16) |
| MH04 Đặt lịch | `/dat-lich` | UC05, UC06 |
| MH05 Lịch hẹn của tôi | `/lich-hen-cua-toi` | UC07, UC08 |
| MH12 Hồ sơ cá nhân | `/tai-khoan` | UC19 |
| MH06 Quản lý lịch hẹn | `/admin/lich-hen`, `/admin/tao-lich` | UC13, UC14, UC18, UC20 |
| MH07 Dịch vụ và giá | `/admin/dich-vu` | UC10, UC11 |
| MH08 Mẫu nail | `/admin/mau-nail` | UC12 |
| MH09 Người dùng | `/admin/nguoi-dung` | UC09 |
| MH10 Thống kê | `/admin/thong-ke` | UC15 |
| MH11 Cửa hàng; chặn ngày giờ | `/admin/cua-hang`, `/admin/chan-lich` | UC16, UC17 |

## Chạy trên máy

Cần Node.js 20 trở lên.

1. **Tạo dự án Supabase** (supabase.com, gói miễn phí).
   - SQL Editor → chạy lần lượt 4 file trong `supabase/migrations/` theo thứ tự tên, rồi chạy `supabase/seed.sql`.
   - Authentication → Sign In / Providers → Email: **tắt “Confirm email”** (máy chủ email mặc định của Supabase chỉ gửi được rất ít thư).
2. **Cấu hình:** sao chép `.env.example` thành `.env.local` và điền `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
3. **Cài và chạy:**
   ```bash
   npm install
   npm run dev          # http://localhost:5173
   ```
4. **Tài khoản mẫu:** sao chép `.env.example` thành `.env`, điền `SUPABASE_SERVICE_ROLE_KEY` và các biến `SEED_*`, rồi chạy `npm run seed:users`. File `.env` chứa khóa bí mật – không commit, không gửi qua Zalo.

## Kiểm thử

```bash
npm test                                   # kiểm thử đơn vị lớp Service (Vitest)
bash supabase/tests/run_local.sh           # kiểm thử hàm SQL trên PostgreSQL 16 (cần psql)
```

`supabase/tests/10_business_rules.sql` kiểm tra BR03–BR15: hết chỗ, giới hạn 2 lịch, hủy trước 2 giờ, vòng đời trạng thái, dời lịch, chặn ngày, khóa tài khoản, quyền quản trị, và người dùng không đọc/sửa được lịch của người khác.

## Triển khai lên Vercel

Import repo trên Vercel, thêm 2 biến môi trường `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, bấm Deploy. `vercel.json` đã chuyển mọi đường dẫn về `index.html`.

## Hạn chế đã biết

- Khóa đăng nhập 15 phút sau 5 lần sai (US02) dùng giới hạn tốc độ có sẵn của Supabase Auth, chưa đếm riêng theo tài khoản.
- Quên mật khẩu chưa làm (COULD): khách gọi tiệm; quản trị viên không đặt và không xem mật khẩu người dùng.
- Chưa gửi email/SMS khi lịch đổi trạng thái (COULD); người dùng thấy dấu “Mới cập nhật” trên website.
- Ảnh mẫu nail trong dữ liệu mẫu là hình minh họa; tiệm thay bằng ảnh chụp thật trong trang quản trị.

## Quy trình làm việc nhóm

Xem [docs/HUONG_DAN_GIT.md](docs/HUONG_DAN_GIT.md).
