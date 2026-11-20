# Nâng cấp: Bài 23 + "sai thì chỉ hiện cách giải"

## 1. Bài 23 (Toán 5, SGK Kết nối tri thức tập 1, tr. 83–87)
Game mới: `pho-anh-hai-bai23.html` (Phở Anh Hai, 20 câu sinh ngẫu nhiên, 5 dạng):
- A. Nhân với 10; 100; 1 000;… (phẩy sang PHẢI)
- B. Nhân với 0,1; 0,01; 0,001;… (phẩy sang TRÁI)
- C. Chia cho 10; 100; 1 000;… (phẩy sang TRÁI)
- D. Chia cho 0,1; 0,01; 0,001;… (phẩy sang PHẢI)
- E. Vận dụng: đổi đơn vị đo, bài toán lời văn (gấu Bắc Cực, máy xúc, chồng giấy, thanh sắt, quán phở), chuỗi phép tính như bài luyện tập 1 SGK
Đã nối vào `script.js`: thẻ game ở Toán 5 (đứng trước Bài 22) + `PHO_META` để ghi XP/thống kê theo từng dạng.

## 2. Khi sai: không hiện đáp án, chỉ hiện cách giải (Bài 22 và Bài 23)
- Bảng "Giải cứu": các bước làm có ô trống ▢ để học sinh tự điền.
- Bấm "👁 Xem bài mẫu" (hoặc sai lần đầu) → hiện BÀI MẪU CÙNG DẠNG, SỐ KHÁC, giải đầy đủ.
- Bài 23: sai lần 2 thì mở đủ các bước của chính bài đó nhưng KHÔNG có kết quả cuối.
- Gợi ý bậc 3 (📖) cũng chỉ hiện bài mẫu số khác.
- Sai từ 4 lần: có nút "⏭️ Để lát làm lại" để không bị kẹt (vẫn không lộ đáp án; câu sẽ được hỏi lại bằng số mới).
- Màn tổng kết: câu đã sai chỉ hiện quy tắc/cách làm, không in đáp án.
- Chưa áp dụng cho `pho-anh-hai.html` (VioEdu Toán 3 tuần 3) vì ngân hàng câu cố định có lời giải ghi sẵn đáp án.

## 3. Lớp "cuốn hút" cho học sinh lười (Bài 22 và Bài 23)
- 🪙 Xu phở: mỗi câu đúng có xu, thưởng thêm theo chuỗi đúng liên tiếp và "⚡ Nhanh tay" (đúng trong 8 giây). Xu lưu trên máy, dùng chung giữa Bài 22 và Bài 23.
- 🎁 Rương bí ẩn: cứ 4 câu đúng (không dùng bài mẫu) là có một rương, học sinh chạm để mở: xu, 🛡️ khiên, ✨ xu nhân đôi hoặc mũ miễn phí.
- 🛡️ Khiên: sai mà còn khiên thì Cậu Vàng không bị bắt và không mất chuỗi, nhưng học sinh vẫn phải xem cách giải và gõ lại.
- 🛍️ Cửa hàng mũ: 6 mũ 3D cho Cậu Vàng (nón sinh nhật, mũ đầu bếp, kính râm, mũ cao bồi, mũ phù thủy, vương miện), mua bằng xu.
- 🔥 Chuỗi ngày: vào chơi mỗi ngày được thưởng xu, chuỗi càng dài thưởng càng nhiều. Có cấp bậc: Phụ bếp tập sự → Đầu bếp nhí → Bếp phó → Bếp trưởng → Huyền thoại phở.
- ⚡ Ca nhanh 5 câu: nút mới ở màn đầu để học sinh lười chịu chơi thử; vẫn đủ một rương.
- Màn tổng kết hiện số xu kiếm được trong ca và nút mua mũ.

## 4. Cờ Vua Dấu Phẩy (cho học sinh mê cờ vua): co-vua-bai23.html
- Bàn cờ + quân cờ 3D (Three.js), kéo/vuốt để xoay; tự chuyển sang bàn cờ 2D nếu máy không chạy được 3D.
- Mỗi câu Toán đúng = một nước đi THẬT trong ván cờ nổi tiếng, Đen tự đáp trả: Chiếu hết sau 4 nước (4 câu), Cái bẫy Légal (7 câu), Ván Nhà hát Opera của Morphy 1858 (17 câu). Cả ba ván đã kiểm tra từng nước đúng luật và kết thúc bằng chiếu hết.
- Sai: mất ❤️ (3 mạng), có bảng cách giải với các ô trống ▢ + bài mẫu số khác, KHÔNG hiện đáp án; sai nhiều thì có nút "Để lát làm lại".
- Elo (lưu trên máy, bắt đầu 800) + cấp bậc (Tân binh → Huyền thoại), ký hiệu nước đi ! / !! / ? / ?? như sách cờ, bảng ghi nước đi cuối ván, xếp 1–3 sao theo số mạng còn lại.
- Có thêm bài toán lời văn chủ đề cờ vua (bộ cờ, giải đấu, ván cờ chớp, đường chéo bàn cờ).
- Đã nối vào Math Nova (thẻ ở mục Trò chơi Toán 5, đứng đầu) và gửi kết quả theo từng dạng để cộng XP như game Phở.
