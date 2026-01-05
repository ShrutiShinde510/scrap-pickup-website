import React from "react";
import { useNavigate } from "react-router-dom";
import "./HeroSection.css";

const HeroSection = ({ onRegisterClick }) => {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="hero-container">
        <h1 className="hero-title">Sell Your Scrap from Home & Industry</h1>
        <p className="hero-subtitle">
          Easy, Quick & Environment-Friendly Scrap Pickup Service
        </p>
        <div className="hero-buttons">
          <button
            onClick={() => navigate("/book-pickup")}
            className="btn-secondary"
          >
            Book Pickup Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

