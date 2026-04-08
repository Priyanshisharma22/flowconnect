import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import PricingPage from './pages/PricingPage'
import HowItWorksPage from './pages/HowItWorksPage'
import BuilderPage from './pages/BuilderPage'
import './styles/App.css'

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
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route
          path="/builder"
          element={isAuthenticated ? <BuilderPage /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  )
}

export default App

