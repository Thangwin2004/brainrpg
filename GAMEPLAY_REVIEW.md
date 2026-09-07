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
