import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  UserPlus,
  Upload,
  CheckCircle,
  Loader2,
} from "lucide-react";
import api from "../api/axios";
import "./SignupPage.css";

const SignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    document: null,
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // OTP States
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", "", "", ""]);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false); // Phone verified

  const validateStep1 = () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city
    ) {
      setError("Please fill all required fields");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Please enter a valid phone number");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError("Please fill all password fields");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (!formData.agreeTerms) {
      setError("Please agree to Terms & Conditions");
      return false;
    }

    return true;
  };

  const handleNextStep = async () => {
    setError("");

    // Step 1 -> OTP Step (Email)
    if (step === 1) {
      if (validateStep1()) {
        setIsLoading(true);
        try {
          const response = await api.post("/otp/send/", {
            contact: formData.email,
            channel: "email",
          });

          if (response.data.mock_otp) {
            alert(
              `Email OTP sent to ${formData.email}\n\nDEMO OTP: ${response.data.mock_otp}`,
            );
          } else {
            alert(`Email OTP sent to ${formData.email}`);
          }
          setStep(2); // Go to Email OTP Step
        } catch (err) {
          setError(err.response?.data?.error || "Failed to send OTP.");
        } finally {
          setIsLoading(false);
        }
      }
    }
    // Step 2 (Email OTP) -> Step 3 (Password/Docs)
    else if (step === 2) {
      if (isEmailVerified) setStep(3);
      else setError("Please verify Email OTP first");
    }
    // Step 3 (Password/Docs) -> Step 4 (Phone OTP)
    else if (step === 3) {
      if (validateStep2()) {
        verifyPhoneAndProceed();
      }
    }
  };

  const verifyPhoneAndProceed = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/otp/send/', {
        contact: formData.phone,
        channel: 'sms'
      });

      if (response.data.mock_otp) {
        alert(`Phone OTP sent to ${formData.phone}\n\nDEMO OTP: ${response.data.mock_otp}`);
      } else {
        alert(`Phone OTP sent to ${formData.phone}`);
      }
      setStep(4); // Go to Phone OTP Step
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send Phone OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailOtpVerify = async () => {
    const enteredOtp = emailOtp.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/otp/verify/', {
        contact: formData.email,
        otp: enteredOtp
      });
      setIsEmailVerified(true);
      setError('');
      alert('✅ Email verified successfully!');

      // Auto proceed to Password/Docs
      setStep(3);

    } catch (err) {
      setError(err.response?.data?.error || 'Invalid Email OTP');
      setEmailOtp(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerifyAndRegister = async () => {
    const enteredOtp = phoneOtp.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }
    setIsLoading(true);
    try {
      // 1. Verify Phone OTP
      await api.post('/otp/verify/', {
        contact: formData.phone,
        otp: enteredOtp
      });
      setIsOtpVerified(true);

      // 2. Submit Registration
      await handleSignupInternal();

    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
      setPhoneOtp(['', '', '', '', '', '']);
      setIsLoading(false); // Only stop loading if error, otherwise handleSignupInternal handles it/redirects
    }
  };

  const handleOtpChange = (index, value, type) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    if (type === "email") {
      const newOtp = [...emailOtp];
      newOtp[index] = value;
      setEmailOtp(newOtp);
      if (value && index < 5)
        document.getElementById(`email-otp-${index + 1}`)?.focus();
    } else {
      const newOtp = [...phoneOtp];
      newOtp[index] = value;
      setPhoneOtp(newOtp);
      if (value && index < 5)
        document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e, type) => {
    if (e.key === "Backspace") {
      if (type === "email" && !emailOtp[index] && index > 0) {
        document.getElementById(`email-otp-${index - 1}`)?.focus();
      } else if (type === "phone" && !phoneOtp[index] && index > 0) {
        document.getElementById(`otp-${index - 1}`)?.focus();
      }
    }
  };

  const handleSignupInternal = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('full_name', formData.fullName);
      formDataToSend.append('phone_number', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);

      if (formData.document) {
        formDataToSend.append('id_proof', formData.document);
      }

      await api.post('/register/client/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      alert('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMsg = Object.values(err.response.data).flat().join(', ');
        setError(errorMsg || 'Registration failed. Please try again.');
        setIsLoading(false);
      } else {
        setError('Registration failed. Please try again.');
        setIsLoading(false);
      }
    }
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
              <div className={`step-circle ${step >= 1 ? "active" : ""}`}>
                1
              </div>
              <div className="step-info">
                <h4>Personal Info</h4>
                <p>Basic details</p>
              </div>
            </div>

            <div className="progress-line"></div>

            <div className="progress-step">
              <div className={`step-circle ${step >= 2 ? "active" : ""}`}>
                2
              </div>
              <div className="step-info">
                <h4>Email</h4>
                <p>Verify Email</p>
              </div>
            </div>

            <div className="progress-line"></div>

            <div className="progress-step">
              <div className={`step-circle ${step >= 3 ? 'active' : ''}`}>3</div>
              <div className="step-info">
                <h4>Security</h4>
                <p>Password & Docs</p>
              </div>
            </div>

            <div className="progress-line"></div>

            <div className="progress-step">
              <div className={`step-circle ${step >= 4 ? 'active' : ''}`}>4</div>
              <div className="step-info">
                <h4>Phone</h4>
                <p>Verify & Create</p>
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

            <form onSubmit={(e) => e.preventDefault()} className="auth-form">
              {step === 1 ? (
                <>
                  <div className="input-group">
                    <label>Full Name *</label>
                    <div className="input-wrapper">
                      <User size={20} className="input-icon" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Email Address *</label>
                    <div className="input-wrapper">
                      <Mail size={20} className="input-icon" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Phone Number *</label>
                    <div className="input-wrapper">
                      <Phone size={20} className="input-icon" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Address *</label>
                    <div className="input-wrapper">
                      <MapPin size={20} className="input-icon" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>City *</label>
                    <select
                      className="select-input"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    >
                      <option value="">Select City</option>
                      <option>Mumbai</option>
                      <option>Delhi</option>
                      <option>Bangalore</option>
                      <option>Pune</option>
                      <option>Hyderabad</option>
                      <option>Chennai</option>
                      <option>Kolkata</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn-next"
                    onClick={handleNextStep}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Next: Verify Email →"
                    )}
                  </button>
                </>
              ) : step === 2 ? (
                <>
                  <div className="otp-section">
                    <h3>Verify Email Address</h3>
                    <p>
                      We've sent a code to <strong>{formData.email}</strong>
                    </p>

                    <div
                      className="code-input-group"
                      style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "center",
                        margin: "20px 0",
                      }}
                    >
                      {emailOtp.map((digit, index) => (
                        <input
                          key={index}
                          id={`email-otp-${index}`}
                          type="text"
                          maxLength="1"
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value, "email")
                          }
                          onKeyDown={(e) => handleOtpKeyDown(index, e, "email")}
                          className="code-input"
                          style={{
                            width: "40px",
                            height: "40px",
                            textAlign: "center",
                            fontSize: "1.2rem",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                          disabled={isLoading}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn-verify"
                      onClick={handleEmailOtpVerify}
                      disabled={isLoading}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "#2ecc71",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "1rem",
                      }}
                    >
                      {isLoading ? "Verifying..." : "Verify Email"}
                    </button>

                    <button
                      type="button"
                      className="btn-back"
                      onClick={() => setStep(1)}
                      style={{
                        marginTop: "10px",
                        background: "transparent",
                        color: "#666",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      ← Change Contact Info
                    </button>
                  </div>
                </>
              ) : step === 3 ? (
                <>
                  <div className="input-group">
                    <label>Upload Verification Document *</label>

                    <div className="document-upload-box">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            document: e.target.files[0],
                          })
                        }
                      />

                      <div className="document-upload-content">
                        <Upload size={26} />
                        <p>
                          Upload <b>Aadhaar Card</b> or <b>PAN Card</b>
                        </p>

                        {formData.document ? (
                          <span className="file-name">
                            📄 {formData.document.name}
                          </span>
                        ) : (
                          <span>PDF / JPG / PNG (Max 2MB)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Create Password *</label>
                    <div className="input-wrapper">
                      <Lock size={20} className="input-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Confirm Password *</label>
                    <div className="input-wrapper">
                      <Lock size={20} className="input-icon" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="terms-box">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.agreeTerms}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            agreeTerms: e.target.checked,
                          })
                        }
                      />
                      <span>I agree to Terms & Conditions</span>
                    </label>
                  </div>

                  <div className="button-group">
                    <button type="button" className="btn-back" onClick={() => setStep(2)}>
                      ← Back
                    </button>
                    <button type="button" className="btn-submit" onClick={handleNextStep} disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin" /> : 'Next: Verify Phone →'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="otp-section">
                    <h3>Verify Phone Number & Register</h3>
                    <p>We've sent a code to <strong>{formData.phone}</strong></p>

                    <div className="code-input-group" style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0' }}>
                      {phoneOtp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value, 'phone')}
                          onKeyDown={(e) => handleOtpKeyDown(index, e, 'phone')}
                          className="code-input"
                          style={{
                            width: '40px',
                            height: '40px',
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            borderRadius: '8px',
                            border: '1px solid #ddd'
                          }}
                          disabled={isLoading}
                        />
                      ))}
                    </div>

                    <button type="button" className="btn-verify" onClick={handleOtpVerifyAndRegister} disabled={isLoading} style={{ width: '100%', padding: '12px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>
                      {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                    </button>

                    <button type="button" className="btn-back" onClick={() => setStep(3)} style={{ marginTop: '10px', background: 'transparent', color: '#666', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      ← Back
                    </button>
                  </div>
                </>
              )}
            </form>

            <p className="auth-footer">
              Already have an account?
              <Link to="/login" className="auth-link">
                {" "}
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
