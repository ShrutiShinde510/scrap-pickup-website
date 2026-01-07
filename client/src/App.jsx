import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import BookPickupPage from "./pages/BookPickupPage";
import VendorRegistrationPage from "./pages/VendorRegistrationPage";
import ClientDashboard from './pages/ClientDashboard';
import VendorDashboard from "./pages/VendorDashboard";

import "./App.css";
import ClientRegistrationModal from "./components/ClientRegistrationModal";

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const hideLayout = ["/login", "/signup", "/verify-email"].includes(
    window.location.pathname,
  );

  return (
    <div className="app-container">
      {!hideLayout && <Navbar />}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/signup" element={<SignupPage />} />

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
            path="/vendor-registration"
            element={<VendorRegistrationPage />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireVerification>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/vendor-dashboard" element={<VendorDashboard />} />

          {/* Redirects */}
          <Route path="/client-registration" element={<Navigate to="/signup" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {!hideLayout && <Footer />}
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
