import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initUltronBridge } from './bridge'
import './styles/index.css'

// Initialize bridge (Electron IPC or Web fallback)
initUltronBridge()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)