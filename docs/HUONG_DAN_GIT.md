# Hướng dẫn Git cho nhóm 04

Quy trình theo Configuration Management Plan:

| Nhánh | Dùng để | Quy tắc |
|---|---|---|
| `main` | Bản ổn định, Vercel tự triển khai | Chỉ gộp từ `develop` cuối sprint, sau khi test đạt |
| `develop` | Nhánh tích hợp | Chỉ nhận code qua Pull Request (PR) đã được duyệt |
| `feature/PB.xx-ten-ngan` | Làm một mục backlog | Tạo từ `develop`, ví dụ `feature/PB.12-dat-lich` |
| `fix/BUG.xx-ten-ngan` | Sửa một lỗi trong Defect Report | Tạo từ `develop` |

**Khải** (chủ repo) tạo repo trên GitHub và đẩy khung dự án lên. Mỗi thành viên làm trên nhánh của mình, đẩy nhánh lên GitHub rồi mở PR vào `develop`. **Khải** duyệt và gộp PR. Không ai đẩy thẳng lên `main` hay `develop`.

Thay `<khai>` bằng tài khoản GitHub của Khải.

## 1. Khải: tạo repo từ file bundle (làm 1 lần)

1. Trên GitHub, tạo repo **trống** tên `nailcare` (không tick README, .gitignore hay license). Vào Settings → Collaborators và mời 3 thành viên.
2. Trên máy:
   ```bash
   git clone nailcare.bundle nailcare
   cd nailcare
   git remote set-url origin https://github.com/<khai>/nailcare.git
   git push -u origin main develop
   ```
3. Vào Settings → Branches → Add rule cho `main` và cho `develop`, tick “Require a pull request before merging”.
4. Ghi đường dẫn repo vào Nhật ký và báo cáo.

## 2. Mỗi thành viên: lấy code (làm 1 lần)

Cách A: clone từ GitHub (sau khi Khải đã push):
```bash
git clone https://github.com/<khai>/nailcare.git
cd nailcare
```
Cách B: clone từ file bundle nhận qua Zalo:
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
```

## 3. Bắt đầu một mục backlog

```bash
git switch develop
git pull --ff-only
git switch -c feature/PB.12-dat-lich
```

## 4. Mỗi ngày làm việc

```bash
git switch develop && git pull --ff-only      # lấy bản tích hợp mới nhất
git switch feature/PB.12-dat-lich
git merge --ff-only develop || git merge develop   # cập nhật nhánh của mình
# ... sửa code, chạy npm run dev và npm test ...
git add -A
git commit -m "feat(PB.12): chọn nhiều dịch vụ ở bước 1"
git push -u origin feature/PB.12-dat-lich
```

Lên GitHub → **Compare & pull request** → base `develop`. Phần mô tả ghi: mục backlog nào, đã thử thế nào, ảnh chụp nếu đổi giao diện.

Quy ước commit: `<loại>(PB.xx): mô tả ngắn`, loại gồm `feat`, `fix`, `docs`, `test`, `refactor`, `chore`. Sửa lỗi thì ghi mã lỗi: `fix(BUG.03): …`. Mỗi thành viên commit ít nhất 2 lần mỗi buổi.

## 5. Khải: duyệt và gộp PR

- Mở PR → tab **Files changed** → xem → **Review changes** → Approve hoặc Request changes.
- Gộp bằng **Squash and merge** để `develop` có lịch sử gọn.
- Sau khi gộp, báo trên nhóm Zalo để mọi người chạy lại bước 4.
- Cuối sprint, khi test đạt: mở PR `develop` → `main` và gộp. Vercel sẽ triển khai bản mới.

## 6. Tạo file bundle để gửi qua Zalo (khi cần)

Chạy trong thư mục repo:
```bash
git switch develop && git pull --ff-only
git bundle create ../nailcare.bundle --all
git bundle verify ../nailcare.bundle
```

## Lưu ý an toàn

- **Không commit** `.env`, `.env.local` hay khóa `service_role`. `.gitignore` đã chặn các file này; xem `git status` trước khi commit.
- Lỡ đẩy khóa bí mật lên GitHub: báo nhóm ngay và **đổi khóa** trên Supabase (Project Settings → API). Xóa commit không đủ, vì khóa đã bị lộ.
- Bị xung đột (conflict) khi merge: mở file có dấu `<<<<<<<`, giữ phần đúng, xóa các dấu, rồi `git add` và `git commit`. Không chắc thì hỏi nhóm trước khi push.
