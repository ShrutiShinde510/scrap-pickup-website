import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  MapPin,
  Calendar,
  Clock,
  Package,
  DollarSign,
  CheckCircle,
  Navigation
} from "lucide-react";
import { scrapCategories, cities, timeSlots } from "../data/scrapData";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "./BookPickupPage.css";
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import toast from "react-hot-toast";

const libraries = ["places"];

const BookPickupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    scrapType: "",
    quantity: "",
    scrapImage: null,
    address: "",
    city: "",
    pincode: "",
    landmark: "",
    pickupDate: "",
    timeSlot: "",
    additionalNotes: "",
    latitude: null,
    longitude: null,
  });

  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [error, setError] = useState("");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [map, setMap] = useState(null);
  const autocompleteRef = useRef(null);
  const [markerPosition, setMarkerPosition] = useState({ lat: 18.5204, lng: 73.8567 }); // Default Pune

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { redirectTo: "/book-pickup" },
      });
    } else {
      if (navigator.geolocation && !formData.latitude) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setMarkerPosition(pos);
            setFormData(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }));
          }
        )
      }
    }
  }, [user, navigate]);

  const onLoad = React.useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setMarkerPosition(location);
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address || prev.address,
          latitude: location.lat,
          longitude: location.lng,
        }));
        map?.panTo(location);
        map?.setZoom(17);
      }
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  const onMarkerDragEnd = (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setMarkerPosition({ lat: newLat, lng: newLng });
    setFormData(prev => ({
      ...prev,
      latitude: newLat,
      longitude: newLng
    }));
  };


  const calculatePrice = () => {
    if (formData.scrapType && formData.quantity) {
      if (parseFloat(formData.quantity) < 0) {
        setEstimatedPrice(null);
        return;
      }
      const category = scrapCategories.find(
        (cat) => cat.name === formData.scrapType,
      );
      if (category) {
        const priceRange = category.price.split("-");
        const avgPrice =
          (parseInt(priceRange[0]) + parseInt(priceRange[1])) / 2;
        const total = avgPrice * parseFloat(formData.quantity);
        setEstimatedPrice(total.toFixed(2));
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setFormData({ ...formData, scrapImage: file });
      setError("");
    }
  };

  const validateStep = (step) => {
    setError("");

    if (step === 1) {
      if (!formData.scrapType || !formData.quantity) {
        toast.error("Please select scrap type and enter quantity");
        return false;
      }
      if (parseFloat(formData.quantity) <= 0) {
        toast.error("Quantity must be greater than 0");
        return false;
      }
      calculatePrice();
      return true;
    }

    if (step === 2) {
      if (!formData.address || !formData.city || !formData.pincode) {
        toast.error("Please fill all address fields");
        return false;
      }
      if (formData.pincode.length !== 6) {
        toast.error("Please enter valid 6-digit pincode");
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!formData.pickupDate || !formData.timeSlot) {
        toast.error("Please select pickup date and time slot");
        return false;
      }
      const selectedDate = new Date(formData.pickupDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        toast.error("Pickup date cannot be in the past");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      const payload = new FormData();
      payload.append("scrap_type", formData.scrapType);
      payload.append("quantity", formData.quantity);
      if (estimatedPrice) {
        payload.append("estimated_price", estimatedPrice);
      }
      payload.append("address", formData.address);
      payload.append("city", formData.city);
      payload.append("pincode", formData.pincode);
      payload.append("landmark", formData.landmark);
      payload.append("latitude", formData.latitude || 0);
      payload.append("longitude", formData.longitude || 0);
      payload.append("date", formData.pickupDate);
      payload.append("time_slot", formData.timeSlot);
      if (formData.scrapImage) {
        payload.append("scrape_image", formData.scrapImage);
      }

      const res = await api.post("pickup/create/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setBookingId(res.data.request_id || "BP" + Date.now());
      setCurrentStep(5);
    } catch (err) {
      console.error("Booking Error:", err);
      toast.error(
        err.response?.data?.error ||
        "Failed to create booking. Please try again.",
      );
    }
  };

  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    marginTop: '15px',
    borderRadius: '8px'
  };

  if (currentStep === 1) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-header">
            <Package size={40} className="header-icon" />
            <h1>Book Scrap Pickup</h1>
            <p>Step 1 of 4: Scrap Details</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "25%" }}></div>
            </div>
          </div>

          <div className="form-section">
            <div className="input-group">
              <label>Scrap Type *</label>
              <select
                className="select-input"
                value={formData.scrapType}
                onChange={(e) => {
                  setFormData({ ...formData, scrapType: e.target.value });
                  setEstimatedPrice(null);
                }}
              >
                <option value="">Select Scrap Category</option>
                {scrapCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name} (₹{cat.price}/kg)
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Quantity (kg) *</label>
              <input
                type="number"
                placeholder="Enter approximate quantity in kg"
                className="text-input"
                value={formData.quantity}
                onChange={(e) => {
                  setFormData({ ...formData, quantity: e.target.value });
                  setEstimatedPrice(null);
                }}
              />
            </div>

            {formData.scrapType && formData.quantity && !estimatedPrice && (
              <button onClick={calculatePrice} className="btn-calculate">
                Calculate Estimated Price
              </button>
            )}

            {estimatedPrice && (
              <div className="price-estimate">
                <DollarSign size={24} />
                <div>
                  <h3>Estimated Price</h3>
                  <p className="price">₹{estimatedPrice}</p>
                  <small>
                    Final price may vary based on actual quantity and quality
                  </small>
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Upload Scrap Image (Optional)</label>
              <div className="upload-box">
                <Upload size={32} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                  id="scrap-image"
                />
                <label htmlFor="scrap-image" className="upload-label">
                  {formData.scrapImage
                    ? "✓ " + formData.scrapImage.name
                    : "Click to upload image"}
                </label>
                <small>Helps us verify the scrap type (Max 5MB)</small>
              </div>
            </div>

            <button onClick={handleNext} className="btn-next">
              Next: Address Details →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-header">
            <MapPin size={40} className="header-icon" />
            <h1>Pickup Address</h1>
            <p>Step 2 of 4: Address Details</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "50%" }}></div>
            </div>
          </div>

          <div className="form-section">
            {isLoaded ? (
              <div className="map-input-section">
                <label>Search Address (or drag Pin below)</label>
                <Autocomplete
                  onLoad={(autocomplete) => autocompleteRef.current = autocomplete}
                  onPlaceChanged={onPlaceChanged}
                >
                  <div className="search-box-wrapper">
                    <input type="text" placeholder="Search your location..." className="text-input" style={{ paddingLeft: '35px' }} />
                    <Navigation size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                  </div>
                </Autocomplete>

                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={markerPosition}
                  zoom={15}
                  onLoad={onLoad}
                  onUnmount={onUnmount}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                  }}
                >
                  <Marker
                    position={markerPosition}
                    draggable={true}
                    onDragEnd={onMarkerDragEnd}
                    animation={window.google.maps.Animation.DROP}
                  />
                </GoogleMap>
                <p className="helper-text-sm" style={{ marginTop: '5px', color: '#666' }}>
                  📍 Drag the pin to pinpoint exact location
                </p>
              </div>
            ) : (<div>Loading Map...</div>)}


            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Complete Address *</label>
              <textarea
                placeholder="House/Flat No., Building Name, Street"
                className="text-input"
                rows="3"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="input-row">
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
                  {cities.map((city, idx) => (
                    <option key={idx} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Pincode *</label>
                <input
                  type="text"
                  placeholder="6-digit pincode"
                  className="text-input"
                  maxLength="6"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pincode: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
            </div>

            <div className="input-group">
              <label>Landmark (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Near City Mall, Behind Bank"
                className="text-input"
                value={formData.landmark}
                onChange={(e) =>
                  setFormData({ ...formData, landmark: e.target.value })
                }
              />
            </div>

            <div className="button-group">
              <button onClick={handleBack} className="btn-back">
                ← Back
              </button>
              <button onClick={handleNext} className="btn-next">
                Next: Schedule →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Schedule
  if (currentStep === 3) {
    const today = new Date().toISOString().split("T")[0];

    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-header">
            <Calendar size={40} className="header-icon" />
            <h1>Schedule Pickup</h1>
            <p>Step 3 of 4: Date & Time</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "75%" }}></div>
            </div>
          </div>

          <div className="form-section">
            <div className="input-group">
              <label>Pickup Date *</label>
              <input
                type="date"
                className="text-input"
                min={today}
                value={formData.pickupDate}
                onChange={(e) =>
                  setFormData({ ...formData, pickupDate: e.target.value })
                }
              />
            </div>

            <div className="input-group">
              <label>Time Slot *</label>
              <div className="time-slots">
                {timeSlots.map((slot, idx) => (
                  <label
                    key={idx}
                    className={`time-slot-card ${formData.timeSlot === slot.value ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="timeSlot"
                      value={slot.value}
                      checked={formData.timeSlot === slot.value}
                      onChange={(e) =>
                        setFormData({ ...formData, timeSlot: e.target.value })
                      }
                    />
                    <Clock size={20} />
                    <span>{slot.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Additional Notes (Optional)</label>
              <textarea
                placeholder="Any special instructions for the pickup..."
                className="text-input"
                rows="3"
                value={formData.additionalNotes}
                onChange={(e) =>
                  setFormData({ ...formData, additionalNotes: e.target.value })
                }
              />
            </div>

            <div className="button-group">
              <button onClick={handleBack} className="btn-back">
                ← Back
              </button>
              <button onClick={handleNext} className="btn-next">
                Review Booking →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Review & Confirm
  if (currentStep === 4) {
    return (
      <div className="booking-page">
        <div className="booking-container review-container">
          <div className="booking-header">
            <CheckCircle size={40} className="header-icon" />
            <h1>Review Your Booking</h1>
            <p>Step 4 of 4: Confirm Details</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "100%" }}></div>
            </div>
          </div>

          <div className="review-section">
            <div className="review-card">
              <h3>📦 Scrap Details</h3>
              <div className="review-item">
                <span>Type:</span>
                <strong>{formData.scrapType}</strong>
              </div>
              <div className="review-item">
                <span>Quantity:</span>
                <strong>{formData.quantity} kg</strong>
              </div>
              <div className="review-item">
                <span>Estimated Price:</span>
                <strong className="price-highlight">₹{estimatedPrice}</strong>
              </div>
            </div>

            <div className="review-card">
              <h3>📍 Pickup Address</h3>
              <p>{formData.address}</p>
              <p>{formData.landmark && `Landmark: ${formData.landmark}`}</p>
              <p>
                {formData.city}, {formData.pincode}
              </p>
            </div>

            <div className="review-card">
              <h3>📅 Schedule</h3>
              <div className="review-item">
                <span>Date:</span>
                <strong>
                  {new Date(formData.pickupDate).toLocaleDateString()}
                </strong>
              </div>
              <div className="review-item">
                <span>Time:</span>
                <strong>
                  {timeSlots.find((s) => s.value === formData.timeSlot)?.label}
                </strong>
              </div>
            </div>

            {formData.additionalNotes && (
              <div className="review-card">
                <h3>📝 Additional Notes</h3>
                <p>{formData.additionalNotes}</p>
              </div>
            )}
          </div>

          <div className="button-group">
            <button onClick={handleBack} className="btn-back">
              ← Back
            </button>
            <button onClick={handleSubmit} className="btn-confirm">
              Confirm Booking ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Success
  if (currentStep === 5) {
    return (
      <div className="booking-page">
        <div className="booking-container success-container">
          <div className="success-icon">
            <CheckCircle size={80} />
          </div>
          <h1 className="success-title">Request Submitted!</h1>
          <p className="success-subtitle">
            Searching for nearby vendors...
          </p>

          <div className="booking-id-card">
            <h3>Booking ID</h3>
            <p className="booking-id">{bookingId}</p>
            <small>Save this ID for tracking your pickup</small>
          </div>

          <div className="success-details">
            <div className="detail-item">
              <Calendar size={20} />
              <span>{new Date(formData.pickupDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <Clock size={20} />
              <span>
                {timeSlots.find((s) => s.value === formData.timeSlot)?.label}
              </span>
            </div>
            <div className="detail-item">
              <DollarSign size={20} />
              <span>₹{estimatedPrice} (estimated)</span>
            </div>
          </div>

          <div className="success-info">
            <h4>What's Next?</h4>
            <ul>
              <li>✓ A vendor will be assigned to your booking</li>
              <li>✓ You'll receive a confirmation email</li>
              <li>✓ Vendor will arrive at scheduled time</li>
              <li>✓ Payment after pickup completion</li>
            </ul>
          </div>

          <div className="success-actions">
            <button
              onClick={() => {
                if (user?.is_seller) {
                  navigate("/vendor-dashboard");
                } else {
                  navigate("/dashboard");
                }
              }}
              className="btn-dashboard"
            >
              📊 Go to Dashboard
            </button>

            <button
              onClick={() => {
                setCurrentStep(1);
                setFormData({
                  scrapType: "",
                  quantity: "",
                  scrapImage: null,
                  address: "",
                  city: "",
                  pincode: "",
                  landmark: "",
                  pickupDate: "",
                  timeSlot: "",
                  additionalNotes: "",
                  latitude: null,
                  longitude: null,
                });
                setEstimatedPrice(null);
                setBookingId(null);
                setError("");
              }}
              className="btn-new-booking"
            >
              📦 Book Another Pickup
            </button>

            <button onClick={() => navigate("/")} className="btn-home-link">
              🏠 Back to Home
            </button>
          </div>

        </div>
      </div>
    );
  }

  return null;
};

export default BookPickupPage;

