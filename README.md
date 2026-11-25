# Mom's 49th Adventure

Trò chơi 3D nhỏ (khoảng 3 phút) chúc mừng sinh nhật mẹ 49 tuổi (đổi tuổi ở `MOM_AGE` trong `src/content/texts.ts`). Mẹ chơi trên iPhone, màn hình dọc.

## Luồng chơi
1. Màn mở đầu, rồi màn hướng dẫn chỉ thẳng vào joystick và nút chạm.
2. **Về nhà:** đi theo vòng sáng tới hiên nhà và bấm chuông (màn này dạy cách tương tác).
3. **Tìm kỷ niệm:** nhặt 3 bông hoa phát sáng trong vườn. Mỗi bông mở ra một tấm ảnh kỷ niệm. Trời tối dần và đèn lồng sáng lên theo từng bông.
4. **Bất ngờ:** đi theo ánh đèn tới hiên gỗ và mở hộp quà. Sau đó là pháo hoa, lời chúc, rồi tới lá thư.

Trong game không có thua và không giới hạn thời gian. Đứng gần đồ vật khoảng 7 giây thì game tự tương tác giúp mẹ. Đứng yên lâu thì có lời nhắc, và luôn có mũi tên dưới chân chỉ đường.

## Sửa nội dung
| Muốn sửa | File |
|---|---|
| **Lá thư** | `src/content/letter.md`: mỗi đoạn cách nhau một dòng trống, dòng `# ...` là tiêu đề, dòng `— ...` là chữ ký |
| **3 kỷ niệm (ảnh và chữ)** | `src/content/memories.ts`. Bỏ ảnh vào `public/photos/` rồi ghi `photo: 'photos/ten-anh.jpg'` |
| **Mọi chữ khác trong game, tuổi của mẹ** | `src/content/texts.ts` |
| **Bài hát chúc mừng sinh nhật** | `src/content/music.ts`: mặc định là giai điệu "Chúc mừng sinh nhật" kiểu hộp nhạc; muốn dùng bản thu riêng thì bỏ file mp3 vào `public/music/` rồi ghi đường dẫn |

Ảnh nên là ảnh vuông, rộng khoảng 1000px, dạng JPG, để tải nhanh.

## Chạy thử
```bash
npm install
npm run dev
```
Để thử trên iPhone: máy tính và điện thoại dùng chung Wi-Fi, rồi mở địa chỉ "Network" mà Vite in ra.

## Đưa lên mạng để gửi link cho mẹ
```bash
npm run build
```
Sau đó đưa thư mục `dist/` lên một trong hai chỗ sau:
- **Netlify Drop** (app.netlify.com/drop): kéo thả thư mục `dist` là có link ngay.
- **Vercel**: chạy `npx vercel` trong thư mục dự án.

## Kỹ thuật
Vite + React + React Three Fiber + drei + postprocessing + zustand. Toàn bộ mô hình 3D và âm thanh đều được tạo bằng code, không cần tải file asset, nên gói nén chỉ khoảng 310 KB.
- `src/game/`: thế giới 3D, nhân vật, camera, nhiệm vụ, pháo hoa (`layout.ts` là bản đồ)
- `src/audio/audio.ts`: nhạc nền yên bình (pad ấm + hộp nhạc), gió, chim hót, dế kêu và các hiệu ứng âm thanh
- `src/ui/`: joystick, nút tương tác, các màn hình phủ
