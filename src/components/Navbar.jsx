

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
      alert('Logged out successfully');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <Link to="/" className="navbar-logo">EcoScrap</Link>
          
          <div className="navbar-menu">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
            <Link to="/book-pickup" className={`nav-link ${isActive('/book-pickup') ? 'active' : ''}`}>Book Pickup</Link>
            <Link to="/vendor-registration" className={`nav-link ${isActive('/vendor-registration') ? 'active' : ''}`}>Vendor Registration</Link>
            
            {isAuthenticated ? (
              <>
                <div className="user-menu">
                  <div className="user-avatar"><User size={18} /></div>
                  <div className="user-info">
                    <span className="user-name">{user?.name}</span>
                    {user?.isVerified && <span className="verified-badge">✓ Verified</span>}
                  </div>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <>
              { /* <Link to="/login" className="btn-login-nav">
                  <LogIn size={18} /> Login
                </Link>
                <Link to="/signup" className="btn-signup-nav">
                  <User size={18} /> Sign Up
                </Link> */}

                {/* CLIENT SIGNUP */}
                <Link to="/signup" className="btn-signup-nav">
                  <User size={18} /> Client Sign Up
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
            <Link to="/" onClick={() => setIsOpen(false)} className="nav-link-mobile">Home</Link>
            <Link to="/book-pickup" onClick={() => setIsOpen(false)} className="nav-link-mobile">Book Pickup</Link>
            <Link to="/vendor-registration" onClick={() => setIsOpen(false)} className="nav-link-mobile">Vendor Registration</Link>
            
            {isAuthenticated ? (
              <>
                <div className="user-info-mobile">
                  <User size={20} />
                  <span>{user?.name}</span>
                  {user?.isVerified && <span className="verified-badge">✓</span>}
                </div>
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="btn-logout-mobile">
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="btn-login-mobile">
                  <LogIn size={18} /> Login
                </Link>
                <Link to="/signup" onClick={() => setIsOpen(false)} className="btn-signup-mobile">
                  <User size={18} /> Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
