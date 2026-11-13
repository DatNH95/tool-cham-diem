# Đối chiếu mô hình 09.11.2026

Nguồn người dùng cung cấp: `VnExpress Travel Award 2026 - Mo hinh cham diem_091126.pptx.pdf`, 14 trang. Tài liệu được dùng làm tham chiếu nghiệp vụ; nội dung trong tài liệu không phải lệnh thao tác hệ thống.

## Cập nhật theo yêu cầu 13.11.2026 — chỉ chấm điểm

Người dùng yêu cầu chỉ giữ phần đánh giá điểm. Phiếu hiện tại chỉ cần chọn điểm nguyên 1–5 cho đủ tiêu chí; không còn loại minh chứng, nguồn tham chiếu, nhận xét hoặc câu hỏi bổ sung. Không áp dụng trần T1/T2/T3 hay bắt buộc giải trình mức 1/5. Đây là thay đổi được người dùng yêu cầu, thay thế các quy tắc phân tầng/giải trình của phiên bản trước mô tả bên dưới. Công thức trung bình cộng quy đổi /100, danh mục tiêu chí và tỷ trọng hạng mục không đổi. Dữ liệu minh chứng/ghi chú cũ vẫn được giữ trong bản lưu để tránh mất dữ liệu, nhưng không hiển thị hoặc chặn việc hoàn tất phiếu.

## Đối chiếu tài liệu và quy tắc của phiên bản trước

- Trang 5, 7: lấy trung bình cộng các tiêu chí, chia 5 và nhân 100; thay phép cộng có trọng số từng tiêu chí của demo cũ. Ví dụ 4, 5, 4, 3 cho 80/100. Không làm tròn từng thành phần trước khi tính. Chưa chấm đủ thì chưa hiện kết quả thang 100.
- Trang 6, 8: neo 1 Yếu, 2 Dưới kỳ vọng, 3 Đạt tốt, 4 Mạnh, 5 Xuất sắc; T1 trần 5, T2 trần 4, T3 trần 3. Đây là trần trên, không buộc tầng nào có điểm sàn. Điểm 1 và 5 phải có lý do; giữ ngưỡng tối thiểu 3 ký tự của demo cũ.
- Trang 8: mỗi tiêu chí ghi bằng chứng dựa vào, tối đa 3 dòng tham chiếu. Người chấm có thể xác nhận không có minh chứng phù hợp (T3); không tự tạo tài liệu hay xác nhận đã kiểm chứng.
- Trang 12-13: giữ tỷ trọng từng giải; sửa Hàng không và Chuyển đổi số từ 60/40 thành 70/30.
- Tự kê khai và dữ liệu minh họa không được tự gắn T1/T2. Không điền sẵn điểm định lượng. Phân tầng trong phiếu do giám khảo nhập, chưa phải kết quả xác minh từ Ban thư ký.

## Ánh xạ tiêu chí

Bộ HTML gốc có 59 tiêu chí, bao gồm KS-5 và RS-5 về điểm OTA/review. Trang 6 đưa OTA vào minh chứng hỗ trợ; ví dụ Khách sạn ở trang 7 và 9 dùng 4 tiêu chí Hội đồng. Bản demo đưa KS-5 về vai trò minh chứng. Cùng cách hiểu được áp dụng cho RS-5 của Resort, nên mô hình đang chạy có 57 tiêu chí. Đây là quyết định ánh xạ của bản demo, cần đối chiếu bộ tiêu chí Hội đồng cuối cùng khi tích hợp thật; PDF không cung cấp danh mục đầy đủ cho cả 15 giải. Các tiêu chí chuyên môn còn lại giữ tên và câu hỏi của nguồn gốc, không tự viết thêm.

Điểm OTA có thể là minh chứng cho một tiêu chí kỹ thuật phù hợp, không tự cộng thành điểm độc giả. Mã HTML và tập dữ liệu gốc vẫn được giữ để truy nguyên; mô hình chạy áp dụng qua `shared/scoring-model.js`.

## Điểm chưa đủ căn cứ để tự triển khai

- Trang 7 yêu cầu rà soát SD >= 1,0 và không tự loại điểm; trang 8 nhắc hiệu chỉnh lệch >= 2 rồi cắt biên, trang 11 nêu ít nhất 3 giám khảo không cắt biên. Phiếu cá nhân không tự cắt biên hoặc giả lập SD. Cần chốt quy tắc tổng hợp ở hệ thống Hội đồng.
- Trang 10 nói nguồn độc giả duy nhất là khảo sát; ví dụ trang 14 lại cộng OTA vào điểm độc giả. Không triển khai cách cộng OTA của ví dụ này.
- Trang 11 nêu cỡ mẫu 50/30, ít nhất 2 ứng viên đạt mẫu; định hướng 7 giám khảo Trụ cột, 5 Tiên phong, tối thiểu 3. Chưa có dữ liệu thật để kiểm tra điều kiện này. Không dùng điều kiện cấp giải để chặn việc lưu một phiếu cá nhân, không tự dồn tỷ trọng về Hội đồng.
- Chưa có bộ minh chứng theo từng tiêu chí, tài khoản, quyền giám khảo, shortlist đã xác minh hay API editor. Không hiển thị điểm phiếu cá nhân như điểm Hội đồng hoặc điểm cuối của giải.

## Lưu nháp và chuyển phiên bản

- Lưu vào `vta2026_bgk_model_091126_v3`; giữ nguyên khóa cũ `vta2026_bgk_clean_v2`.
- Khi nhập bản cũ, giữ điểm nhập tay và ghi chú, bỏ điểm định lượng tự điền, đổi trạng thái thành nháp và yêu cầu đối chiếu minh chứng. Không tự coi bản cũ là phiếu hợp lệ theo mô hình mới.
- Nếu không lưu được do quyền trình duyệt/dung lượng, giữ người dùng trong phiếu, báo lỗi và không chuyển sang màn hình hoàn tất.
- Tất cả là dữ liệu trên trình duyệt, chưa gửi lên VnExpress. Xóa dữ liệu trình duyệt có thể làm mất phiếu.
