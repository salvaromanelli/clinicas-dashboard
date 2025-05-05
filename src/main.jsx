import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Establecer modo de desarrollo
localStorage.setItem('dev_mode', 'true');
localStorage.setItem('user_role', 'developer');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
