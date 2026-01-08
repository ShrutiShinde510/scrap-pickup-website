import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogIn, LogOut, LayoutDashboard, RefreshCw } from "lucide-react";
import toast from 'react-hot-toast';
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Determine active role based on localStorage or user properties
  const activeRole = localStorage.getItem('userRole') === 'client' || (!user?.is_seller && user?.is_client) ? 'client' : 'vendor';

  const isActive = (path) => location.pathname === path;

  const handleLogout = (redirectRole = null) => {
    if (redirectRole) {
      // Switching roles: Logout then redirect to login with target role
      logout();
      navigate(`/login?role=${redirectRole}`);
      // toast.success(`Switching to ${redirectRole} login...`);
    } else {
      // Normal logout
      toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span>Are you sure you want to logout?</span>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                logout();
                navigate("/");
                toast.success("Logged out successfully");
              }}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Yes, Logout
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: 5000,
        style: {
          minWidth: '300px'
        }
      });
    }
    setIsOpen(false);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <Link to="/" className="navbar-logo">
            EcoScrap
          </Link>

          <div className="navbar-menu">
            <Link
              to="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              to="/book-pickup"
              className={`nav-link ${isActive("/book-pickup") ? "active" : ""}`}
            >
              Book Pickup
            </Link>
            <Link
              to="/vendor-registration"
              className={`nav-link ${isActive("/vendor-registration") ? "active" : ""}`}
            >
              Vendor Registration
            </Link>

            {isAuthenticated ? (
              <>
                <div className="user-dropdown-container">
                  <div
                    className="user-menu"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="user-avatar">
                      <User size={18} />
                    </div>
                    <div className="user-info">
                      <span className="user-name">
                        {user?.name || user?.full_name}
                      </span>
                      {(user?.is_phone_verified || user?.is_email_verified) && (
                        <span className="verified-badge">✓ Verified</span>
                      )}
                    </div>
                  </div>

                  {isDropdownOpen && (
                    <div className="dropdown-menu">
                      {/* Current Dashboard Link */}
                      <Link
                        to={(activeRole === 'client' || !user?.is_seller) ? '/dashboard' : '/vendor-dashboard'}
                        className="dropdown-item"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <LayoutDashboard size={18} />
                        My Dashboard
                      </Link>

                      {/* Switch Role Option */}
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          const targetRole = activeRole === 'client' ? 'vendor' : 'client';
                          handleLogout(targetRole); // Pass target role to logout handler
                        }}
                      >
                        <RefreshCw size={18} />
                        Switch to {activeRole === 'client' ? 'Vendor' : 'Client'}
                      </button>

                      <button
                        onClick={() => handleLogout()}
                        className="dropdown-item danger"
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  )}
                </div>

                {isDropdownOpen && (
                  <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                    onClick={() => setIsDropdownOpen(false)}
                  />
                )}
              </>
            ) : (
              <>
                <Link to="/signup" className="btn-signup-nav">
                  <User size={18} /> Sign Up
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="navbar-toggle">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isOpen && (
          <div className="navbar-mobile">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="nav-link-mobile"
            >
              Home
            </Link>
            <Link
              to="/book-pickup"
              onClick={() => setIsOpen(false)}
              className="nav-link-mobile"
            >
              Book Pickup
            </Link>
            <Link
              to="/vendor-registration"
              onClick={() => setIsOpen(false)}
              className="nav-link-mobile"
            >
              Vendor Registration
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={
                    (localStorage.getItem('userRole') === 'client' || !user?.is_seller)
                      ? "/dashboard"
                      : "/vendor-dashboard"
                  }
                  onClick={() => setIsOpen(false)}
                  className="user-info-mobile"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <User size={20} />
                  <span>{user?.name || user?.full_name}</span>
                  {(user?.is_phone_verified || user?.is_email_verified) && (
                    <span className="verified-badge">✓</span>
                  )}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="btn-logout-mobile"
                >
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="btn-login-mobile"
                >
                  <LogIn size={18} /> Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="btn-signup-mobile"
                >
                  <User size={18} /> Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav >
  );
};

export default Navbar;
