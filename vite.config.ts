import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  // Tránh lỗi đường dẫn ảo hoá trên Windows khi chạy trong thư mục AppData
  resolve: { preserveSymlinks: true },
})
