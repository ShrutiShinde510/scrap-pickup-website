
import React  ,{ useState }from 'react';

import HeroSection from '../components/HeroSection';
import ScrapCategories from '../components/ScrapCategories';
import { cities, acceptedMaterials, nonAcceptedMaterials } from '../data/scrapData';
//import ClientRegistrationModal from '../components/ClientRegistrationModal';
import './HomePage.css';

const HomePage = () => {
  

  return (
    <div className="homepage">
      <HeroSection onRegisterClick={() => setIsModalOpen(true)} />

         

      {/* Rest of your homepage content */}

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works - Simple 3 Steps</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Select Category</h3>
              <p>Choose the type of scrap you want to sell</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Get Quantity Estimate</h3>
              <p>Provide approximate weight and get instant price</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Upload Image & Schedule</h3>
              <p>Upload photo, select time slot & confirm pickup</p>
            </div>
          </div>
        </div>
      </section>

      <ScrapCategories />

      {/* Cities Served */}
      <section className="cities-section">
        <div className="container">
          <h2 className="section-title">Cities We Serve</h2>
          <div className="cities-grid">
            {cities.map((city, idx) => (
              <div key={idx} className="city-badge">{city}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Environmental Impact */}
      <section className="impact-section">
        <div className="container">
          <h2 className="section-title">Our Environmental Impact</h2>
          <div className="impact-grid">
            <div className="impact-card">
              <h3 className="impact-number">50K+</h3>
              <p>Tons Recycled</p>
            </div>
            <div className="impact-card">
              <h3 className="impact-number">1M+</h3>
              <p>Trees Saved</p>
            </div>
            <div className="impact-card">
              <h3 className="impact-number">25K+</h3>
              <p>Happy Customers</p>
            </div>
            <div className="impact-card">
              <h3 className="impact-number">100+</h3>
              <p>Cities Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Materials Info */}
      <section className="materials-section">
        <div className="container">
          <div className="materials-grid">
            <div className="materials-card accepted">
              <h3>✓ Accepted Materials</h3>
              <ul>
                {acceptedMaterials.map((material, idx) => (
                  <li key={idx}><span className="checkmark">✓</span> {material}</li>
                ))}
              </ul>
            </div>
            <div className="materials-card rejected">
              <h3>✗ Non-Accepted Materials</h3>
              <ul>
                {nonAcceptedMaterials.map((material, idx) => (
                  <li key={idx}><span className="crossmark">✗</span> {material}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;