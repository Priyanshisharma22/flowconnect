import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import PricingPage from './pages/PricingPage'
import HowItWorksPage from './pages/HowItWorksPage'
import BuilderPage from './pages/BuilderPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import AboutPage from './pages/AboutPage'
import './styles/App.css'
<<<<<<< Updated upstream
=======
import { Toaster } from 'react-hot-toast'

// --- Route Protectors ---

// This protects private routes like /builder or /profile
// If there isn't an access token, it immediately sends you back to /login
const ProtectedRoute = ({ children }: { children: React.JSX.Element }) => {
  const isAuth = !!localStorage.getItem('access_token')
  return isAuth ? children : <Navigate to="/login" replace />
}

// This protects public routes like /login or /signup
// If you are already logged in, you shouldn't see log in screens, so it sends you to /builder
const PublicRoute = ({ children }: { children: React.JSX.Element }) => {
  const isAuth = !!localStorage.getItem('access_token')
  return isAuth ? <Navigate to="/builder" replace /> : children
}

// --- Main Application ---
>>>>>>> Stashed changes

function App() {
  const isAuthenticated = !!localStorage.getItem('access_token')

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/builder" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/builder" replace /> : <SignupPage />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />}
        />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route
          path="/builder"
          element={isAuthenticated ? <BuilderPage /> : <Navigate to="/login" replace />}
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </Router>
  )
}

export default App

