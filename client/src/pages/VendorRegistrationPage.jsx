
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, User, Mail, Phone, Building, MapPin, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { scrapCategories } from '../data/scrapData';
import api from '../api/axios.ts';
import './VendorRegistrationPage.css';

const VendorRegistrationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);


  const [formData, setFormData] = useState({
    // Personal Info
    contactPerson: '',
    email: '',
    phone: '',

    // Business Info
    businessName: '',
    businessType: '',
    address: '',
    city: '',
    operatingAreas: '',


    // Documents
    businessLicense: null,
    gstCertificate: null,
    addressProof: null,
    idProof: null,

    // Password
    password: '',
    confirmPassword: ''
  });

  const [emailOTP, setEmailOTP] = useState(['', '', '', '', '', '']);
  const [phoneOTP, setPhoneOTP] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ============================================
  // STEP 1: Basic Information Validation
  // ============================================
  const validateStep1 = () => {
    if (!formData.contactPerson || !formData.email || !formData.phone) {
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

  // ============================================
  // STEP 3: Business Details Validation
  // ============================================
  const validateStep3 = () => {
    if (!formData.businessName || !formData.businessType || !formData.address ||
      !formData.city || !formData.operatingAreas ||
      !formData.password || !formData.confirmPassword) {
      setError('Please fill all required fields');
      return false;
    }

    if (!formData.businessLicense || !formData.gstCertificate ||
      !formData.addressProof || !formData.idProof) {
      setError('Please upload all required documents');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  // ============================================
  // STEP 1 → STEP 2: Send Email OTP
  // ============================================
  const handleStep1Next = async () => {
    setError('');
    if (validateStep1()) {
      setIsLoading(true);
      try {
        const response = await api.post('/otp/send/', {
          contact: formData.email,
          channel: 'email'
        });

        if (response.data.mock_otp) {
          console.log('EMAIL OTP:', response.data.mock_otp);
          alert(`Email OTP sent to ${formData.email}\n\nDEMO OTP: ${response.data.mock_otp}`);
        } else {
          alert(`Email OTP sent to ${formData.email}`);
        }

        setCurrentStep(2); // Go to Email OTP verification
      } catch (err) {
        console.error("OTP Error:", err);
        setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ============================================
  // STEP 2 → STEP 3: Verify Email OTP
  // ============================================
  const handleEmailOTPVerify = async () => {
    const enteredOTP = emailOTP.join('');

    if (enteredOTP.length < 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/otp/verify/', {
        contact: formData.email,
        otp: enteredOTP
      });

      setError('');
      alert('✅ Email verified successfully!');
      setCurrentStep(3); // Go to Business Details

    } catch (err) {
      console.error("OTP Error:", err);
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
      setEmailOTP(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // STEP 3 → STEP 4: Business Details → Send Phone OTP
  // ============================================
  const handleStep3Next = async () => {
    setError('');
    if (validateStep3()) {
      setIsLoading(true);
      try {
        const response = await api.post('/otp/send/', {
          contact: formData.phone,
          channel: 'sms'
        });

        if (response.data.mock_otp) {
          console.log('PHONE OTP:', response.data.mock_otp);
          alert(`Phone OTP sent to ${formData.phone}\n\nDEMO OTP: ${response.data.mock_otp}`);
        } else {
          alert(`Phone OTP sent to ${formData.phone}`);
        }

        setCurrentStep(4); // Go to Phone OTP verification
      } catch (err) {
        console.error("OTP Error:", err);
        setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ============================================
  // STEP 4 → STEP 5: Verify Phone OTP → Complete
  // ============================================
  const handlePhoneOTPVerify = async () => {
    const enteredOTP = phoneOTP.join('');

    if (enteredOTP.length < 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verify Phone OTP
      await api.post('/otp/verify/', {
        contact: formData.phone,
        otp: enteredOTP
      });

      // 2. Submit Registration
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('email', formData.email);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('full_name', formData.contactPerson);
        formDataToSend.append('phone_number', formData.phone);
        formDataToSend.append('address', formData.address);
        formDataToSend.append('city', formData.city);

        // Business Details
        formDataToSend.append('business_name', formData.businessName);
        formDataToSend.append('business_type', formData.businessType);
        formDataToSend.append('operating_areas', formData.operatingAreas);



        // Documents
        if (formData.businessLicense) formDataToSend.append('business_license', formData.businessLicense);
        if (formData.gstCertificate) formDataToSend.append('gst_certificate', formData.gstCertificate);
        if (formData.addressProof) formDataToSend.append('address_proof', formData.addressProof);
        if (formData.idProof) formDataToSend.append('vendor_id_proof', formData.idProof);

        await api.post('/register/seller/', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setError('');
        setCurrentStep(5); // Go to Success
      } catch (err) {
        console.error("Registration error:", err);
        if (err.response && err.response.data) {
          const errorMsg = Object.values(err.response.data).flat().join(', ');
          setError(errorMsg || 'Registration failed. Please try again.');
        } else {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (otpErr) {
      console.error("OTP Verification Error:", otpErr);
      setError(otpErr.response?.data?.error || 'Invalid OTP. Please try again.');
      setPhoneOTP(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // OTP Input Handlers
  // ============================================
  const handleOTPChange = (index, value, type) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    if (type === 'email') {
      const newOTP = [...emailOTP];
      newOTP[index] = value;
      setEmailOTP(newOTP);
      if (value && index < 5) {
        document.getElementById(`email-otp-${index + 1}`)?.focus();
      }
    } else {
      const newOTP = [...phoneOTP];
      newOTP[index] = value;
      setPhoneOTP(newOTP);
      if (value && index < 5) {
        document.getElementById(`phone-otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleOTPKeyDown = (index, e, type) => {
    const currentOTP = type === 'email' ? emailOTP : phoneOTP;
    if (e.key === 'Backspace' && !currentOTP[index] && index > 0) {
      document.getElementById(`${type}-otp-${index - 1}`)?.focus();
    }
  };

  // ============================================
  // Other Handlers
  // ============================================


  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setFormData({ ...formData, [field]: file });
    }
  };

  // ============================================
  // STEP 1: Basic Contact Information
  // ============================================
  if (currentStep === 1) {
    return (
      <div className="vendor-page">
        <div className="vendor-container">
          <div className="vendor-header">
            <h1 className="vendor-title">Vendor Registration</h1>
            <p className="vendor-subtitle">Step 1 of 5: Basic Information</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '20%' }}></div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-section">
            <div className="input-group">
              <label>Contact Person Name *</label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email Address *</label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <small className="input-hint">We'll send OTP to verify this email</small>
            </div>

            <div className="input-group">
              <label>Phone Number *</label>
              <div className="input-wrapper">
                <Phone size={20} className="input-icon" />
                <input
                  type="tel"
                  placeholder="+91 1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <small className="input-hint">We'll send OTP to verify this number</small>
            </div>

            <button onClick={handleStep1Next} className="btn-next" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Next: Verify Email →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 2: Email OTP Verification
  // ============================================
  if (currentStep === 2) {
    return (
      <div className="verify-page">
        <div className="verify-container">
          <div className="verify-icon-wrapper">
            <Mail size={60} className="verify-icon" />
          </div>

          <h1 className="verify-title">Verify Email</h1>
          <p className="verify-subtitle">
            We've sent a 6-digit OTP to<br />
            <strong>{formData.email}</strong>
          </p>

          <div className="progress-bar mb-20">
            <div className="progress-fill" style={{ width: '40%' }}></div>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="code-input-group">
            {emailOTP.map((digit, index) => (
              <input
                key={index}
                id={`email-otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value, 'email')}
                onKeyDown={(e) => handleOTPKeyDown(index, e, 'email')}
                className="code-input"
                disabled={isLoading}
              />
            ))}
          </div>

          <button onClick={handleEmailOTPVerify} className="btn-verify" disabled={isLoading}>
            {isLoading ? 'Verifying...' : (
              <>
                <CheckCircle size={20} />
                Verify Email
              </>
            )}
          </button>

          <button onClick={() => setCurrentStep(1)} className="btn-back-link">
            ← Back to Basic Info
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 3: Business Details
  // ============================================
  if (currentStep === 3) {
    return (
      <div className="vendor-page">
        <div className="vendor-container large">
          <div className="vendor-header">
            <h1 className="vendor-title">Business Information</h1>
            <p className="vendor-subtitle">Step 3 of 5: Business Details</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '60%' }}></div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-section">
            <div className="input-group">
              <label>Business Name *</label>
              <div className="input-wrapper">
                <Building size={20} className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter registered business name"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Business Type *</label>
              <select
                className="select-input"
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              >
                <option value="">Select Business Type</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Private Limited">Private Limited</option>
                <option value="LLP">LLP</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input-group">
              <label>Business Address *</label>
              <div className="input-wrapper">
                <MapPin size={20} className="input-icon" />
                <textarea
                  placeholder="Enter complete business address"
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label>City *</label>
              <select
                className="select-input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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


            <div className="input-group">
              <label>Operating Areas *</label>
              <input
                type="text"
                placeholder="e.g., Mumbai, Pune, Thane"
                className="text-input"
                value={formData.operatingAreas}
                onChange={(e) => setFormData({ ...formData, operatingAreas: e.target.value })}
              />
              <small className="input-hint">Enter cities separated by commas</small>
            </div>

            {/* Document Uploads */}
            <div className="documents-section">
              <h3>Required Documents *</h3>
              <div className="upload-grid">
                <div className="upload-box">
                  <Upload size={24} className="upload-icon" />
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'businessLicense')} className="file-input" id="license-upload" />
                  <label htmlFor="license-upload" className="upload-label">
                    Business License
                  </label>
                  {formData.businessLicense && <p className="file-uploaded">✓ {formData.businessLicense.name}</p>}
                </div>

                <div className="upload-box">
                  <Upload size={24} className="upload-icon" />
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'gstCertificate')} className="file-input" id="gst-upload" />
                  <label htmlFor="gst-upload" className="upload-label">
                    GST Certificate
                  </label>
                  {formData.gstCertificate && <p className="file-uploaded">✓ {formData.gstCertificate.name}</p>}
                </div>

                <div className="upload-box">
                  <Upload size={24} className="upload-icon" />
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'addressProof')} className="file-input" id="address-upload" />
                  <label htmlFor="address-upload" className="upload-label">
                    Address Proof
                  </label>
                  {formData.addressProof && <p className="file-uploaded">✓ {formData.addressProof.name}</p>}
                </div>

                <div className="upload-box">
                  <Upload size={24} className="upload-icon" />
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'idProof')} className="file-input" id="id-upload" />
                  <label htmlFor="id-upload" className="upload-label">
                    ID Proof
                  </label>
                  {formData.idProof && <p className="file-uploaded">✓ {formData.idProof.name}</p>}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="input-row">
              <div className="input-group">
                <label>Create Password *</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm Password *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  className="text-input"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="button-group">
              <button onClick={() => setCurrentStep(2)} className="btn-back" disabled={isLoading}>
                ← Back
              </button>
              <button onClick={handleStep3Next} className="btn-next" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Next: Verify Phone →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 4: Phone OTP Verification
  // ============================================
  if (currentStep === 4) {
    return (
      <div className="verify-page">
        <div className="verify-container">
          <div className="verify-icon-wrapper">
            <Phone size={60} className="verify-icon" />
          </div>

          <h1 className="verify-title">Verify Phone Number</h1>
          <p className="verify-subtitle">
            We've sent a 6-digit OTP to<br />
            <strong>{formData.phone}</strong>
          </p>

          <div className="progress-bar mb-20">
            <div className="progress-fill" style={{ width: '80%' }}></div>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="code-input-group">
            {phoneOTP.map((digit, index) => (
              <input
                key={index}
                id={`phone-otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value, 'phone')}
                onKeyDown={(e) => handleOTPKeyDown(index, e, 'phone')}
                className="code-input"
                disabled={isLoading}
              />
            ))}
          </div>

          <button onClick={handlePhoneOTPVerify} className="btn-verify" disabled={isLoading}>
            {isLoading ? (
              <>
                <CheckCircle size={20} className="spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Verify Phone & Register
              </>
            )}
          </button>

          <button onClick={() => setCurrentStep(3)} className="btn-back-link" disabled={isLoading}>
            ← Back to Business Details
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 5: Success
  // ============================================
  if (currentStep === 5) {
    return (
      <div className="verify-page">
        <div className="verify-container success-container">
          <div className="success-icon-wrapper">
            <CheckCircle size={80} />
          </div>

          <h1 className="success-title">Registration Successful!</h1>
          <p className="success-subtitle">
            Your vendor registration has been submitted successfully.
          </p>

          <div className="success-info">
            <h3>What's Next?</h3>
            <ul>
              <li>✓ Email Verified</li>
              <li>✓ Phone Verified</li>
              <li>✓ Documents Uploaded</li>
              <li>⏳ Pending Admin Approval</li>
            </ul>
            <p className="info-text">
              Our team will review your application within 2-3 business days.
              You'll receive a confirmation email once approved.
            </p>
          </div>

          <button onClick={() => navigate('/')} className="btn-home">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default VendorRegistrationPage;