import React from 'react';
import { scrapCategories } from '../data/scrapData';
import './ScrapCategories.css';

const ScrapCategories = () => {
  return (
    <section className="categories-section">
      <div className="categories-container">
        <h2 className="section-title">Scrap Categories We Accept</h2>
        <div className="categories-grid">
          {scrapCategories.map(category => (
            <div key={category.id} className="category-card">
              <h3 className="category-name">{category.name}</h3>
              <p className="category-price">₹{category.price}/kg</p>
              <ul className="category-items">
                {category.items.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScrapCategories;