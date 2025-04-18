import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/authcontext.jsx'
import { BrowserRouter } from 'react-router-dom'; // <= THE MISSING PIECE!

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
  <AuthProvider> {/* Wrap App with AuthProvider */}
    <App />
  </AuthProvider>
  </BrowserRouter>
  </StrictMode>,
)
