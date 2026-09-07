# Gameplay và hoàn tác — 2026-09-07

## Các vấn đề đã sửa

- Bộ sinh màn cũ chỉ bù sức mạnh boss khi có phần thưởng, trong khi boss tăng sức mạnh ở mọi bước thực tế. Boss hiện giữ nguyên chỉ số; bộ sinh dùng cùng luật chiến đấu với game và tạo một đường thắng không lặp ô.
- Màn lớn, nhiều ô trống và bẫy không được giới thiệu rõ. Bàn hiện là 5×6 ở tầng 1–3 và 6×7 sau đó; bẫy chia xuất hiện từ tầng 3, đồ nhân từ tầng 4. Ô nguy hiểm có màu đỏ, bẫy chia màu tím, ô kề có viền.
- Chơi lại/hồi sinh từng đổi bản đồ và hình quái ngẫu nhiên. Hiện giữ nguyên bản đồ, chỉ số và hình ảnh trong cùng tầng. Mỗi tầng là một câu đố bắt đầu với 10 sức mạnh, được giải thích trong hướng dẫn.
- Thắng boss từng mở input trước khi chuyển tầng. Input hiện khóa suốt quá trình; lịch sử hoàn tác xóa khi thắng, chơi lại hoặc sang tầng.
- Sàn và animation cũ tích tụ khi chơi lại. Các ô sàn và đối tượng cũ được hủy, tween và timer được dọn khi rời scene.
- Hết nước đi an toàn hoặc sức mạnh về 0 nay có thông báo và lựa chọn phục hồi, không để bàn cờ đứng im.

## Quy tắc hoàn tác

- Một lần bấm lùi đúng một lượt. Có thể tiếp tục lùi theo lịch sử còn lại trong tầng.
- Snapshot giữ vị trí, sức mạnh, số bước, trạng thái sàn, toàn bộ quái/vật phẩm và texture. Không tính ngược đồ nhân/chia vì chia làm tròn xuống có thể mất thông tin.
- Lượt đánh thua cũng có snapshot riêng, kể cả khi thua ngay bước đầu. Lùi lượt này giữ nguyên vị trí trước trận đánh, không xóa nhầm lượt di chuyển trước đó.
- Mỗi ván có 3 lượt miễn phí. Chỉ trừ lượt khi khôi phục thành công. Chơi lại tầng không nạp lại lượt miễn phí.
- Hết lượt: nút ghi rõ `Xem QC · Lùi 1 bước`, huy hiệu `QC`. Một kết quả quảng cáo thành công đổi một lần hoàn tác; hủy/lỗi giữ nguyên bàn cờ, số lượt và lịch sử.
- Trong popup thất bại cũng có lựa chọn hoàn tác, dùng lượt miễn phí còn lại hoặc quảng cáo. Quảng cáo thất bại trả về popup và cho thử lại.
- Bấm lặp trong lúc xử lý bị bỏ qua. Kết quả quảng cáo đến sau khi scene bị hủy không tác động lên game mới.
- Nút không kích hoạt chỉ vì thả con trỏ lên nó; bắt buộc nhấn và thả cùng pointer trên nút. Nút khóa vẫn đọc được và không truyền thao tác vuốt xuống bàn.

## Kiểm tra

- `pnpm test` hoặc `node --test tests/*.test.mjs`: 8 bài kiểm tra, gồm 10.000 màn với seed cố định ở tầng 1–200, luật chiến đấu, bẫy, hết nước đi, snapshot, nhãn nút và input.
- `pnpm build`: Vite build và bước dọn asset. Trong sandbox này pnpm không đọc được cấu hình người dùng nên chạy tương đương bằng `node node_modules/vite/bin/vite.js build` và `node scripts/prune-unused-public-assets.mjs`.
- Kiểm tra trình duyệt Edge: chuỗi nhặt đồ cộng/nhân/chia, thắng quái, 3 lần lùi liên tiếp, thất bại ở bước đầu và sau khi di chuyển, bẫy gây sức mạnh 0, quảng cáo hủy/lỗi/thành công, chống bấm lặp, hủy scene khi chờ quảng cáo.
- Kiểm tra luồng chơi bổ sung: vuốt thật và phím mũi tên, 20 lần chơi lại giữ bản đồ/số ô, đi hết đường thắng, khóa thao tác lúc thắng, chuyển tầng, mắc kẹt và hoàn tác, settings và rời scene. Không ghi nhận JavaScript exception trong các lượt chạy thành công.
- Kiểm tra bố cục: 390×844, 320×568, 844×390, 1280×800. Màn ngang thấp đưa HUD sang hai bên để tăng kích thước bàn.

### Chạy lại kiểm tra rollback trong trình duyệt

