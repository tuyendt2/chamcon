# Chăm Con

App điện thoại (PWA, chạy offline) nhắc chăm sóc bé bị dị ứng cơ địa / mề đay / đang dùng thuốc dự phòng hen:

- **Mỗi tối:** đo nhiệt độ – độ ẩm phòng (app báo nếu cần chỉnh), bôi kem dưỡng, thuốc dự phòng, máy lọc.
- **Cuối tuần:** checklist vệ sinh phòng ngủ; thứ 7 nhắc, Chủ nhật nhắc phần còn sót.
- **Việc định kỳ:** rèm, điều hòa chuyên sâu, bộ lọc Daikin, tái khám…
- **Nhật ký:** số đo phòng 14 ngày + các đợt nổi mẩn, mang theo khi đi khám.
- **Lời khuyên:** mẹo mỗi ngày, dấu hiệu cần đi cấp cứu.

Nhắc việc: thêm lịch lặp lại vào Google Calendar / file .ics (tab Cài đặt), và thông báo nền trên Chrome Android khi đã cài app.

Không có bước build. Chạy thử: `npm run serve`. Đăng lên GitHub Pages: `npm run deploy` (đẩy lên nhánh gh-pages).
Nội dung checklist và lời khuyên nằm trong `data.js`. Đổi `VERSION` trong `sw.js` mỗi lần deploy.
