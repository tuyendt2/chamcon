// Content of the app: checklists, periodic tasks and tips. Edit here to change wording.

// Every evening. `med: true` items only show when "thuốc dự phòng hen" is on in Settings.
export const EVENING = [
  { id: "measure", title: "Đo nhiệt độ & độ ẩm phòng ngủ", detail: "Nhập số đo bên dưới, app sẽ báo nếu cần chỉnh." },
  { id: "cream", title: "Bôi kem dưỡng ẩm toàn thân cho bé", detail: "Thoa lớp dày, tốt nhất trong 3 phút sau khi tắm, xoa nhẹ theo chiều lông. Chỗ da khô nhiều thoa thêm lớp nữa." },
  { id: "med", med: true, title: "Cho bé dùng thuốc dự phòng hen", detail: "Đúng liều theo đơn, kể cả hôm bé khỏe. Sau khi hít, cho bé uống ngụm nước / lau miệng." },
  { id: "purifier", title: "Bật máy lọc không khí trong phòng ngủ", detail: "Đóng cửa phòng để máy lọc hiệu quả. Kiểm tra đèn báo bộ lọc." },
  { id: "clothes", title: "Đồ ngủ cotton, chăn mỏng, không ủ quá ấm", detail: "Bé ra mồ hôi sẽ ngứa hơn. Không dùng chăn bông, chăn lông." },
];

// Every weekend (Saturday, leftovers on Sunday).
export const WEEKLY = [
  { id: "bedding", title: "Giặt ga, vỏ gối, vỏ chăn của bé", detail: "Giặt nước nóng ≥ 60°C (chế độ giặt nóng) để diệt mạt bụi, phơi nắng hoặc sấy thật khô. Dùng nước giặt không mùi, xả kỹ." },
  { id: "vacuum", title: "Hút bụi nệm, sàn, gầm giường", detail: "Dùng máy hút có lọc HEPA nếu có. Làm khi bé không ở trong phòng, sau đó để máy lọc chạy 30–60 phút." },
  { id: "wipe", title: "Lau bụi bằng khăn ẩm", detail: "Đầu giường, kệ, cánh quạt, bậu cửa, rèm. Khăn ẩm giữ bụi, chổi lông chỉ làm bụi bay lên." },
  { id: "purifier", title: "Vệ sinh tấm lọc thô máy lọc Daikin", detail: "Tắt máy, rút điện, hút bụi tấm lọc thô phía trước. Làm đúng theo sách hướng dẫn của model nhà bạn." },
  { id: "ac", title: "Vệ sinh lưới lọc điều hòa", detail: "Tháo lưới lọc, rửa nước sạch, phơi khô trong bóng râm rồi lắp lại." },
  { id: "toys", title: "Thú bông & chăn lông ra khỏi giường", detail: "Thú bông bé hay ôm: giặt nóng, hoặc bỏ túi kín để ngăn đá 24 giờ rồi giặt để diệt mạt bụi." },
  { id: "spacer", med: true, title: "Rửa buồng đệm / mặt nạ hít", detail: "Ngâm nước ấm pha chút nước rửa bát, tráng sạch, để khô tự nhiên (không lau khăn, tránh tĩnh điện bám thuốc)." },
  { id: "nails", title: "Cắt ngắn, dũa mịn móng tay bé", detail: "Giảm trầy xước, nhiễm trùng da khi bé gãi." },
  { id: "meters", title: "Lau nhiệt – ẩm kế, kiểm tra pin", detail: "Đặt ngang tầm giường, xa luồng gió điều hòa, cửa sổ và máy lọc." },
];

// Longer intervals: become "đến hạn" after `days` since last done.
export const PERIODIC = [
  { id: "curtains", days: 30, title: "Giặt rèm cửa, thảm phòng ngủ", detail: "Tốt nhất bỏ thảm khỏi phòng bé. Rèm vải giặt nóng." },
  { id: "pillow", days: 30, title: "Phơi nắng ruột gối, nệm", detail: "Phơi 2–3 giờ nắng, đập/hút bụi trước khi mang vào." },
  { id: "mold", days: 30, title: "Kiểm tra nấm mốc", detail: "Góc tường, sau tủ, tủ quần áo, khay nước điều hòa. Có mốc thì xử lý ngay và giảm độ ẩm phòng." },
  { id: "expiry", days: 30, title: "Kiểm tra kem dưỡng & thuốc", detail: "Hạn dùng, lượng còn lại. Mua thêm trước khi hết, đừng để gián đoạn thuốc dự phòng." },
  { id: "acdeep", days: 90, title: "Vệ sinh điều hòa chuyên sâu (gọi thợ)", detail: "Dàn lạnh bẩn là nơi nấm mốc, vi khuẩn phát triển rồi thổi vào phòng." },
  { id: "doctor", days: 90, title: "Tái khám / trao đổi với bác sĩ", detail: "Mang theo tab Nhật ký: các đợt nổi mẩn và số đo phòng giúp bác sĩ tìm tác nhân." },
  { id: "deodor", days: 180, title: "Bộ lọc khử mùi / HEPA máy lọc Daikin", detail: "Rửa hoặc thay theo sách hướng dẫn và đèn báo của máy." },
  { id: "calib", days: 180, title: "Kiểm tra độ chính xác ẩm kế", detail: "Thử muối: muỗng muối ẩm (vài giọt nước) cùng ẩm kế trong hộp kín 8–12 giờ. Ẩm kế đúng chỉ khoảng 75%; lệch bao nhiêu thì nhớ bù bấy nhiêu." },
];

