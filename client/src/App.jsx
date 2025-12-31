import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import BookPickupPage from './pages/BookPickupPage';
import VendorRegistrationPage from './pages/VendorRegistrationPage';
import OTPPage from './pages/OTPPage';

import './App.css';
import ClientRegistrationModal from './components/ClientRegistrationModal';

function App() {
  const { isAuthenticated } = useAuth();

  const hideLayout = ['/login', '/signup', '/verify-email'].includes(
    window.location.pathname
  );

  return (
    <div className="app-container">
      {!hideLayout && <Navbar />}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
          />

          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/" /> : <SignupPage />}
          />

          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route
            path="/book-pickup"
            element={
              <ProtectedRoute requireVerification>
                <BookPickupPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/client-registration"
            element={<ClientRegistrationModal />}
          />

          <Route
            path="/vendor-registration"
            element={<VendorRegistrationPage />}
          />

          <Route path="/otp" element={<OTPPage />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {!hideLayout && <Footer />}
    </div>
  );
}

export default App;
