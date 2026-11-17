# Vùng hiển thị Hội đồng chấm hồ sơ

Đối chiếu chat “Specs rule tool chấm điểm BGK”: 13 tài khoản được phép chấm cùng hồ sơ/hạng mục; mỗi phiếu độc lập theo kỳ giải, hồ sơ, giám khảo. Chỉ bổ sung thiết kế giao diện và hợp đồng dữ liệu trong lần sửa này, không triển khai database, đăng nhập hoặc sửa cơ chế lưu nháp hiện tại.

## Giao diện

- Nằm trên hai cột hồ sơ/phiếu chấm, tiêu đề “Hội đồng chấm hồ sơ”.
- Tóm tắt số BGK đã chấm / 13 khi đã nhận đủ danh sách và trạng thái. Mở danh sách xem tên, avatar chữ cái và trạng thái từng người; tài khoản hiện tại có nhãn “Bạn”.
- Vùng “Người chấm phiếu này” lấy từ tài khoản đăng nhập; không phải dropdown để chọn hoặc giả danh BGK khác.
- Trạng thái server: `submitted` → Đã chấm; `not_started` → Chưa chấm; `in_progress` → Đang chấm nếu hệ thống có thông tin này. Thiếu dữ liệu → Chưa đồng bộ, không được suy ra Chưa chấm.
- Không hiển thị điểm hoặc giải trình của BGK khác. Phiếu đang lưu trong trình duyệt không được đánh dấu là phiếu đã gửi database.
- Chưa có danh sách tên thật: 13 vị trí BGK 01–13, không tự đặt tên. Dữ liệu cấu hình mẫu trong `shared/judge-panel.js` để trống.

## Hợp đồng tích hợp đề xuất

`GET /editions/{editionId}/entries/{entryId}/judge-statuses`

```json
{
  "editionId": "travel-awards-2026",
  "entryId": "597",
  "currentJudgeId": "judge-01",
  "judges": [{"id": "judge-01", "name": "Tên tài khoản từ hệ thống"}],
  "ballots": [{"judgeId": "judge-01", "status": "submitted", "ballotId": "ballot-uuid", "submittedAt": "2026-11-17T03:00:00Z"}]
}
```

Ví dụ schema, không phải dữ liệu đã gửi: API trả đủ 13 tài khoản thực và trạng thái đúng hồ sơ. Adapter gắn `judges`, `currentJudgeId` và `ballotsByProfile[profile.id]` vào `JUDGE_PANEL_DATA`, rồi render lại. Tách `entryId` nguồn (597) khỏi ID UI (`submission-597`) khi gọi API. Backend lọc quyền của tài khoản đăng nhập; không tin currentJudgeId hay tên do client tự truyền.

DB cần khóa duy nhất **(edition_id, entry_id, judge_id)** cho phiếu và **(ballot_id, criterion_id)** cho điểm từng tiêu chí. Phiếu có ID riêng, trạng thái, phiên bản, thời điểm gửi; lưu lý do điểm 5 và nhận xét tùy chọn 1–4 riêng theo phiếu. Chống gửi lặp bằng idempotency/version; chấm lại chỉ cập nhật phiếu của đúng BGK và giữ lịch sử theo chính sách BTC. Sau API hoàn tất thành công mới đổi trạng thái thành Đã chấm và tải lại tiến độ Hội đồng. Không đổi công thức hoặc dùng điểm local của một người để tính kết quả Hội đồng.
Cập nhật theo yêu cầu: dùng 13 tên minh họa, mô phỏng 5 BGK đã chấm, 1 đang chấm; tài khoản hiện tại mô phỏng là Nguyễn Minh Anh và phản ánh phiếu local đang thao tác. Các trạng thái này chỉ phục vụ xem thử, không ghi vào database hay dùng tính điểm Hội đồng. Khi nối API phải thay toàn bộ danh sách và trạng thái bằng dữ liệu tài khoản thật.

## Tách phiếu theo BGK — 17.11.2026

- Khóa nghiệp vụ: (edition_id, entry_id, judge_id). Mỗi phiếu có editionId, profileId, judgeId; điểm/ghi chú/trạng thái thuộc riêng BGK đó. Tiến độ hạng mục tính cho BGK hiện tại.
- Demo lưu mỗi BGK ở một khóa localStorage riêng; BGK demo-01 giữ khóa cũ để bảo toàn phiếu. Bản cũ không có chủ sở hữu chỉ thuộc phiên demo-01, không sao chép cho 12 BGK khác. Bản cũ có judgeId khác được giữ trong bản gốc, không gán lại cho người đang chấm.
- Có lựa chọn Chuyển BGK thử nghiệm, nhớ tài khoản thử nghiệm theo tab. Lỗi lưu chặn chuyển để giữ nội dung đang nhập. Trạng thái đã lưu được ưu tiên hơn trạng thái minh họa của roster.
- Đây là mô phỏng trình duyệt. Khi tích hợp, bỏ lựa chọn thử nghiệm, lấy judge_id từ session server; server kiểm tra quyền và UNIQUE(edition_id, entry_id, judge_id), upsert chỉ phiếu của chủ sở hữu. API danh sách BGK chỉ trả tên/trạng thái, không trả điểm hoặc giải trình của người khác. Dùng version/revision để phát hiện xung đột hai tab của cùng BGK; localStorage không thay thế xác thực hay cơ chế đồng thời ở database.
- Kiểm tra: scripts/qa-judge-isolation.cjs chạy hai tab cùng hồ sơ 597, lưu hai phiếu 60/80 cùng ghi chú riêng, tải lại, chuyển BGK và chặn chuyển khi lỗi lưu. Không thay công thức hay tổng hợp Hội đồng.
