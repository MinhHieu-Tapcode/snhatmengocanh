/**
 * Ba kỷ niệm hiện ra khi mẹ chạm vào 3 bông hoa trong vườn.
 *
 * - title:   dòng tiêu đề ngắn
 * - caption: vài dòng con viết (có thể để trống "")
 * - photo:   ảnh thật (tuỳ chọn). Bỏ ảnh vào thư mục public/photos/
 *            rồi ghi đường dẫn, ví dụ: 'photos/ky-niem-1.jpg'.
 *            Để null thì sẽ hiện khung ảnh trang trí.
 */
export type Memory = {
  title: string
  caption: string
  photo: string | null
}

export const memories: Memory[] = [
  {
    title: 'Mẹ và biển xanh',
    caption: 'Mẹ ngồi ngắm sóng, nhìn thôi đã thấy bình yên. Con mong mẹ lúc nào cũng thong thả như thế này.',
    photo: 'photos/ky-niem-1.jpg',
  },
  {
    title: 'Đoá hoa vàng bên biển',
    caption: 'Váy hoa vàng, biển xanh, gió lộng. Mẹ xinh nhất khung hình luôn!',
    photo: 'photos/ky-niem-2.jpg',
  },
  {
    title: 'Mẹ đi Trùng Khánh',
    caption: 'Kính râm, phố lớn, tạo dáng chuẩn chỉnh. Mẹ con ngầu hết nấc!',
    photo: 'photos/ky-niem-3.jpg',
  },
]
