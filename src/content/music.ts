/**
 * Bài hát phát khi mẹ mở quà (pháo hoa) và trong lúc đọc thư.
 *
 * Mặc định (null): game tự chơi giai điệu "Chúc mừng sinh nhật" (Happy Birthday)
 * bằng tiếng hộp nhạc êm dịu, có hợp âm nền. Không cần file nào.
 *
 * Muốn dùng một bản thu khác (ví dụ con tự hát, hoặc một bài mẹ thích mà
 * con có quyền dùng): bỏ file .mp3 vào thư mục public/music/ rồi ghi, ví dụ:
 *   export const birthdaySongFile: string | null = 'music/chuc-mung-sinh-nhat.mp3'
 */
export const birthdaySongFile: string | null = null
