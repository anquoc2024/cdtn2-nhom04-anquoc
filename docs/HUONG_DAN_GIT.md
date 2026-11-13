# Hướng dẫn Git cho Nhóm 04

## Các nhánh

| Nhánh | Người dùng | Quy tắc |
|---|---|---|
| `main` | Cả nhóm (chỉ đọc) | Bản ổn định, Vercel tự triển khai. Chỉ gộp từ `develop` cuối sprint, sau khi test đạt. |
| `develop` | Cả nhóm (chỉ đọc) | Nhánh tích hợp. Chỉ nhận code qua Pull Request (PR) do Khải duyệt. |
| `quoc` | Thái An Quốc | Nhánh làm việc riêng của từng thành viên. Chỉ chủ nhánh push lên. |
| `khai` | Giang Huy Khải | |
| `rasphone` | Rasphone Samphanthamith | |
| `mingbouppha` | Mingbouppha Xaykham | |

Cần làm song song hai việc thì tạo thêm nhánh bắt đầu bằng tên mình: `rasphone/PB.23-chan-lich`.

**Khải** là chủ repo: tạo repo, duyệt và gộp PR. Không ai push thẳng lên `main` hay `develop`.

Thay `<khai>` bằng tài khoản GitHub của Khải.

## 1. Khải: tạo repo từ file bundle (làm 1 lần)

1. Trên GitHub tạo repo **Public**, **trống** (không tick README, .gitignore, license). Settings → Collaborators: mời 3 thành viên.
2. Trên máy:
   ```bash
   git clone nailcare.bundle nailcare
   cd nailcare
   git remote set-url origin https://github.com/<khai>/nailcare.git
   git push -u origin --all
   ```
   Lệnh cuối đẩy lên cả `main`, `develop` và 4 nhánh thành viên.
3. Settings → Branches → Add branch protection rule cho `main`, rồi cho `develop`: tick “Require a pull request before merging”.
4. Gửi đường dẫn repo vào nhóm Zalo; ghi vào Nhật ký và báo cáo.

## 2. Mỗi thành viên: lấy code (làm 1 lần)

```bash
git clone https://github.com/<khai>/nailcare.git
cd nailcare
git config user.name  "Họ và tên đầy đủ"
git config user.email "email đã gắn với tài khoản GitHub của mình"
git switch rasphone          # thay bằng nhánh của mình: quoc, khai, rasphone, mingbouppha
npm install
```

Email phải trùng với một email đã xác minh trong tài khoản GitHub của mình (Settings → Emails), để commit hiện đúng tên người làm. Bảng email commit của từng thành viên nằm trong Configuration Management Plan v1.0 của nhóm.

## 3. Mỗi lần làm việc

```bash
git switch develop && git pull --ff-only        # lấy bản tích hợp mới nhất
git switch rasphone
git merge --ff-only develop || git merge develop   # đưa nhánh mình lên ngang develop
# ... sửa code, chạy npm run dev và npm test ...
git add -A
git commit -m "feat(PB.23): thêm mục chặn ngày nghỉ"
git push                                        # lần đầu: git push -u origin rasphone
```

Lên GitHub → **Compare & pull request** → base `develop`, compare `rasphone`. Phần mô tả ghi: làm mục backlog nào, đã thử thế nào, ảnh chụp nếu đổi giao diện.

Quy ước commit (Configuration Management Plan): `<loại>(PB.xx): mô tả ngắn`, loại gồm `feat`, `fix`, `docs`, `test`, `refactor`, `chore`. Sửa lỗi thì ghi mã lỗi: `fix(BUG.03): …`. Mỗi thành viên commit ít nhất 2 lần mỗi buổi.

## 4. Khải: duyệt và gộp PR

- Mở PR → tab **Files changed** → xem → **Review changes** → Approve hoặc Request changes.
- Gộp bằng **Create a merge commit**. Không dùng Squash hay Rebase, vì nhánh của thành viên dùng lâu dài; hai cách đó tạo commit mới làm nhánh thành viên lệch khỏi `develop`.
- Gộp xong, báo trên nhóm Zalo để mọi người chạy lại bước 3.
- Cuối sprint, khi test đạt: mở PR `develop` → `main` và gộp. Vercel sẽ triển khai bản mới.

## 5. Tạo file bundle để gửi qua Zalo (khi cần)

Trong thư mục repo:
```bash
git bundle create ../nailcare.bundle --all
git bundle verify ../nailcare.bundle
```

## Lưu ý

- **Không commit** `.env`, `.env.local` hay khóa `service_role`. `.gitignore` đã chặn các file này; xem `git status` trước khi commit.
- Repo để Public: mọi người xem được mã nguồn và email trong lịch sử commit.
- Lỡ đẩy khóa bí mật lên GitHub: báo nhóm ngay và **đổi khóa** trên Supabase (Project Settings → API). Xóa commit không đủ, vì khóa đã bị lộ.
- Bị xung đột (conflict) khi merge: mở file có dấu `<<<<<<<`, giữ phần đúng, xóa các dấu, rồi `git add` và `git commit`. Không chắc thì hỏi nhóm trước khi push.
