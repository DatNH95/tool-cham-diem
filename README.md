# Travel Awards 2026 — Công cụ chấm điểm BGK

Mở `index.html` bằng Chrome hoặc Edge phiên bản mới. Giữ các thư mục `assets` và `shared` cùng cấp với file HTML.

Giao diện và mã chấm điểm được kế thừa từ `tool cham diem bgk.html`. Header được đối chiếu theo https://khao-sat-travel-awards.vercel.app/: chỉ có logo liên kết về trang chủ Travel Awards, cao 65 px, khung rộng tối đa 1.100 px và viền dưới xanh nhạt. Footer, logo và CSS lấy từ `Vibe code/travel-awards-2026`. Header/footer dùng Shadow DOM để tránh ảnh hưởng CSS của công cụ; thanh tiến trình bốn bước được đặt bên dưới header.

Header liên kết về trang chủ Travel Awards. Các liên kết nội bộ ở footer dùng đường dẫn của website, cần cấu hình đúng gốc URL khi tích hợp. CSS tiện ích đã đóng gói tại `shared/utilities.css`, không tải Tailwind hoặc Google Fonts khi chạy. Font Inter dùng nếu có trên máy, nếu không dùng font hệ thống.

Đây là bản demo front-end, chưa kết nối máy chủ hay xác thực giám khảo. Mô hình chấm được cập nhật theo tài liệu 09.11.2026: trung bình cộng các tiêu chí quy đổi thang 100, trần T1/T2/T3 và giải trình mức 1/5. Chi tiết quyết định ánh xạ và những điểm tài liệu chưa thống nhất nằm ở [docs/scoring-model.md](docs/scoring-model.md).

Bước 3 đối chiếu từng tiêu chí: hồ sơ/minh chứng bên trái, phiếu chấm bên phải; chuyển tiêu chí bằng thanh số hoặc nút Trước/Tiếp theo. Mobile chuyển vùng Hồ sơ/Phiếu chấm. Câu hỏi bổ sung là tùy chọn, không còn bước bắt buộc trước khi chấm. Thanh thao tác giữ lưu nháp và hoàn tất dễ tiếp cận; không mất vị trí cuộn khi chọn điểm. Footer và thanh tiến trình website được ẩn riêng ở bước 3.

Mã HTML gốc vẫn được giữ trong `index.html` để truy nguyên. `shared/scoring-model.js` áp dụng mô hình mới; `shared/editor-workspace.js` và `.css` cung cấp màn hình chấm và kết quả. Phiếu cũ được nhập thành nháp để kiểm tra lại; không ghi đè bản lưu cũ.

Kiểm tra logic: `node verify.cjs`. Kiểm tra trình duyệt: `node scripts/qa-workspace.cjs` với Playwright đã có sẵn (hoặc đặt `PLAYWRIGHT_MODULE` đến module Playwright, `CHROME_PATH` đến Chrome). Ảnh và báo cáo QA nằm trong `tmp/qa`, không đưa vào Git.

Nếu thêm utility class mới, tạo lại CSS bằng `node scripts/build-styles.cjs "đường dẫn package tailwindcss 4"`. CSS đã tạo sẵn được đưa cùng mã nguồn; công cụ không cần Node.js khi sử dụng.

Tái tạo từ thư mục nguồn: `node build-integration.cjs "đường dẫn thư mục Travel Awards 2026"`.