export const TIPS = [
  { cat: "Da", text: "Quy tắc 3 phút: tắm xong, thấm nhẹ (không chà) rồi thoa kem dưỡng ngay khi da còn ẩm." },
  { cat: "Da", text: "Tắm nước ấm (không nóng), 5–10 phút. Dùng sữa tắm dịu nhẹ, không xà phòng, không mùi." },
  { cat: "Da", text: "Kem dưỡng nên không mùi, không cồn. Mùa hanh khô có thể thoa 2–3 lần mỗi ngày, không chỉ buổi tối." },
  { cat: "Da", text: "Quần áo cotton mềm, giặt mới trước khi mặc lần đầu. Tránh len, đồ bó, đường may cứng." },
  { cat: "Da", text: "Không dùng nước xả vải có hương thơm cho đồ của bé; xả thêm một lần nước sạch." },
  { cat: "Phòng ngủ", text: "Độ ẩm trên 60% làm mạt bụi và nấm mốc phát triển mạnh; dưới 40% làm da khô. Mục tiêu 45–55%." },
  { cat: "Phòng ngủ", text: "Độ ẩm cao: bật chế độ Dry (khô) của điều hòa vài giờ, mở cửa thông thoáng lúc trời nắng ráo." },
  { cat: "Phòng ngủ", text: "Không khí khô: thoa kem kỹ hơn. Nếu dùng máy tạo ẩm, thay nước và vệ sinh hằng ngày để không sinh vi khuẩn." },
  { cat: "Phòng ngủ", text: "Bọc nệm và gối bằng áo chống mạt bụi (vải dệt dày, có khóa kéo) giảm đáng kể mạt bụi." },
  { cat: "Phòng ngủ", text: "Phòng bé càng ít đồ càng ít bụi: cất sách báo, thú bông, đồ vải vào tủ có cửa." },
  { cat: "Phòng ngủ", text: "Để máy lọc không khí ở chỗ thông thoáng, cách tường vài chục cm, không bị rèm che." },
  { cat: "Thời tiết", text: "Khi chuyển mùa, tránh cho bé đi đột ngột từ phòng lạnh ra ngoài trời nóng (và ngược lại). Chênh lệch trong–ngoài không nên quá 5–7°C." },
  { cat: "Thời tiết", text: "Ngày gió mùa, nồm ẩm: đóng cửa, bật máy lọc + chế độ Dry. Ngày hanh khô: bôi kem nhiều lần hơn." },
  { cat: "Mề đay", text: "Mỗi lần bé nổi mề đay, ghi vào Nhật ký: giờ, vị trí, bé vừa ăn gì, tiếp xúc gì. Sau vài lần sẽ thấy quy luật." },
  { cat: "Mề đay", text: "Chườm mát hoặc tắm nước mát giúp đỡ ngứa. Mặc đồ rộng, cắt móng để bé không gãi trầy." },
  { cat: "Mề đay", text: "Không tự ý cho bé uống thuốc chống dị ứng hay bôi thuốc có corticoid khi chưa hỏi bác sĩ." },
  { cat: "Mề đay", text: "Thức ăn mới cho bé thử từng loại một, cách nhau vài ngày, để biết món nào gây dị ứng." },
  { cat: "Hen", text: "Thuốc dự phòng hen chỉ hiệu quả khi dùng đều mỗi ngày. Đừng ngưng khi bé khỏe nếu bác sĩ chưa dặn." },
  { cat: "Hen", text: "Xin bác sĩ một 'kế hoạch hành động hen' bằng giấy: dùng thuốc gì khi nào, khi nào phải đi viện." },
  { cat: "Hen", text: "Tuyệt đối không hút thuốc trong nhà, kể cả ban công. Khói thuốc bám vào quần áo, tóc cũng ảnh hưởng bé." },
  { cat: "Hen", text: "Tiêm phòng cúm hằng năm rất quan trọng với trẻ bị hen. Hỏi bác sĩ về lịch tiêm." },
  { cat: "Đề kháng", text: "Trẻ 2 tuổi cần ngủ khoảng 11–14 tiếng mỗi ngày (cả giấc trưa). Ngủ đủ giúp đề kháng tốt và bớt ngứa." },
  { cat: "Đề kháng", text: "Bữa ăn đa dạng: rau xanh, trái cây nhiều màu, cá, trứng (nếu bé không dị ứng). Uống đủ nước." },
  { cat: "Đề kháng", text: "Cho bé chơi ngoài trời mỗi ngày lúc không khí tốt, tránh giờ nắng gắt và ngày bụi mịn cao." },
  { cat: "Đề kháng", text: "Rửa tay cho bé và cả nhà sau khi đi ngoài về, trước khi ăn. Thay quần áo đi đường trước khi bế bé." },
  { cat: "Đề kháng", text: "Hạn chế đồ ngọt, đồ ăn chế biến sẵn, nhiều phẩm màu, chất bảo quản." },
];

export const EMERGENCY = [
  "Khó thở, thở rít, thở nhanh, co lõm ngực, khò khè nặng",
  "Sưng môi, mí mắt, mặt, lưỡi",
  "Nôn nhiều, lừ đừ, tái hoặc tím môi sau khi nổi mề đay",
  "Thuốc cắt cơn hen không đỡ hoặc phải dùng liên tục",
];

export const SEE_DOCTOR = [
  "Mề đay kéo dài nhiều ngày hoặc tái đi tái lại",
  "Bé sốt, da rỉ dịch, có mủ, đỏ lan rộng",
  "Ngứa làm bé mất ngủ nhiều đêm",
  "Bé ho, khò khè về đêm thường xuyên hơn",
];
