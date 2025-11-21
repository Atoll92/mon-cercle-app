import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/animations.css'
import App from './App.jsx'
import { AuthProvider } from './context/authcontext.jsx'
import { BrowserRouter } from 'react-router-dom'; // <= THE MISSING PIECE!
import { initializeLogger } from './utils/logger'
import { SpeedInsights } from '@vercel/speed-insights/react'
// Removed: import { startAutomaticNotificationProcessing } from './services/emailNotificationService'
// Notification processing now handled server-side via Supabase cron job

// Initialize logger to disable console logs in production
initializeLogger();

// Removed: startAutomaticNotificationProcessing() - now handled server-side

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
  <AuthProvider> {/* Wrap App with AuthProvider */}
    <App />
    <SpeedInsights />
  </AuthProvider>
  </BrowserRouter>
  </StrictMode>,
)
