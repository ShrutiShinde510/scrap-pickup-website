import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-section">
            <h3>Contact Us</h3>
            <div className="contact-item">
              <Phone size={16} /> <span>+91 1234567890</span>
            </div>
            <div className="contact-item">
              <Mail size={16} /> <span>info@ecoscrap.com</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} /> <span>Mumbai, India</span>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Services</a></li>
              <li><a href="#">FAQs</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Follow Us</h3>
            <div className="social-links">
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
              <a href="#">Instagram</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 EcoScrap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
