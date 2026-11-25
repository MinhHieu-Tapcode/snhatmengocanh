import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import { useGame } from './store'
import { audio } from './audio/audio'
import { debug, input, player } from './game/runtime'

// Chỉ dùng khi phát triển: điều khiển thử từ console
if (import.meta.env.DEV) (window as any).__game = { useGame, input, player, debug, audio }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
