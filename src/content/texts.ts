/** Tuổi của mẹ trong lần sinh nhật này. Đổi số ở đây là mọi chỗ trong game đổi theo. */
export const MOM_AGE = 49

/** Mọi chữ hiển thị trong game đều nằm ở đây để dễ sửa. */
export const texts = {
  titleTop: "Mom's",
  titleBottom: `${MOM_AGE}th Adventure`,
  subtitle: 'Một chuyến phiêu lưu nhỏ, dành riêng cho mẹ',
  startButton: 'Bắt đầu chuyến phiêu lưu',

  guideJoystick: 'Đặt ngón tay vào vòng tròn này và kéo nhẹ để đi',
  guideAction: 'Khi đến gần đồ vật, nút này sẽ hiện ra. Chạm vào là xong',
  guideKeyboard: 'Trên máy tính: phím mũi tên hoặc W A S D để đi, phím Cách (Space) để chạm',
  guideOk: 'Mẹ hiểu rồi',

  questBell: 'Mẹ đi theo con đường sáng về trước hiên nhà nhé',
  questBellNear: 'Chạm nút bên phải để bấm chuông nào',
  afterBell: 'Không ai ra mở cửa… Hình như trong vườn có 3 bông hoa đang sáng lên',
  questFlowers: 'Tìm 3 bông hoa đang phát sáng trong vườn',
  questGift: 'Có món quà đang chờ mẹ bên hiên gỗ, đi theo ánh đèn nhé',
  hintIdle: 'Mẹ cứ đi theo mũi tên dưới chân nhé',

  actionBell: 'Bấm chuông',
  actionFlower: 'Ngắm hoa',
  actionGift: 'Mở quà',

  memoryContinue: 'Đi tiếp',
  memoryCount: (n: number) => `Bông hoa ${n} / 3`,

  finaleTitle: 'Chúc mừng sinh nhật mẹ!',
  finaleSubtitle: `${MOM_AGE} năm tuyệt vời`,
  finaleButton: 'Đọc thư nhé mẹ',

  letterReplay: 'Chơi lại từ đầu',
  soundOn: 'Bật âm thanh',
  soundOff: 'Tắt âm thanh',
}
