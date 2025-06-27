import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/animations.css'
import App from './App.jsx'
import { AuthProvider } from './context/authcontext.jsx'
import { BrowserRouter } from 'react-router-dom'; // <= THE MISSING PIECE!
import { initializeLogger } from './utils/logger'
import { startAutomaticNotificationProcessing } from './services/emailNotificationService'

// Initialize logger to disable console logs in production
initializeLogger();

// Start automatic notification processing
startAutomaticNotificationProcessing();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
  <AuthProvider> {/* Wrap App with AuthProvider */}
    <App />
  </AuthProvider>
  </BrowserRouter>
  </StrictMode>,
)
