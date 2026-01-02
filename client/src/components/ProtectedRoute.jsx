import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireVerification = false }) => {
  const { isAuthenticated, isVerified, isLoading } = useAuth();

  console.log("ProtectedRoute: Checking access...", { isAuthenticated, isVerified, requireVerification, isLoading });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  if (requireVerification && !isVerified) {
    console.log("ProtectedRoute: Not verified (requireVerification=true), redirecting to /verify-email");
    return <Navigate to="/verify-email" replace />;
  }

  console.log("ProtectedRoute: Access granted");
  return children;
};

export default ProtectedRoute;