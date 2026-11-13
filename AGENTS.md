# Tool chấm điểm BGK — Travel Awards 2026

- Trao đổi bằng tiếng Việt, ngắn gọn. Chỉ thay đổi trong phạm vi người dùng yêu cầu.
- Quy ước tham chiếu: `C:/Users/haidat/Desktop/Travel Awards 2026/Vibe code/travel-awards-2026/AGENTS.md`. Yêu cầu mới của người dùng ưu tiên hơn ghi chú cũ. Chỉ áp dụng quy tắc phù hợp với repo công cụ HTML tĩnh; không tự đưa Next.js hoặc bộ handoff Phase 1/2 vào repo này.
- Giữ nhận diện Travel Awards, tái sử dụng asset/CSS dùng chung. Không tự đổi nội dung chính thức hoặc cách tính điểm. Hiện là demo front-end; không mô tả dữ liệu trình duyệt là dữ liệu đã ghi nhận ở server, không tự thêm backend/xác thực.

## Khi người dùng nói “đẩy lên GitHub”

Người dùng đã cho phép commit/push repo này và đồng bộ bản demo Vercel trong cùng yêu cầu; không hỏi xác nhận lại theo thông lệ.

1. Kiểm tra status/diff và phạm vi file; fetch origin một lần. Bảo toàn thay đổi local, đồng bộ origin/main khi tồn tại. Nếu conflict, dừng và báo; không tự chọn phiên bản, không force push.
2. Kiểm tra và sửa lỗi liên quan trong phạm vi thay đổi, chạy `node verify.cjs` và kiểm tra bổ sung phù hợp. Không push khi kiểm tra cần thiết còn lỗi. Không tự tái tạo index.html bằng build-integration.cjs nếu có thể ghi đè chỉnh sửa hiện tại.
3. Chỉ stage file thuộc công cụ; không đưa credential, dữ liệu giám khảo thật, file phát sinh hoặc screenshot QA vào commit. Commit message ngắn; push `origin main` của `https://github.com/DatNH95/tool-cham-diem.git`.
4. Kiểm tra liên kết Vercel thực tế, production branch và deployment của đúng commit. Nếu repo đã có project Vercel, dùng project đó; không tạo trùng. Nếu chưa liên kết, xác định project/account phù hợp trước khi triển khai, không mặc định push đồng nghĩa deploy thành công.
5. Theo dõi deployment đến kết quả, kiểm tra URL demo và chức năng bị ảnh hưởng. Báo rõ nếu GitHub thành công nhưng Vercel chưa thành công, cùng nguyên nhân thực tế.
6. Trả lời ngắn với commit hash, URL `https://github.com/DatNH95/tool-cham-diem/commit/<full-hash>.diff` và URL demo Vercel đã xác minh. Không tạo CHANGELOG.md.

Không tự push/deploy chỉ vì sửa code; thực hiện khi người dùng yêu cầu đẩy hoặc triển khai.

## Bản bàn giao cho Tech

- Mỗi lần yêu cầu đẩy GitHub, tự chạy `node scripts/export-handoff.cjs`, kiểm tra `node scripts/qa-handoff.cjs` và đưa `hand-off/` vào cùng commit với source. Dùng Playwright đã có sẵn, hoặc đặt `PLAYWRIGHT_MODULE` tới module; không cài dependency vào bộ bàn giao.
- `hand-off/` chỉ chứa `.html` và `.css`: các mẫu giao diện tĩnh đã render đủ nội dung, không script, event handler, runtime, Shadow DOM hay thư mục phụ thuộc. Logo SVG nhúng data URI trong HTML. Hướng dẫn Tech nằm ở `docs/handoff.md` ngoài bộ bàn giao.
- Theo format Travel Awards: `body.home > header.home-header`, nội dung trong `section#main`, không wrapper `div.home` hoặc `main`; không tự thêm footer vì công cụ hiện không có footer. CSS không có `@layer`; tách `css/font.css`, `css/icons.css`, CSS bố cục và header. Link mẫu nội bộ dùng file HTML tương đối.
- Các mẫu mô tả 4 bước với hồ sơ Khách sạn đại diện và ví dụ kết quả, không thay thế ứng dụng hoặc backend. Không trình bày nút lưu/gửi của mẫu tĩnh là đã tích hợp. Kiểm tra nội dung, asset, link, desktop/mobile và tab Hồ sơ/Phiếu chấm; lưu báo cáo QA ở docs, screenshot trong tmp.

## Mô hình chấm 09.11.2026

- Tham chiếu `docs/scoring-model.md` trước khi sửa nghiệp vụ. Cập nhật theo yêu cầu 13.11.2026: chỉ chọn điểm nguyên 1–5 cho từng tiêu chí, không có loại minh chứng, nguồn tham chiếu, nhận xét hoặc câu hỏi bổ sung; không áp dụng trần T1/T2/T3 và không yêu cầu giải trình mức 1/5. Giữ trung bình cộng quy đổi /100; tỷ lệ Hàng không và Chuyển đổi số là 70/30.
- `index.html` giữ mã gốc để truy nguyên; mô hình/giao diện được áp dụng bởi `shared/scoring-model.js` rồi `shared/editor-workspace.js`. Không tái tạo HTML để ghi đè chỉnh sửa ngoài phạm vi.
- Không tự tạo minh chứng đã xác minh, điểm độc giả, điểm Hội đồng tổng hợp hay quy tắc cắt biên. Ánh xạ OTA KS-5/RS-5 thành minh chứng là quyết định demo đã ghi rõ, cần đối chiếu danh mục cuối cùng khi tích hợp.
- Giữ bản nháp cũ khi nâng mô hình; lỗi lưu phải chặn hoàn tất và báo rõ. Kiểm tra `node verify.cjs`; khi đổi UI, chạy thêm `scripts/qa-workspace.cjs` với Playwright. Không commit `tmp/` hoặc screenshot QA.
