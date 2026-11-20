# Nâng cấp Phở Anh Hai (2 bản: Toán 5 Bài 22 và VioEdu Toán 3 Tuần 3)

Tệp thay đổi: `pho-anh-hai-bai22.html`, `pho-anh-hai.html`, `script.js` (nhận kết quả từ game).

## 1. Hiệu quả giáo dục
| Trước | Bây giờ |
|---|---|
| Sai → game **hiện luôn đáp án**, học sinh chỉ gõ lại (chép) | Sai → bảng **"Giải cứu"** có các bước với **ô trống ▢** để tự điền; bí thì **👁 Hiện bước** (bước 0 → hiện đủ bước + hình đặt tính → hiện đáp án). Gõ đúng thì có dòng **thử lại bằng phép nhân** |
| Câu sai quay lại **cuối ca** bằng đúng câu cũ (nhớ đáp án là qua) | Sai → sau 2–3 câu gặp **bài tương tự cùng dạng, SỐ MỚI** (Toán 5 Bài 22 sinh ngẫu nhiên; Toán 3 dùng lại câu cũ vì là ngân hàng cố định). Tối đa 2 lần/câu, không vòng lặp vô hạn |
| Gợi ý chỉ là một câu mẹo | **Gợi ý 3 bậc**: 💡1 quy tắc + ước lượng → 💡2 bước đầu → 📖 xem cả lời giải (câu đó được hỏi lại bằng số mới, không tính điểm "đúng ngay") |
| Không biết em sai vì sao | **Chẩn đoán lỗi**: đặt sai dấu phẩy, quên nhân cả hai số với 10, chưa chia tiếp phần dư, dừng chia sớm, chia ngược, nhầm số chữ số 0… mỗi loại có lời nhắc riêng; thống kê "Em hay nhầm ở chỗ nào?" cuối ca |
| Không có ước lượng | Có dòng **ước lượng** ("thương nằm giữa 1 và 10") để tự kiểm tra vị trí dấu phẩy |
| Chỉ có chữ | **Hình đặt tính chia** như SGK (dấu phẩy tô đỏ, số 0 thêm vào mờ) + nút **🔊 Nghe cách làm** (đọc từng bước, tô sáng bước đang đọc) |
| Mỗi ca độc lập | **Trí nhớ dài hạn** (lưu trên máy): mức nhớ từng dạng; nút **🎯 Ôn trọng tâm** (10 câu ưu tiên dạng yếu) và **Luyện dạng A/B/C/D**; cuối ca có báo cáo Vững / Đã tự sửa được lỗi / Cần luyện thêm |
| Cảnh hài dài, mất thời gian luyện | Nút **⚡ Cảnh ngắn** tua nhanh các màn hài |

Báo cáo gửi về Math Nova thêm: tên từng dạng (`ruleNames`), lỗi hay gặp (`miscon`), kết quả bài tương tự (`twin`), thời gian trung bình (`avgSec`), chế độ (`mode`).
`script.js` dùng `ruleNames` do game gửi → **sửa lỗi cũ**: bản Toán 3 bị gán nhầm nhãn "Bài 22 · …" và mất dạng E–G.

## 2. Đồ họa (Three.js)
- Bóng đổ mềm (PCFSoft, 2048) và vignette điện ảnh.
- **Đổi ngày theo tiến độ**: sáng → trưa → chiều → tối (màu trời, sương, ánh sáng, cửa sổ, đèn lồng sáng dần).
- Biển hiệu **neon nhấp nháy** + quầng sáng; **hơi nước mềm** bằng sprite (bát phở và nồi).
- Khách có **chân, giày, dáng đi**, 5 kiểu (nón lá, kính, búi tóc, mũ lưỡi trai, khăn quàng).

## 3. Âm thanh
- Chuỗi master: **compressor** (chống vỡ tiếng) + **reverb** cho nhạc.
- **Giảm nhạc khi có giọng đọc** (ducking).
- Nhạc **đổi cường độ theo chuỗi đúng** (hi-hat, lead cao hơn, nhanh hơn) và **căng thẳng** khi giải cứu.
- Âm nền: tiếng quán, tiếng đường phố + còi xe máy lúc Cậu Vàng chạy; âm "ting" từng bước, "ping" gợi ý.

## 4. Hạn chế lỗi khung hình
- **Rò rỉ bộ nhớ GPU** khi chơi lâu: hạt, emoji, chữ nổi, khói trước đây không giải phóng → nay `dispose()` đầy đủ.
- **Tự hạ chất lượng** khi trung bình > 34 ms/khung: pixel ratio → 1,25 → 1, tắt bóng đổ và viền.
- Tạm dừng dựng hình khi ẩn tab; xử lý **mất/khôi phục WebGL context**.
- Bảng Giải cứu chia lại: lời nhắc ở trên, nút + ô nhập dính đáy một hàng; **màn hình ngang** đặt bảng bên phải, bong bóng thoại không đè lên bảng. Đã kiểm 7 cỡ màn hình (360×640 … 1920×1080).

## 5. Đã kiểm tra gì, chưa kiểm tra gì
Đã chạy tự động (Chromium): toàn bộ vòng chơi 2 bản (đúng, sai, gợi ý, bài tương tự, chế độ trọng tâm/luyện dạng, cảnh ngắn), 600 câu sinh ngẫu nhiên (hình đặt tính khớp đáp án 100%), bố cục 7 cỡ màn hình, chạy với Three.js giả để bắt lỗi tham chiếu. **Chưa xem được**: hình 3D thật và âm thanh thật (môi trường kiểm tra không có Three.js/loa) — hãy mở thử trên điện thoại và máy tính, nếu thấy màu trời tối quá hoặc nhạc to/nhỏ thì chỉnh bảng `TODS` và các hệ số `v:` trong khối âm thanh.
