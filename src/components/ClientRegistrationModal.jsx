import React, { useState } from "react";
import { X, Upload, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./ClientRegistrationModal.css";

const ClientRegistrationModal = ({ onClose }) => {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    password: "",
    confirmPassword: "",
    idProof: null,
    profileImage: null,
  });

  const handleSubmit = async () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.password
    ) {
      alert("Please fill all required fields!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    setLoading(true);

    const payload = {
      email: formData.email,
      password: formData.password,
      full_name: formData.fullName,
      phone_number: formData.phone,
      address: formData.address,
      city: formData.city,
      // Skipping file uploads for now
    };

    const result = await register("client", payload);

    setLoading(false);

    if (result.success) {
      setStep(2);
    } else {
      const errorMsg = result.error
        ? JSON.stringify(result.error)
        : "Registration failed";
      alert(errorMsg);
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  if (step === 2) {
    return (
      <div className="modal-overlay">
        <div className="modal-content success-modal">
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
          <div className="success-content">
            <div className="success-icon">
              <CheckCircle size={60} />
            </div>
            <h2 className="success-title">Registration Successful!</h2>
            <p className="success-text">
              Welcome to EcoScrap! Your account has been created successfully.
            </p>
            <div className="success-info">
              <p>You are now logged in.</p>
            </div>
            <button onClick={onClose} className="btn-success">
              Start Buying Scrap
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content registration-modal">
        <div className="modal-header">
          <h2>Client Registration</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Personal Information */}
          <div className="form-section">
            <h3 className="form-section-title">Personal Information</h3>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="form-input"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+91 1234567890"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address *</label>
              <textarea
                placeholder="Enter your complete address"
                className="form-textarea"
                rows="2"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>City *</label>
              <select
                className="form-select"
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
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Kolkata">Kolkata</option>
              </select>
            </div>
          </div>

          {/* Account Security */}
          <div className="form-section">
            <h3 className="form-section-title">Account Security</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  className="form-input"
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
          </div>

          {/* Documents - Visual Only for now */}
          <div className="form-section">
            <h3 className="form-section-title">Documents (Optional)</h3>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#666",
                marginBottom: "10px",
              }}
            >
              * Note: Document upload is currently disabled during system
              maintenance.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label>ID Proof</label>
                <div className="upload-box">
                  <Upload className="upload-icon" />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, "idProof")}
                    className="file-input"
                    id="id-upload"
                  />
                  <label htmlFor="id-upload" className="upload-label">
                    Upload ID Proof
                  </label>
                  {formData.idProof && (
                    <p className="file-name">✓ {formData.idProof.name}</p>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Profile Image</label>
                <div className="upload-box">
                  <Upload className="upload-icon" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "profileImage")}
                    className="file-input"
                    id="profile-upload"
                  />
                  <label htmlFor="profile-upload" className="upload-label">
                    Upload Photo
                  </label>
                  {formData.profileImage && (
                    <p className="file-name">✓ {formData.profileImage.name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="terms-box">
            <label className="terms-label">
              <input type="checkbox" required />
              <span>
                I agree to the Terms & Conditions and Privacy Policy of EcoScrap
              </span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            className="btn-register"
            disabled={loading} // Disable button while loading
          >
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <Loader2 className="animate-spin" size={20} /> Registering...
              </span>
            ) : (
              "Register Now"
            )}
          </button>

          <p className="login-link">
            Already have an account? <a href="#">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientRegistrationModal;
