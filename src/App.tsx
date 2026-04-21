import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import PricingPage from './pages/PricingPage'
import HowItWorksPage from './pages/HowItWorksPage'
import BuilderPage from './pages/BuilderPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import AboutPage from './pages/AboutPage'
import { onAuthError } from './api/httpClient'
import './styles/App.css'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/common/ErrorBoundary'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'

// --- Route Protectors ---

// This protects private routes like /builder or /profile
// If there isn't an access token, it immediately sends you back to /login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = !!localStorage.getItem('access_token')
  return isAuth ? children : <Navigate to="/login" replace />
}

// This protects public routes like /login or /signup
// If you are already logged in, you shouldn't see log in screens, so it sends you to /builder
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = !!localStorage.getItem('access_token')
  return isAuth ? <Navigate to="/builder" replace /> : children
}

// --- App Content (inside Router) ---

function AppContent() {
  const navigate = useNavigate()

  // Setup global 401 error handler
  useEffect(() => {
    onAuthError(() => {
      navigate('/login', { replace: true })
    })
  }, [navigate])

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <div id="aria-live-announcer" aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }} />
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Public Routes (Wraps login/signup) */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />

        {/* Private Routes (Wraps builder/profile) */}
        <Route
          path="/builder"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <BuilderPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <ProfilePage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Open Routes (Anyone can see these) */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

      </Routes>
    </>
  )
}

// --- Main Application ---

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