1. Chạy dev server: `pnpm dev --host 127.0.0.1 --port 5177`.
2. Cung cấp Playwright trong môi trường Node, hoặc đặt `PLAYWRIGHT_MODULE_PATH` trỏ tới module Playwright có sẵn.
3. Chạy `pnpm test:browser`. Mặc định dùng Edge đã cài; có thể đặt `BROWSER_CHANNEL=chrome` và `GAME_URL` nếu cần.
4. Ảnh kiểm tra được lưu trong `qa.local/` (đã được bỏ qua bởi quy tắc `*.local`). Harness chỉ thêm truy cập game trong response của trình duyệt kiểm tra, không xuất debug global trong production.

## Giới hạn kiểm chứng

- AdManager của dự án hiện là mock. Kiểm tra rollback giả lập các kết quả quảng cáo; chưa xác nhận SDK quảng cáo thật.
- Mạng sandbox chặn Google Fonts; kiểm tra hình ảnh dùng font dự phòng. Chưa xác nhận tải font từ mạng thật, thời gian tải <5 giây, FPS trên thiết bị yếu hoặc Safari/Firefox.
- Đăng nhập API, bảng xếp hạng, toàn màn hình và nghe âm thanh thực tế chưa được kiểm chứng lại trong đợt sửa gameplay này. Các chỉnh sửa tích hợp/bảng xếp hạng đã có sẵn trong working tree không thuộc thay đổi này.
- Đường thắng được kiểm tra không đồng nghĩa mọi lựa chọn đều có thể thắng. Sàn sập vẫn cho phép người chơi tự đi vào ngõ cụt; hoàn tác giúp sửa lựa chọn đó. Độ khó/cảm giác chơi dài hạn cần phản hồi từ chơi thử thực tế.

## Rà soát phân bố quái/vật phẩm — 2026-09-07

Đợt kiểm tra này tập trung vào bộ sinh màn, giữ nguyên các thay đổi bố cục GameScene có sẵn.

### Vấn đề đo được trước khi sửa

Lấy 500 seed tại mỗi mốc tầng 1, 2, 3, 4, 5, 10, 20, 50, 100: tầng 1 có 0–12 quái thường; tầng 4 có 0–7 bẫy chia và 0–5 đồ nhân; một số quái thường mạnh hơn boss. Xác suất độc lập từng ô khiến hai bản đồ cùng tầng chênh lệch lớn.

### Phân bố mới (không tính 1 boss mỗi màn)

| Tầng | Bàn | Quái thường | Đồ cộng | Chia ÷2 | Nhân ×2 |
| --- | --- | --- | --- | --- | --- |
| 1–2 | 5×6 | 3 | 7 | 0 | 0 |
| 3 | 5×6 | 5 | 7 | 1 | 0 |
| 4–5 | 6×7 | 7 | 7 | 1 | 1 |
| 6–10 | 6×7 | 9 | 7 | 2 | 1 |
| 11–200 | 6×7 | 10 | 8 | 3 | 1 |

- Mở đầu có một đồ +2 trên đường thắng. Quái kề điểm xuất phát có sức mạnh dưới 10; bẫy và đồ nhân cách điểm xuất phát hơn 2 ô.
- Quái nhánh phụ được chia vào ba vùng của bàn và tăng chỉ số theo độ sâu. Quái thường yếu hơn boss.
- Bẫy chia không đứng cạnh nhau, không nằm trên đường thắng đã kiểm chứng. Đồ nhân giới hạn một món để tránh chuỗi nhân phá cân bằng.
- Đồ cộng nhánh phụ tăng theo tầng và vị trí; không giữ cố định +2…+5 trong khi boss tăng mãi.
- Boss giữ công thức 15 + 5 × tầng. Mỗi tầng bắt đầu từ 10; đường thắng tăng sức mạnh đủ vượt boss khoảng 10%, không quay lại sàn đã sập.
- Từ tầng 11, giữ mật độ để bàn không quá đông; chỉ số tiếp tục tăng. Bố cục và vị trí vẫn ngẫu nhiên, nhưng số lượng có ngân sách rõ ràng.

### Kiểm tra tự động mới

10 bài kiểm tra đạt: 10.000 lượt sinh màn kiểm tra đường thắng, 20.000 lượt sinh màn kiểm tra ngân sách từng loại, khoảng cách bẫy, mở đầu an toàn, sức mạnh quái và mật độ tối đa 60%; bổ sung các mốc chuyển nhóm và nguồn random cực trị, gồm tầng 1.000 và 1.000.000. Các bài combat, dead-end, rollback và input cũ tiếp tục đạt.

Đây là kiểm chứng khả năng giải và các giới hạn phân bố; không phải tỷ lệ thắng của người chơi. Cần phản hồi chơi dài hạn để tinh chỉnh độ khó cảm nhận.

Kiểm tra trình duyệt trong đợt cân bằng: chơi màn 1 bằng phím mũi tên, nhặt +2 (10 → 12), đánh quái 3 (→ 15), nhặt +3 (→ 18), đánh quái 15 (→ 33), thắng boss 20 và chuyển màn 2 với sức mạnh 10, boss 25. Build cuối bằng pnpm build thành công. Chưa chơi thủ công hết các tầng; tầng cao được kiểm tra bằng mô phỏng luật thực tế nêu trên.
