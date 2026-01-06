import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Truck } from "lucide-react";
import "./HeroSection.css";

const HeroSection = ({ onRegisterClick }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

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
            className="btn-book-pickup"
          >
            Book Pickup Now
          </button>

          {isAuthenticated && (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-client-dashboard"
              >
                <LayoutDashboard size={20} />
                Client Dashboard
              </button>

              <button
                onClick={() => navigate("/vendor-dashboard")}
                className="btn-vendor-dashboard"
              >
                <Truck size={20} />
                Vendor Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

