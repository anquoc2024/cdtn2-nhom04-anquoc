# Hướng dẫn Git cho nhóm 04

Quy trình: **Khải** tạo repo trên GitHub và đẩy khung dự án lên. Mỗi thành viên làm trên **nhánh riêng**, đẩy nhánh lên GitHub và mở **Pull Request (PR)** vào `main`. **Khải** xem và gộp (merge) PR. Không ai đẩy thẳng lên `main`.

Thay `<khai>` bằng tài khoản GitHub của Khải.

## 1. Khải: tạo repo từ file bundle (làm 1 lần)

1. Trên GitHub tạo repo **trống** tên `nailcare` (không tick README, .gitignore, license). Vào Settings → Collaborators, mời 3 thành viên.
2. Trên máy:
   ```bash
   git clone nailcare.bundle nailcare
   cd nailcare
   git remote set-url origin https://github.com/<khai>/nailcare.git
   git push -u origin main
   ```
3. Settings → Branches → Add rule cho `main`: tick “Require a pull request before merging”.

## 2. Mỗi thành viên: lấy code và tạo nhánh (làm 1 lần)

Cách A – clone từ GitHub (sau khi Khải đã push):
```bash
git clone https://github.com/<khai>/nailcare.git
cd nailcare
```
Cách B – từ file bundle nhận qua Zalo:
```bash
git clone nailcare.bundle nailcare
cd nailcare
git remote set-url origin https://github.com/<khai>/nailcare.git
git fetch origin
```
Sau đó:
```bash
git config user.name  "Họ Tên"
git config user.email "email-github-cua-ban@..."
npm install
git switch -c ten-ban/PB.xx-mo-ta-ngan      # ví dụ: rasphone/PB.02-csdl
```

## 3. Mỗi ngày làm việc

```bash
git switch main
git pull --ff-only                  # lấy bản mới nhất của main
git switch ten-ban/PB.xx-...
git merge --ff-only main || git merge main   # cập nhật nhánh của mình
# ... sửa code, chạy npm run dev và npm test ...
git add -A
git commit -m "feat(PB.12): trang đặt lịch chọn nhiều dịch vụ"
git push -u origin ten-ban/PB.xx-...
```

Lên GitHub → **Compare & pull request** → base `main` → mô tả ngắn: làm mục backlog nào, đã thử thế nào (ảnh chụp nếu có giao diện).

Quy ước commit (Configuration Management Plan): `<loại>(PB.xx): mô tả`, loại gồm `feat`, `fix`, `docs`, `test`, `refactor`, `chore`. Sửa lỗi từ báo cáo lỗi thì ghi mã lỗi: `fix(BUG-03): …`.

## 4. Khải: duyệt và gộp PR

- Mở PR → tab **Files changed** → xem → **Review changes** → Approve hoặc Request changes.
- Gộp bằng **Squash and merge** hoặc **Rebase and merge** để `main` giữ lịch sử thẳng.
- Sau khi gộp, báo trên nhóm Zalo để mọi người chạy lại bước 3 (`git pull --ff-only`).

## 5. Tạo file bundle để gửi qua Zalo (khi cần)

```bash
git switch main && git pull --ff-only
git bundle create nailcare.bundle --all
git bundle verify nailcare.bundle
```

## Lưu ý an toàn

- **Không commit** `.env`, `.env.local` hoặc bất kỳ khóa `service_role` nào. `.gitignore` đã chặn các file này; kiểm tra `git status` trước khi commit.
- Lỡ đẩy khóa bí mật lên GitHub: báo nhóm ngay và **đổi khóa** trên Supabase (Project Settings → API). Xóa commit không đủ vì khóa đã lộ.
- Gặp xung đột (conflict) khi merge: mở file bị đánh dấu `<<<<<<<`, giữ phần đúng, xóa các dấu, rồi `git add` và `git commit`. Không chắc thì hỏi trên nhóm trước khi push.
