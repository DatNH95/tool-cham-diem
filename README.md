# Travel Awards 2026 — Công cụ chấm điểm BGK

Bộ HTML/CSS thuần cho Tech tích hợp nằm ở [`hand-off/`](hand-off/index.html), hướng dẫn tại [`docs/handoff.md`](docs/handoff.md). Thư mục này được tự đồng bộ và kiểm tra mỗi lần đẩy GitHub; là template tĩnh, độc lập với bản demo tương tác bên dưới.

Mở `index.html` bằng Chrome hoặc Edge phiên bản mới. Giữ các thư mục `assets` và `shared` cùng cấp với file HTML.

Giao diện và mã chấm điểm được kế thừa từ `tool cham diem bgk.html`. Header được đối chiếu theo https://khao-sat-travel-awards.vercel.app/: chỉ có logo quay về bước 1 của công cụ, cao 65 px, khung rộng tối đa 1.100 px và viền dưới xanh nhạt. Logo và CSS lấy từ `Vibe code/travel-awards-2026`. Header dùng Shadow DOM để tránh ảnh hưởng CSS của công cụ; thanh tiến trình bốn bước được đặt bên dưới header. Công cụ không có footer trên tất cả các bước.

Bấm logo ở header quay về bước 1 của công cụ, giữ dữ liệu phiếu đã lưu. CSS tiện ích đã đóng gói tại `shared/utilities.css`, không tải Tailwind hoặc Google Fonts khi chạy. Font Inter dùng nếu có trên máy, nếu không dùng font hệ thống.

Đây là bản demo front-end, chưa kết nối máy chủ hay xác thực giám khảo. Theo yêu cầu 13.11.2026, phiếu chỉ giữ điểm nguyên 1–5 cho từng tiêu chí; không yêu cầu loại minh chứng, nguồn tham chiếu hoặc nhận xét chung. Riêng mức 5 — Xuất sắc bắt buộc nhập giải trình. Điểm trung bình các tiêu chí được quy đổi thang 100. Chi tiết quyết định ánh xạ và những điểm tài liệu chưa thống nhất nằm ở [docs/scoring-model.md](docs/scoring-model.md).

Bước 3 luôn hiển thị toàn bộ hồ sơ ở box bên trái, không có tab theo tiêu chí. Việc chọn tiêu chí, đọc câu hỏi và chấm điểm nằm trong box bên phải. Đổi tiêu chí không làm mất vị trí đang đọc hồ sơ. Mobile chuyển vùng Hồ sơ/Phiếu chấm. Thanh thao tác giữ lưu nháp và hoàn tất dễ tiếp cận. Thanh tiến trình website được ẩn riêng ở bước 3. Sau khi hoàn tất phiếu, thao tác chính là quay lại danh sách hồ sơ cùng hạng mục; không tự mở hồ sơ tiếp theo.

Box chấm điểm hiển thị tên và nội dung đánh giá của tiêu chí, cùng mô tả cụ thể cho từng mức 1–5 lấy từ trường levels trong bộ tiêu chí gốc. BGK bấm trực tiếp vào mức có mô tả phù hợp. Mã tiêu chí nằm ở thanh chọn, tiến độ nằm ở thanh thao tác. Tất cả mức 1–5 đều chọn được ngay; hoàn tất khi chấm đủ tiêu chí và giải trình các mức 5 — Xuất sắc. Minh chứng và ghi chú từng nhập ở phiên bản trước được giữ trong bản lưu nhưng không tham gia điều kiện hoàn tất.

Mã HTML gốc vẫn được giữ trong `index.html` để truy nguyên. `shared/scoring-model.js` áp dụng mô hình mới; `shared/editor-workspace.js` và `.css` cung cấp màn hình chấm và kết quả. Phiếu cũ được nhập thành nháp để kiểm tra lại; không ghi đè bản lưu cũ.

Kiểm tra logic: `node verify.cjs`. Kiểm tra trình duyệt: `node scripts/qa-workspace.cjs` với Playwright đã có sẵn (hoặc đặt `PLAYWRIGHT_MODULE` đến module Playwright, `CHROME_PATH` đến Chrome). Ảnh và báo cáo QA nằm trong `tmp/qa`, không đưa vào Git.

Nếu thêm utility class mới, tạo lại CSS bằng `node scripts/build-styles.cjs "đường dẫn package tailwindcss 4"`. CSS đã tạo sẵn được đưa cùng mã nguồn; công cụ không cần Node.js khi sử dụng.

Tái tạo từ thư mục nguồn: `node build-integration.cjs "đường dẫn thư mục Travel Awards 2026"`.

Cập nhật nội dung đánh giá: chọn mức 1–4 hiện ô “Nội dung đánh giá (khuyến khích)”, không bắt buộc; mức 5 hiện ô giải trình Xuất sắc bắt buộc. Nội dung được lưu theo từng tiêu chí và hiện trong phần xem lại phiếu; chuyển mức điểm không xóa nội dung đã nhập.
