import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, UserPlus, Upload } from 'lucide-react';
import './SignupPage.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Personal Info, 2: Account Security
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateStep1 = () => {
    if (!formData.fullName || !formData.email || !formData.phone || 
        !formData.address || !formData.city) {
      setError('Please fill all required fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill all password fields');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!formData.agreeTerms) {
      setError('Please agree to Terms & Conditions');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateStep2()) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Save user to localStorage (simulating database)
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if email already exists
      if (users.find(u => u.email === formData.email)) {
        setError('Email already registered. Please login.');
        setIsLoading(false);
        return;
      }

      const newUser = {
        id: 'user_' + Date.now(),
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        password: formData.password,
        isVerified: false,
        verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Store pending verification email
      localStorage.setItem('pendingVerification', formData.email);

      alert('Account created! Please check your email for verification code.');
      navigate('/verify-email');
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="auth-page">
      <div className="auth-container signup-container">
        <div className="auth-left">
          <div className="auth-brand">
            <h1>EcoScrap</h1>
            <p className="tagline">Join the Green Revolution</p>
          </div>
          <div className="signup-progress">
            <div className="progress-step">
              <div className={`step-circle ${step >= 1 ? 'active' : ''}`}>1</div>
              <div className="step-info">
                <h4>Personal Info</h4>
                <p>Basic details</p>
              </div>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step">
              <div className={`step-circle ${step >= 2 ? 'active' : ''}`}>2</div>
              <div className="step-info">
                <h4>Account Security</h4>
                <p>Create password</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-container">
            <div className="auth-header">
              <UserPlus size={40} className="auth-icon" />
              <h2>Create Account</h2>
              <p>Join EcoScrap and start recycling today</p>
            </div>

            {error && (
              <div className="error-message">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="auth-form">
              {step === 1 ? (
                <>
                  <div className="input-group">
                    <label>Full Name *</label>
                    <div className="input-wrapper">
                      <User size={20} className="input-icon" />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Email Address *</label>
                    <div className="input-wrapper">
                      <Mail size={20} className="input-icon" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Phone Number *</label>
                    <div className="input-wrapper">
                      <Phone size={20} className="input-icon" />
                      <input
                        type="tel"
                        placeholder="+91 1234567890"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Address *</label>
                    <div className="input-wrapper">
                      <MapPin size={20} className="input-icon" />
                      <input
                        type="text"
                        placeholder="Enter your address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>City *</label>
                    <select
                      className="select-input"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    >
                      <option value="">Select City</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Pune">Pune</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Kolkata">Kolkata</option>
                    </select>
                  </div>

                  <button type="button" className="btn-next" onClick={handleNextStep}>
                    Next Step →
                  </button>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label>Create Password *</label>
                    <div className="input-wrapper">
                      <Lock size={20} className="input-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <small className="password-hint">Use 6+ characters with letters and numbers</small>
                  </div>

                  <div className="input-group">
                    <label>Confirm Password *</label>
                    <div className="input-wrapper">
                      <Lock size={20} className="input-icon" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="terms-box">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.agreeTerms}
                        onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                      />
                      <span>I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a></span>
                    </label>
                  </div>

                  <div className="button-group">
                    <button type="button" className="btn-back" onClick={() => setStep(1)}>
                      ← Back
                    </button>
                    <button type="submit" className="btn-submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="spinner-small"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus size={20} />
                          Create Account
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>

            <p className="auth-footer">
              Already have an account?
              <Link to="/login" className="auth-link"> Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;