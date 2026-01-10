import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Edit,
  Navigation,
  Phone,
  CheckSquare,
  Star,
  Filter,
  AlertCircle,
  MessageCircle,
  History,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ChatBox from "../components/ChatBox";
import "./VendorDashboard.css";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Vendor's selected scrap types
  const [selectedScrapTypes, setSelectedScrapTypes] = useState([]);
  const [showScrapSelection, setShowScrapSelection] = useState(false);

  const availableScrapTypes = [
    "Plastic",
    "Paper",
    "Metal",
    "Glass",
    "Electronic Waste",
    "Cardboard",
    "Textile",
    "Mixed Scrap",
  ];

  const [availableBookings, setAvailableBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalAssigned: 0,
    pendingPickups: 0,
    completedPickups: 0,
    totalEarnings: 0,
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeChatPickupId, setActiveChatPickupId] = useState(null);
  const [vendorLocation, setVendorLocation] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!user.is_seller) {
      navigate("/");
      return;
    }

    const savedScrapTypes = localStorage.getItem("vendorScrapTypes");
    if (savedScrapTypes) {
      setSelectedScrapTypes(JSON.parse(savedScrapTypes));
    } else {
      setShowScrapSelection(true);
    }

    fetchAllData();
    getCurrentLocation();
  }, [user, navigate]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setVendorLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Location access denied, using default location");
        },
      );
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const availRes = await api.get("/pickup/available/");
      setAvailableBookings(availRes.data);

      const myRes = await api.get("/pickup/vendor-list/");
      setMyBookings(myRes.data);

      updateStats(myRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);

    } finally {
      setLoading(false);
    }
  };

  const updateStats = (bookings) => {
    const stats = {
      totalAssigned: bookings.length,
      pendingPickups: bookings.filter((b) => ["vendor_accepted", "scheduled", "in_progress"].includes(b.status)).length,
      completedPickups: bookings.filter((b) => b.status === "completed").length,
      totalEarnings: bookings
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + parseFloat(b.estimated_price || 0), 0),
    };
    setStats(stats);
  };

  const handleScrapTypeToggle = (type) => {
    setSelectedScrapTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const saveScrapTypes = () => {
    if (selectedScrapTypes.length === 0) {
      toast.error("Please select at least one scrap type");
      return;
    }
    localStorage.setItem(
      "vendorScrapTypes",
      JSON.stringify(selectedScrapTypes),
    );
    setShowScrapSelection(false);
  };

  const filteredAvailableBookings = availableBookings.filter(b =>
    selectedScrapTypes.length === 0 || selectedScrapTypes.includes(b.scrap_type)
  );


  const handleAcceptBooking = async (bookingId) => {
    try {
      await api.post(`/pickup/accept/${bookingId}/`);
      toast.success("Pickup accepted! Waiting for client approval.");
      fetchAllData(); // Refresh lists
      setSelectedBooking(null);
    } catch (err) {
      console.error("Accept Error:", err);
      toast.error(err.response?.data?.error || "Failed to accept booking");
    }
  };


  const handleCancelAcceptance = async (bookingId) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span>Cancel this pickup? It will be released back to other vendors.</span>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              api.post(`/pickup/vendor-cancel/${bookingId}/`)
                .then(() => {
                  toast.success("Pickup cancelled successfully.");
                  fetchAllData();
                  setSelectedBooking(null);
                })
                .catch((err) => {
                  console.error("Cancel Error:", err);
                  toast.error(err.response?.data?.error || "Failed to cancel pickup");
                });
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Yes, Cancel
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            No
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      style: {
        minWidth: '300px'
      }
    });
  };

  const handleCompleteBooking = async (bookingId) => {
    toast("Marking as complete is not yet enabled.", { icon: "🚧" });
  };



  const getStatusBadge = (status) => {
    const badges = {
      confirmed: { color: "#3b82f6", icon: Package, text: "Available" },
      vendor_accepted: { color: "#f59e0b", icon: Clock, text: "Pending Approval" },
      scheduled: { color: "#8b5cf6", icon: Calendar, text: "Scheduled" },
      in_progress: { color: "#8b5cf6", icon: TrendingUp, text: "In Progress" },
      completed: { color: "#10b981", icon: CheckCircle, text: "Completed" },
      cancelled: { color: "#ef4444", icon: XCircle, text: "Cancelled" },
    };

    const badge = badges[status] || badges.confirmed;
    const Icon = badge.icon;

    return (
      <span
        style={{
          background: badge.color + "20",
          color: badge.color,
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  const calculateDistance = (booking) => {
    if (!booking.latitude || !booking.longitude) return "N/A";

    const lat1 = vendorLocation.latitude;
    const lon1 = vendorLocation.longitude;
    const lat2 = booking.latitude;
    const lon2 = booking.longitude;

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  const openClientLocation = (booking) => {
    if (!booking.latitude || !booking.longitude) {
      toast.error("Location not available for this booking");
      return;
    }
    const clientLat = booking.latitude;
    const clientLng = booking.longitude;
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${vendorLocation.latitude},${vendorLocation.longitude}&destination=${clientLat},${clientLng}`,
      "_blank",
    );
  };



  const renderScrapSelectionModal = () => {
    if (!showScrapSelection) return null;

    return (
      <div className="location-modal-overlay">
        <div className="location-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>🎯 Select Your Scrap Types</h2>
          </div>

          <div className="modal-body">
            <div className="modal-section">
              <p style={{ color: "#6b7280", marginBottom: "20px" }}>
                Select the types of scrap materials you want to collect. You'll
                only receive bookings for these selected types.
              </p>

              <div className="scrap-type-grid">
                {availableScrapTypes.map((type) => (
                  <div
                    key={type}
                    className={`scrap-type-card ${selectedScrapTypes.includes(type) ? "selected" : ""}`}
                    onClick={() => handleScrapTypeToggle(type)}
                  >
                    <CheckSquare
                      size={24}
                      color={
                        selectedScrapTypes.includes(type)
                          ? "#059669"
                          : "#d1d5db"
                      }
                    />
                    <span>{type}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "24px" }}>
                <button
                  className="btn-save-scrap-types"
                  onClick={saveScrapTypes}
                  disabled={selectedScrapTypes.length === 0}
                >
                  Save & Continue ({selectedScrapTypes.length} selected)
                </button>
                <p style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", color: "#6b7280" }}>
                  You can change this later in settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBookingModal = () => {
    if (!selectedBooking) return null;

    const isMyBooking = myBookings.find(b => b.id === selectedBooking.id);

    return (
      <div
        className="location-modal-overlay"
        onClick={() => setSelectedBooking(null)}
      >
        <div className="location-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📍 Booking Details</h2>
            <button
              className="modal-close"
              onClick={() => setSelectedBooking(null)}
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-section">
              <h3>ID: #{selectedBooking.id}</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-label">Status:</span>
                  <span className="modal-value">
                    {getStatusBadge(selectedBooking.status)}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">Scrap Type:</span>
                  <span className="modal-value">
                    {selectedBooking.scrap_type}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">Est. Weight:</span>
                  <span className="modal-value">{selectedBooking.quantity} kg</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">Est. Price:</span>
                  <span className="modal-value" style={{ color: "#059669" }}>₹{selectedBooking.estimated_price || '0'}</span>
                </div>
                {selectedBooking.latitude && (
                  <div className="modal-info-item">
                    <span className="modal-label">Distance:</span>
                    <span className="modal-value">
                      {calculateDistance(selectedBooking)} km
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-section">
              <div className="pickup-location-card" style={{ marginBottom: "12px" }}>
                <MapPin size={20} style={{ color: "#059669" }} />
                <div>
                  <p className="pickup-address">{selectedBooking.address}</p>
                  {selectedBooking.city && (
                    <p className="pickup-city">
                      {selectedBooking.city}
                    </p>
                  )}
                </div>
              </div>

              {selectedBooking.latitude && (
                <div className="map-container" style={{ width: "100%", height: "200px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${selectedBooking.latitude},${selectedBooking.longitude}&z=15&output=embed`}
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>

            <div className="modal-section">
              {selectedBooking.status === "open" && !isMyBooking && (
                <button
                  className="btn-accept-booking"
                  onClick={() => {
                    handleAcceptBooking(selectedBooking.id);
                  }}
                >
                  <CheckCircle size={18} />
                  Accept This Pickup
                </button>
              )}

              {selectedBooking.status === "vendor_accepted" && isMyBooking && (
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <p style={{ marginBottom: '10px', color: '#f59e0b' }}>Waiting for client to approve...</p>
                  <button
                    className="btn-complete-booking" // Reusing style but red
                    style={{ background: '#fee2e2', color: '#ef4444' }}
                    onClick={() => {
                      handleCancelAcceptance(selectedBooking.id);
                    }}
                  >
                    <XCircle size={18} />
                    Cancel Request
                  </button>
                </div>
              )}

              {["scheduled", "in_progress"].includes(selectedBooking.status) && isMyBooking && (
                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                  <button
                    className="btn-track-maps"
                    onClick={() => openClientLocation(selectedBooking)}
                  >
                    <Navigation size={18} /> Navigate to Location
                  </button>
                  {selectedBooking.contact_phone && (
                    <button
                      className="btn-call-vendor"
                      onClick={() => window.open(`tel:${selectedBooking.contact_phone}`)}
                    >
                      <Phone size={18} /> Call Client: {selectedBooking.contact_phone}
                    </button>
                  )}
                  {/* Active Chat Button */}
                  <button
                    className="btn-chat"
                    onClick={() => {
                      setActiveChatPickupId(selectedBooking.id);
                      setSelectedBooking(null); // Close details modal
                    }}
                  >
                    <MessageCircle size={18} /> Chat with Client
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderChatModal = () => {
    if (!activeChatPickupId) return null;

    return (
      <div className="location-modal-overlay" onClick={() => setActiveChatPickupId(null)}>
        <div
          className="location-modal"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '450px', padding: '0' }}
        >
          <div className="modal-header" style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>💬 Chat with Client</h2>
            <button className="modal-close" onClick={() => setActiveChatPickupId(null)}>✕</button>
          </div>
          <div className="modal-body" style={{ padding: '0' }}>
            <ChatBox pickupId={activeChatPickupId} style={{ border: 'none', boxShadow: 'none', height: '500px' }} />
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dbeafe" }}>
            <Package size={28} style={{ color: "#3b82f6" }} />
          </div>
          <div className="stat-content">
            <h3>{availableBookings.length}</h3>
            <p>Available Now</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef3c7" }}>
            <Clock size={28} style={{ color: "#fbbf24" }} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingPickups}</h3>
            <p>My Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#d1fae5" }}>
            <CheckCircle size={28} style={{ color: "#10b981" }} />
          </div>
          <div className="stat-content">
            <h3>{stats.completedPickups}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dcfce7" }}>
            <DollarSign size={28} style={{ color: "#059669" }} />
          </div>
          <div className="stat-content">
            <h3>₹{stats.totalEarnings.toFixed(2)}</h3>
            <p>Total Earnings</p>
          </div>
        </div>
      </div>

      <div className="recent-bookings" style={{ marginBottom: "30px" }}>
        <div className="section-header">
          <h2>Your Scrap Types</h2>
          <button
            className="btn-view-all"
            onClick={() => setShowScrapSelection(true)}
          >
            <Edit size={16} /> Edit
          </button>
        </div>
        <div className="scrap-type-chips">
          {selectedScrapTypes.map((type) => (
            <span key={type} className="scrap-chip">
              {type}
            </span>
          ))}
        </div>
      </div>

      <div className="recent-bookings">
        <div className="section-header">
          <h2>Available Pickups (Preview)</h2>
          <button
            className="btn-view-all"
            onClick={() => setActiveTab("available")}
          >
            View All
          </button>
        </div>

        {filteredAvailableBookings.slice(0, 3).map((booking) => (
          <div key={booking.id} className="booking-card" onClick={() => setSelectedBooking(booking)}>
            <div className="booking-header">
              <div className="booking-id">
                <Package size={16} />
                <span>#{booking.id}</span>
              </div>
              <span className="distance-badge">{calculateDistance(booking)} km</span>
            </div>

            <div className="booking-details">
              <div className="detail-row">
                <span className="label">Type:</span>
                <span className="value">{booking.scrap_type}</span>
              </div>
              <div className="detail-row">
                <span className="label">Qty:</span>
                <span className="value">{booking.quantity} kg</span>
              </div>
              <div className="detail-row">
                <span className="label">Location:</span>
                <span className="value truncate" style={{ maxWidth: '150px' }}>{booking.address}</span>
              </div>
            </div>
            <button className="btn-action-sm">View Details</button>
          </div>
        ))}

        {filteredAvailableBookings.length === 0 && (
          <div className="empty-state">
            <Package
              size={64}
              style={{ color: "#d1d5db", marginBottom: "20px" }}
            />
            <h3>No Bookings Available</h3>
            <p>Bookings matching your selected scrap types will appear here</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAvailableList = () => (
    <div className="bookings-list">
      <div className="section-header">
        <h2>Available Pickups (Near You)</h2>
      </div>
      <div className="bookings-grid">
        {filteredAvailableBookings.map((booking) => (
          <div key={booking.id} className="booking-card" onClick={() => setSelectedBooking(booking)}>
            <div className="booking-header">
              <span className="booking-hash">#{booking.id}</span>
              <span className="distance-badge">{calculateDistance(booking)} km</span>
            </div>
            <div className="booking-body">
              <h3>{booking.scrap_type} Scrap</h3>
              <p>{booking.quantity} kg • ₹{booking.estimated_price || '?'}</p>
              <p className="address-text"><MapPin size={12} /> {booking.address}</p>
            </div>
            <div className="booking-footer">
              <button className="btn-accept-sm">Review & Accept</button>
            </div>
          </div>
        ))}
        {filteredAvailableBookings.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            No available pickups found.
          </div>
        )}
      </div>
    </div>
  );

  const renderMyPickups = () => (
    <div className="bookings-list">
      <div className="section-header">
        <h2>My Pickups & History</h2>
      </div>
      <div className="bookings-grid">
        {myBookings.map((booking) => (
          <div key={booking.id} className="booking-card-full">
            <div className="booking-card-header">
              <div>
                <h3>#{booking.id}</h3>
                <p className="booking-date">{new Date(booking.created_at).toLocaleDateString()}</p>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            <div className="booking-card-body">
              <div className="info-item">
                <span className="label">Type</span>
                <span className="value">{booking.scrap_type}</span>
              </div>
              <div className="info-item">
                <span className="label">Quantity</span>
                <span className="value">{booking.quantity} kg</span>
              </div>
              <div className="info-item">
                <span className="label">Est. Price</span>
                <span className="value">₹{booking.estimated_price}</span>
              </div>
            </div>
            <div className="booking-card-footer">
              <button className="btn-view-details" onClick={() => setSelectedBooking(booking)}>
                View Details / Actions
              </button>
              {/* Quick Chat from list */}
              {["vendor_accepted", "scheduled", "in_progress"].includes(booking.status) && (
                <button
                  className="btn-chat-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveChatPickupId(booking.id);
                  }}
                  title="Chat with Client"
                >
                  <MessageCircle size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
        {myBookings.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            You haven't accepted any pickups yet.
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="profile-section">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <div>
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="label">Role:</span>
            <span className="value">Vendor</span>
          </div>
          <div className="detail-item">
            <span className="label">Active Scrap Types:</span>
            <span className="value">{selectedScrapTypes.length}</span>
          </div>
          <div className="detail-item">
            <span className="label">Total Completed:</span>
            <span className="value">{stats.completedPickups}</span>
          </div>
          <div className="detail-item">
            <span className="label">Total Earnings:</span>
            <span className="value" style={{ color: "#059669" }}>
              ₹{stats.totalEarnings.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="profile-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowScrapSelection(true)}
          >
            <Edit size={16} />
            Edit Scrap Types
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1>🚛 Vendor Panel</h1>
            <p>Welcome, {user?.name}!</p>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <TrendingUp size={20} />
              Overview
            </button>
            <button
              className={`nav-item ${activeTab === "available" ? "active" : ""}`}
              onClick={() => setActiveTab("available")}
            >
              <Package size={20} />
              Available Pickups
            </button>
            <button
              className={`nav-item ${activeTab === "my_pickups" ? "active" : ""}`}
              onClick={() => setActiveTab("my_pickups")}
            >
              <History size={20} />
              My Pickups
            </button>
            <button
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={20} />
              Profile
            </button>
          </nav>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "available" && "Available Pickups"}
                {activeTab === "my_pickups" && "My Accepted Pickups"}
                {activeTab === "profile" && "Profile"}
              </h1>
              <p>Manage your scrap pickups and track earnings</p>
            </div>
          </div>

          <div className="dashboard-content">
            {activeTab === "overview" && renderOverview()}
            {activeTab === "available" && renderAvailableList()}
            {activeTab === "my_pickups" && renderMyPickups()}
            {activeTab === "profile" && renderProfile()}
          </div>
        </main>
      </div>

      {renderScrapSelectionModal()}
      {renderBookingModal()}
      {renderChatModal()}
    </div>
  );
};

export default VendorDashboard;
