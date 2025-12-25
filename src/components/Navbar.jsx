import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import ClientRegistrationModal from './ClientRegistrationModal';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            <Link to="/" className="navbar-logo">EcoScrap</Link>
            
            <div className="navbar-menu">
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
              <Link to="/book-pickup" className={`nav-link ${isActive('/book-pickup') ? 'active' : ''}`}>Book Pickup</Link>
              <Link to="/vendor-registration" className={`nav-link ${isActive('/vendor-registration') ? 'active' : ''}`}>Vendor Registration</Link>
              <button onClick={() => setShowRegistration(true)} className="btn-signup">
                <User size={18} /> Client Sign Up
              </button>
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
              <button onClick={() => { setShowRegistration(true); setIsOpen(false); }} className="btn-signup-mobile">
                Client Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {showRegistration && <ClientRegistrationModal onClose={() => setShowRegistration(false)} />}
    </>
  );
};

export default Navbar;
