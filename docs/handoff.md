# Bàn giao HTML/CSS cho Tech

Lấy nguyên thư mục `hand-off/` trên GitHub và mở `index.html`. Bộ này chỉ chứa HTML/CSS thuần, không cần Node.js, React, Next.js, Tailwind runtime, JavaScript hoặc kết nối mạng. Logo SVG được nhúng trong HTML để không cần thư mục ảnh đi kèm.

| File | Mẫu giao diện |
| --- | --- |
| `index.html` | Chọn hạng mục, đầy đủ 15 tên hạng mục |
| `ho-so.html` | Danh sách hồ sơ mẫu Khách sạn |
| `cham-diem.html` | Hồ sơ và phiếu chấm, tiêu chí đầu tiên của Khách sạn; chọn mức 5 để minh họa ô giải trình bắt buộc |
| `hoan-tat.html` | Ví dụ hoàn tất với điểm 4, 5, 4, 3 = 80/100 |

Đây là các template giao diện đã render, dùng dữ liệu minh họa đại diện cho các bước. Thanh “Mẫu giao diện tĩnh” cuối trang chỉ phục vụ xem các template, bỏ thanh này khi ghép hệ thống. Các link điều hướng mẫu dẫn giữa 4 file; không thay đổi hồ sơ hay lưu trạng thái. Các nút chấm điểm/lưu/gửi chưa có xử lý; `data-integration-action` lưu tên handler nguồn để Tech đối chiếu. Một số trạng thái disabled giữ nguyên từ bản demo. Accordion hướng dẫn và chuyển vùng Hồ sơ/Phiếu chấm trên mobile dùng HTML/CSS thuần, hỗ trợ bàn phím.

Tech cần ghép dữ liệu, lựa chọn hạng mục/hồ sơ/tiêu chí, điểm nguyên 1–5, tiến độ, lưu nháp, xác thực giám khảo và gửi phiếu vào hệ thống của mình. Mô hình hiện tại: trung bình cộng các điểm tiêu chí /5 ×100; không trần minh chứng. Mức 5 bắt buộc giải trình tối thiểu 3 ký tự sau khi bỏ khoảng trắng đầu/cuối; mức 1–4 có nội dung đánh giá khuyến khích, không bắt buộc. Giữ nội dung từng tiêu chí khi đổi điểm và hiển thị lại ở kết quả. Mô tả tiêu chí và từng mức điểm lấy nguyên văn từ bộ tiêu chí gốc. Không lấy điểm hoặc giải trình ví dụ trong template làm kết quả thật. Mã ứng dụng tương tác ở `index.html` và `shared/` ngoài thư mục bàn giao là tham chiếu nghiệp vụ, không phải phần phụ thuộc của template.

Format theo quy ước Travel Awards: header trực tiếp trong `body.home`, nội dung là `section#main`; không Shadow DOM, wrapper `main`, `div.home` hoặc footer phát sinh. `css/layout.css` là CSS đã biên dịch và bỏ layer; `css/font.css` chứa cấu hình font; `css/icons.css` ghi nhận không dùng icon font; `css/header.css` chỉ chứa header; `css/handoff.css` chứa điều hướng xem mẫu và chuyển vùng mobile. Giữ thứ tự stylesheet trong HTML. Không có `@layer`. Font Inter dùng khi có trên máy, nếu không dùng font hệ thống.

Đồng bộ từ ứng dụng hiện tại: `node scripts/export-handoff.cjs`, sau đó `node scripts/qa-handoff.cjs`. Nếu môi trường chưa resolve Playwright, đặt `PLAYWRIGHT_MODULE` tới module đã cài. `CHROME_PATH` tùy chọn chỉ định Chrome. Không sửa file xuất bằng tay; sửa exporter hoặc source tương ứng rồi xuất lại. Báo cáo kiểm tra nằm ở `docs/handoff-qa.json`; screenshot không đưa vào commit.
