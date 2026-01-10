import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Upload,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle,
  Briefcase,
  FileText,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { scrapCategories } from "../data/scrapData";
import api from "../api/axios.ts";
import "./SignupPage.css"; // Reusing SignupPage styles for layout
import "./VendorRegistrationPage.css"; // Vendor specific form styles

const VendorRegistrationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Personal Info
    contactPerson: "",
    email: "",
    phone: "",

    // Business Info
    businessName: "",
    businessType: "",
    address: "",
    city: "",
    operatingAreas: "",

    // Documents
    businessLicense: null,
    gstCertificate: null,
    addressProof: null,
    idProof: null,

    // Password
    password: "",
    confirmPassword: "",
  });

  const [emailOTP, setEmailOTP] = useState(["", "", "", "", "", ""]);
  const [phoneOTP, setPhoneOTP] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ... (Keep existing validation and handler functions unchanged)
  // To keep the file concise for the tool, I'm assuming you want me to retain
  // the logic functions (validateStep1, validateStep3, handleStep1Next etc)
  // and only change the RETURN logic.
  // I will re-declare the logic functions here to ensure the code is complete.

  // ============================================
  // VALIDATION
  // ============================================
  const validateStep1 = () => {
    if (!formData.contactPerson || !formData.email || !formData.phone) {
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

  const validateStep3 = () => {
    if (
      !formData.businessName ||
      !formData.businessType ||
      !formData.address ||
      !formData.city ||
      !formData.operatingAreas
    ) {
      setError("Please fill all Business Details fields");
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    // Documents
    if (
      !formData.businessLicense ||
      !formData.gstCertificate ||
      !formData.addressProof ||
      !formData.idProof
    ) {
      setError("Please upload all required documents");
      return false;
    }

    // Password
    if (!formData.password || !formData.confirmPassword) {
      setError("Please set a password");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleStep1Next = async () => {
    setError("");
    if (validateStep1()) {
      setIsLoading(true);
      try {
        const response = await api.post("/otp/send/", {
          contact: formData.email,
          channel: "email",
        });

        if (response.data.mock_otp) {
          toast.success(`Email OTP: ${response.data.mock_otp}`, {
            duration: 6000,
            icon: "📧",
          });
        } else {
          toast.success(`Email OTP sent to ${formData.email}`);
        }
        setCurrentStep(2);
      } catch (err) {
        console.error("OTP Error:", err);
        setError(err.response?.data?.error || "Failed to send OTP.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEmailOTPVerify = async () => {
    const enteredOTP = emailOTP.join("");
    if (enteredOTP.length < 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/otp/verify/", {
        contact: formData.email,
        otp: enteredOTP,
      });
      setError("");
      toast.success("Email verified successfully!");
      setCurrentStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP.");
      setEmailOTP(["", "", "", "", "", ""]);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3 -> STEP 4 (Business -> Docs)
  const handleStep3Next = () => {
    setError("");
    if (validateStep3()) {
      setCurrentStep(4);
    }
  };

  // STEP 4 -> STEP 5 (Docs -> Phone OTP)
  const handleStep4Next = async () => {
    setError("");
    if (validateStep4()) {
      setIsLoading(true);
      try {
        const response = await api.post("/otp/send/", {
          contact: formData.phone,
          channel: "sms",
        });
        if (response.data.mock_otp) {
          toast.success(`Phone OTP: ${response.data.mock_otp}`, {
            duration: 6000,
            icon: "📱",
          });
        } else {
          toast.success(`Phone OTP sent to ${formData.phone}`);
        }
        setCurrentStep(5);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to send OTP.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePhoneOTPVerify = async () => {
    const enteredOTP = phoneOTP.join("");
    if (enteredOTP.length < 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/otp/verify/", {
        contact: formData.phone,
        otp: enteredOTP,
      });

      const formDataToSend = new FormData();
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("full_name", formData.contactPerson);
      formDataToSend.append("phone_number", formData.phone);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("business_name", formData.businessName);
      formDataToSend.append("business_type", formData.businessType);
      formDataToSend.append("operating_areas", formData.operatingAreas);

      if (formData.businessLicense)
        formDataToSend.append("business_license", formData.businessLicense);
      if (formData.gstCertificate)
        formDataToSend.append("gst_certificate", formData.gstCertificate);
      if (formData.addressProof)
        formDataToSend.append("address_proof", formData.addressProof);
      if (formData.idProof)
        formDataToSend.append("vendor_id_proof", formData.idProof);

      await api.post("/register/seller/", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setError("");
      setCurrentStep(6);
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response && err.response.data) {
        const errorMsg =
          typeof err.response.data === "string"
            ? err.response.data
            : Object.values(err.response.data).flat().join(", ");
        setError(errorMsg || "Registration failed.");
      } else {
        setError("Registration failed.");
      }
      setPhoneOTP(["", "", "", "", "", ""]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index, value, type) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    if (type === "email") {
      const newOTP = [...emailOTP];
      newOTP[index] = value;
      setEmailOTP(newOTP);
      if (value && index < 5)
        document.getElementById(`email-otp-${index + 1}`)?.focus();
    } else {
      const newOTP = [...phoneOTP];
      newOTP[index] = value;
      setPhoneOTP(newOTP);
      if (value && index < 5)
        document.getElementById(`phone-otp-${index + 1}`)?.focus();
    }
  };

  const handleOTPKeyDown = (index, e, type) => {
    const currentOTP = type === "email" ? emailOTP : phoneOTP;
    if (e.key === "Backspace" && !currentOTP[index] && index > 0) {
      document.getElementById(`${type}-otp-${index - 1}`)?.focus();
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFormData({ ...formData, [field]: file });
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="auth-page">
      <div className="auth-container signup-container">
        {/* LEFT SIDEBAR - PROGRESS */}
        <div className="auth-left">
          <div className="auth-brand">
            <h1>EcoScrap</h1>
            <p className="tagline">Partner with us & Grow</p>
          </div>

          <div className="signup-progress">
            <div className="progress-step">
              <div
                className={`step-circle ${currentStep >= 1 ? "active" : ""}`}
              >
                1
              </div>
              <div className="step-info">
                <h4>Contact Info</h4>
                <p>Personal Details</p>
              </div>
            </div>
            <div className="progress-line"></div>

            <div className="progress-step">
              <div
                className={`step-circle ${currentStep >= 2 ? "active" : ""}`}
              >
                2
              </div>
              <div className="step-info">
                <h4>Email Verify</h4>
                <p>Verification</p>
              </div>
            </div>
            <div className="progress-line"></div>

            <div className="progress-step">
              <div
                className={`step-circle ${currentStep >= 3 ? "active" : ""}`}
              >
                3
              </div>
              <div className="step-info">
                <h4>Business Info</h4>
                <p>Basic Details</p>
              </div>
            </div>
            <div className="progress-line"></div>

            <div className="progress-step">
              <div
                className={`step-circle ${currentStep >= 4 ? "active" : ""}`}
              >
                4
              </div>
              <div className="step-info">
                <h4>Documents</h4>
                <p>& Security</p>
              </div>
            </div>
            <div className="progress-line"></div>

            <div className="progress-step">
              <div
                className={`step-circle ${currentStep >= 5 ? "active" : ""}`}
              >
                5
              </div>
              <div className="step-info">
                <h4>Final Step</h4>
                <p>Phone Verify</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT - FORMS */}
        <div className="auth-right">
          <div className="auth-form-container">
            {/* Header */}
            <div className="auth-header">
              <Briefcase
                size={40}
                className="auth-icon"
                style={{ color: "#059669" }}
              />
              <h2>Vendor Registration</h2>
              <p>Create your vendor account today</p>
            </div>

            {error && (
              <div className="error-message">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* STEP 1: CONTACT INFO */}
            {currentStep === 1 && (
              <div className="form-section">
                <div className="input-group">
                  <label>Contact Person Name *</label>
                  <div className="input-wrapper">
                    <User size={20} className="input-icon" />
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: e.target.value,
                        })
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
                      placeholder="your@email.com"
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
                      placeholder="+91 1234567890"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <button
                  onClick={handleStep1Next}
                  className="btn-next"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Next: Verify Email →"}
                </button>
              </div>
            )}

            {/* STEP 2: EMAIL OTP */}
            {currentStep === 2 && (
              <div className="otp-section">
                <h3>Verify Email Address</h3>
                <p>
                  Code sent to <strong>{formData.email}</strong>
                </p>

                <div className="code-input-group">
                  {emailOTP.map((digit, index) => (
                    <input
                      key={index}
                      id={`email-otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) =>
                        handleOTPChange(index, e.target.value, "email")
                      }
                      onKeyDown={(e) => handleOTPKeyDown(index, e, "email")}
                      className="code-input"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <button
                  onClick={handleEmailOTPVerify}
                  className="btn-verify"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </button>

                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn-back"
                  style={{ width: "100%", marginTop: "10px" }}
                >
                  ← Change Email
                </button>
              </div>
            )}

            {/* STEP 3: BUSINESS DETAILS (Only Info) */}
            {currentStep === 3 && (
              <div className="form-section">
                <div className="input-group">
                  <label>Business Name *</label>
                  <div className="input-wrapper">
                    <Building size={20} className="input-icon" />
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Business Type *</label>
                  <select
                    className="select-input"
                    value={formData.businessType}
                    onChange={(e) =>
                      setFormData({ ...formData, businessType: e.target.value })
                    }
                  >
                    <option value="">Select Type</option>
                    <option value="Sole Proprietorship">
                      Sole Proprietorship
                    </option>
                    <option value="Partnership">Partnership</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="LLP">LLP</option>
                    <option value="Other">Other</option>
                  </select>
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
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Pune">Pune</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Operating Areas (comma separated) *</label>
                  <input
                    type="text"
                    className="text-input"
                    value={formData.operatingAreas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingAreas: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="button-group">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="btn-back"
                  >
                    Back
                  </button>
                  <button onClick={handleStep3Next} className="btn-next">
                    Next: Docs →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: DOCS & SECURITY (Docs and Password) */}
            {currentStep === 4 && (
              <div className="form-section">
                <div className="documents-section" style={{ marginTop: "0" }}>
                  <h3
                    style={{
                      fontSize: "16px",
                      marginBottom: "15px",
                      color: "#374151",
                    }}
                  >
                    Upload Required Documents *
                  </h3>
                  <div
                    className="upload-grid"
                    style={{ gridTemplateColumns: "1fr 1fr" }}
                  >
                    {[
                      { field: "businessLicense", label: "Business License" },
                      { field: "gstCertificate", label: "GST Certificate" },
                      { field: "addressProof", label: "Address Proof" },
                      { field: "idProof", label: "ID Proof" },
                    ].map((doc) => (
                      <div
                        key={doc.field}
                        className="upload-box"
                        style={{ padding: "15px" }}
                      >
                        <input
                          type="file"
                          id={doc.field}
                          className="file-input"
                          onChange={(e) => handleFileUpload(e, doc.field)}
                        />
                        <label htmlFor={doc.field} className="upload-label">
                          <Upload size={16} style={{ marginBottom: "5px" }} />{" "}
                          <br />
                          {doc.label}
                        </label>
                        {formData[doc.field] && (
                          <p
                            className="file-uploaded"
                            style={{ fontSize: "10px" }}
                          >
                            {formData[doc.field].name.substring(0, 15)}...
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <hr
                  style={{
                    margin: "20px 0",
                    border: "none",
                    borderTop: "1px solid #e5e7eb",
                  }}
                />

                <div className="input-group">
                  <label>Create Password *</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label>Confirm Password *</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="button-group">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="btn-back"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStep4Next}
                    className="btn-next"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending OTP..." : "Next: Verify Phone →"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: PHONE OTP */}
            {currentStep === 5 && (
              <div className="otp-section">
                <h3>Verify Phone Number</h3>
                <p>
                  Code sent to <strong>{formData.phone}</strong>
                </p>

                <div className="code-input-group">
                  {phoneOTP.map((digit, index) => (
                    <input
                      key={index}
                      id={`phone-otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) =>
                        handleOTPChange(index, e.target.value, "phone")
                      }
                      onKeyDown={(e) => handleOTPKeyDown(index, e, "phone")}
                      className="code-input"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <button
                  onClick={handlePhoneOTPVerify}
                  className="btn-verify"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify & Register"}
                </button>

                <button
                  onClick={() => setCurrentStep(4)}
                  className="btn-back"
                  style={{ width: "100%", marginTop: "10px" }}
                >
                  ← Back to Docs
                </button>
              </div>
            )}

            {/* STEP 6: SUCCESS */}
            {currentStep === 6 && (
              <div
                className="success-container"
                style={{ textAlign: "center", padding: "20px" }}
              >
                <div
                  className="success-icon-wrapper"
                  style={{ margin: "0 auto 20px" }}
                >
                  <CheckCircle size={60} />
                </div>
                <h2 className="success-title" style={{ fontSize: "24px" }}>
                  Registration Submitted!
                </h2>
                <p
                  className="success-subtitle"
                  style={{ marginBottom: "20px" }}
                >
                  Your application is pending admin approval.
                </p>

                <div
                  className="success-info"
                  style={{ fontSize: "14px", marginBottom: "20px" }}
                >
                  <p>✓ Email & Phone Verified</p>
                  <p>✓ Documents Uploaded</p>
                  <br />
                  <p style={{ fontStyle: "italic" }}>
                    We will notify you via email once approved (usually 2-3
                    business days).
                  </p>
                </div>

                <button onClick={() => navigate("/")} className="btn-home">
                  Return Home
                </button>
              </div>
            )}

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

export default VendorRegistrationPage;

