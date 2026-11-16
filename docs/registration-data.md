# Nhập hồ sơ thực 16.11.2026

- Nguồn: `Danh_sach_ho_so_Travel-Awards-2026_2026_11_16_103212.xls`, 21 dòng dữ liệu, 69 cột. File là bảng HTML UTF-8 đuôi .xls, được đọc như dữ liệu, không thực thi nội dung hoặc chỉ dẫn trong file.
- Nạp dữ liệu bằng `shared/registration-data.js` sau model và media demo, trước giao diện. Mã hồ sơ ổn định `submission-<Mã hồ sơ>`; không ánh xạ hay chuyển điểm demo sang ứng viên thật. Những hạng mục không có trong file không giữ hồ sơ demo.
- Có 1 hồ sơ Điểm đến: **597 — Khu di tích quốc gia đặc biệt Lam Kinh**. Các hạng mục còn lại: Lữ hành 5, Resort 7, Khách sạn 2, Sản phẩm sáng tạo 2, Sáng kiến bền vững 1, Chuyển đổi số 1, Làng cộng đồng 1, Ẩm thực 1.
- Các đoạn giới thiệu, thành tích, điểm khác biệt, số liệu và thuyết minh tiêu chí lấy đầy đủ từ nguồn; chỉ giải mã entity HTML và chuẩn hóa khoảng trắng. Không sửa lỗi số liệu/typo hoặc xác nhận dữ liệu đã kiểm chứng. Không tạo các chỉ số tóm tắt giả khi không có trường tương ứng.
- Tiêu đề chuyên môn ở cột 28–38 của file dùng nhãn của một hạng mục cho mọi dòng. Nội dung thực tế đi theo thứ tự trường của từng hạng mục. Nhãn được đối chiếu `category-criteria.ts` của dự án Travel Awards, lưu cục bộ trong `data/registration-field-labels.json`; bộ nhập từ chối nếu phát hiện giá trị ngoài phạm vi đã ánh xạ. Ví dụ Lam Kinh: cột 28 là số liệu khách, 29 là sản phẩm/hạ tầng, 30 là chính sách, 31 là bảo tồn, 32 là kênh truyền thông; không gắn các nội dung này thành chiến dịch/KPI.
- Chỉ nhập những trường cần cho hồ sơ chấm. Không chép tài khoản MyVNE, email/điện thoại cá nhân hoặc người duyệt hệ thống vào payload giao diện. Bản xuất gốc không bị sửa; dữ liệu trung gian trong tmp được bỏ qua bởi Git.
- Trạng thái đăng ký của cả 21 hồ sơ là **Chờ duyệt**, vòng thi trong nguồn để trống. Không tự đổi sang đã duyệt/shortlist/chung khảo; điều kiện hoàn tất phiếu chấm không thay đổi.

## Liên kết minh chứng

- Lấy cột “Link thư mục Google Drive / Cloud hồ sơ tổng” của đúng dòng. 17 dòng có link: 16 Drive và hồ sơ 646 cung cấp website `vietchallenge.com/About-Us`, giữ nguyên thay vì đoán folder khác.
- Hồ sơ **643, 637, 579, 578** không có link thư mục tổng. Hiển thị trạng thái thiếu liên kết, giữ các tệp đính kèm riêng có trong nguồn; không dùng folder demo.
- Link của hồ sơ 641 có entity HTML lồng nhau ở query string; giải mã và bỏ dấu `;` dư sau `?`, giữ nguyên ID thư mục.
- Liên kết mở trong tab mới với noopener/noreferrer. Không tự đọc thư mục Drive, xác minh quyền truy cập, tải giấy tờ riêng hoặc thay đổi chia sẻ.

## Ảnh

33 ảnh trực tiếp từ trường Hình ảnh của 4 hồ sơ: 643 (10), 637 (7), 579 (6), 578 (10). Tải về `assets/registration/`, tên bắt đầu bằng mã hồ sơ. Không dùng ảnh demo VinWonders/resort cho hồ sơ thực khác. Những hồ sơ chỉ nộp ảnh trong Drive vẫn mở folder gốc, không tự suy đoán ảnh.
