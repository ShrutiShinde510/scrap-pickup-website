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
  MessageCircle,
} from "lucide-react";
import toast from 'react-hot-toast';
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ChatBox from "../components/ChatBox";
import "./ClientDashboard.css";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
  });
  const [activeTab, setActiveTab] = useState("overview"); // overview, bookings, profile
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeChatPickupId, setActiveChatPickupId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Access Control: Redirect if not a client
    if (!user.is_client) {
      navigate("/");
      return;
    }

    // Load user's bookings
    loadBookings();
  }, [user, navigate]);

  const loadBookings = async () => {
    try {
      const res = await api.get("pickup/list/");
      const userBookings = res.data;
      setBookings(userBookings);

      // Calculate statistics
      const stats = {
        totalBookings: userBookings.length,
        pendingBookings: userBookings.filter((b) => b.status === "pending")
          .length,
        completedBookings: userBookings.filter((b) => b.status === "completed")
          .length,
        totalEarnings: userBookings
          .filter((b) => b.status === "completed")
          .reduce((sum, b) => sum + parseFloat(b.estimated_price || 0), 0),
      };
      setStats(stats);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "#fbbf24", icon: Clock, text: "Pending" },
      confirmed: { color: "#3b82f6", icon: CheckCircle, text: "Confirmed" },
      vendor_accepted: { color: "#f59e0b", icon: User, text: "Vendor Found!" },
      scheduled: { color: "#8b5cf6", icon: Calendar, text: "Scheduled" },
      assigned: { color: "#3b82f6", icon: Calendar, text: "Assigned" }, // Legacy
      in_progress: { color: "#8b5cf6", icon: TrendingUp, text: "In Progress" },
      completed: { color: "#10b981", icon: CheckCircle, text: "Completed" },
      cancelled: { color: "#ef4444", icon: XCircle, text: "Cancelled" },
    };

    const badge = badges[status] || badges.pending;
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

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await api.post(`pickup/cancel/${bookingId}/`);
      loadBookings();
      toast.success("Booking cancelled successfully");
    } catch (err) {
      console.error("Cancel Error:", err);
      toast.error("Failed to cancel booking");
    }
  };

  const handleApproveVendor = async (bookingId) => {
    try {
      await api.post(`/pickup/approve/${bookingId}/`);
      toast.success("Vendor approved! Pickup scheduled.");
      loadBookings();
    } catch (err) {
      console.error("Approve Error:", err);
      toast.error(err.response?.data?.error || "Failed to approve vendor");
    }
  };

  const handleRejectVendor = async (bookingId) => {
    if (!confirm("Are you sure you want to reject this vendor? The request will go back to the pool.")) return;
    try {
      await api.post(`/pickup/reject/${bookingId}/`);
      toast.success("Vendor rejected. Searching for another...");
      loadBookings();
    } catch (err) {
      console.error("Reject Error:", err);
      toast.error(err.response?.data?.error || "Failed to reject vendor");
    }
  };

  const openVendorLocation = (booking) => {
    // Mock vendor location - In real app, this comes from backend
    const vendorLat = booking.vendor_latitude || 18.5204;
    const vendorLng = booking.vendor_longitude || 73.8567;

    window.open(
      `https://www.google.com/maps?q=${vendorLat},${vendorLng}`,
      "_blank",
    );
  };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [map, setMap] = React.useState(null);

  const onLoad = React.useCallback(
    function callback(map) {
      const bounds = new window.google.maps.LatLngBounds();
      if (selectedBooking) {
        bounds.extend({
          lat: selectedBooking.vendor_latitude || 18.5204,
          lng: selectedBooking.vendor_longitude || 73.8567,
        });
        map.fitBounds(bounds);
      }
      setMap(map);
    },
    [selectedBooking],
  );

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  const containerStyle = {
    width: "100%",
    height: "300px",
    borderRadius: "12px",
    marginTop: "16px",
  };

  const center = {
    lat: 18.5204,
    lng: 73.8567,
  };

  const renderLocationModal = () => {
    if (!selectedBooking) return null;

    const vendorInfo = {
      name: selectedBooking.vendor_name || "Vendor",
      phone: selectedBooking.vendor_phone || "+91 98765 43210",
      latitude: selectedBooking.vendor_latitude || 18.5204,
      longitude: selectedBooking.vendor_longitude || 73.8567,
      distance: "2.5 km away",
      eta: "12 minutes",
    };

    const mapCenter = {
      lat: vendorInfo.latitude,
      lng: vendorInfo.longitude,
    };

    return (
      <div
        className="location-modal-overlay"
        onClick={() => setSelectedBooking(null)}
      >
        <div className="location-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📍 Track Vendor Location</h2>
            <button
              className="modal-close"
              onClick={() => setSelectedBooking(null)}
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            {/* Booking Info */}
            <div className="modal-section">
              <h3>Booking Details</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-label">Booking ID:</span>
                  <span className="modal-value">{selectedBooking.id}</span>
                </div>
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
                  <span className="modal-label">Quantity:</span>
                  <span className="modal-value">
                    {selectedBooking.quantity} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Vendor Location */}
            <div className="modal-section">
              <h3>Vendor Information</h3>
              {["pending", "confirmed"].includes(selectedBooking.status) ? (
                <div className="vendor-pending">
                  <Clock
                    size={48}
                    style={{ color: "#fbbf24", marginBottom: "12px" }}
                  />
                  <p>Searching for nearby vendors...</p>
                  <small>Tracking will be available once a vendor is assigned.</small>
                </div>
              ) : selectedBooking.status === "vendor_accepted" ? (
                <div className="vendor-pending">
                  <User
                    size={48}
                    style={{ color: "#f59e0b", marginBottom: "12px" }}
                  />
                  <p>Vendor has accepted!</p>
                  <p>Please approve the vendor to schedule.</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
                    <button className="btn-primary" onClick={() => {
                      handleApproveVendor(selectedBooking.id);
                      setSelectedBooking(null);
                    }}>Approve</button>
                    <button className="btn-cancel" onClick={() => {
                      handleRejectVendor(selectedBooking.id);
                      setSelectedBooking(null);
                    }}>Reject</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="vendor-location-card">
                    <div className="vendor-icon">
                      <MapPin size={32} />
                    </div>
                    <div className="vendor-details">
                      <h4>{vendorInfo.name}</h4>
                      <p className="vendor-distance">{vendorInfo.distance}</p>
                      <p className="vendor-eta">⏱️ ETA: {vendorInfo.eta}</p>
                    </div>
                  </div>

                  {/* Google Map */}
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={mapCenter}
                      zoom={14}
                      onLoad={onLoad}
                      onUnmount={onUnmount}
                    >
                      <Marker position={mapCenter} />
                    </GoogleMap>
                  ) : (
                    <div>Loading Map...</div>
                  )}

                  {/* Action Buttons */}
                  <div className="modal-actions" style={{ marginTop: "16px" }}>
                    <button
                      className="btn-track-maps"
                      onClick={() => openVendorLocation(selectedBooking)}
                    >
                      <Navigation size={18} />
                      Open in Google Maps App
                    </button>
                    <button
                      className="btn-call-vendor"
                      onClick={() => window.open(`tel:${vendorInfo.phone}`)}
                    >
                      <Phone size={18} />
                      Call Vendor
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Your Pickup Location */}
            <div className="modal-section">
              <h3>Your Pickup Location</h3>
              <div className="pickup-location-card">
                <MapPin size={20} style={{ color: "#059669" }} />
                <div>
                  <p className="pickup-address">{selectedBooking.address}</p>
                  {selectedBooking.landmark && (
                    <p className="pickup-landmark">
                      Landmark: {selectedBooking.landmark}
                    </p>
                  )}
                  <p className="pickup-city">
                    {selectedBooking.city}, {selectedBooking.pincode}
                  </p>
                </div>
              </div>
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
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>💬 Chat with Vendor</h2>
            <button className="modal-close" onClick={() => setActiveChatPickupId(null)}>✕</button>
          </div>
          <div className="modal-body" style={{ padding: '0' }}>
            <ChatBox pickupId={activeChatPickupId} style={{ border: 'none', boxShadow: 'none', height: '500px' }} />
          </div>
        </div>
      </div>
    );
  };

  // Overview Tab
  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#dbeafe" }}>
            <Package size={28} style={{ color: "#3b82f6" }} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef3c7" }}>
            <Clock size={28} style={{ color: "#fbbf24" }} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingBookings}</h3>
            <p>Pending Pickups</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#d1fae5" }}>
            <CheckCircle size={28} style={{ color: "#10b981" }} />
          </div>
          <div className="stat-content">
            <h3>{stats.completedBookings}</h3>
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

      <div className="recent-bookings">
        <div className="section-header">
          <h2>Recent Bookings</h2>
          <button
            className="btn-view-all"
            onClick={() => setActiveTab("bookings")}
          >
            View All
          </button>
        </div>

        {bookings.slice(0, 3).map((booking) => (
          <div key={booking.id} className="booking-card">
            <div className="booking-header">
              <div className="booking-id">
                <Package size={16} />
                <span>#{booking.id}</span>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            <div className="booking-details">
              <div className="detail-row">
                <span className="label">Scrap Type:</span>
                <span className="value">{booking.scrap_type}</span>
              </div>
              <div className="detail-row">
                <span className="label">Quantity:</span>
                <span className="value">{booking.quantity} kg</span>
              </div>
              <div className="detail-row">
                <span className="label">Estimated Price:</span>
                <span className="value price">₹{booking.estimated_price}</span>
              </div>
              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">
                  {new Date(booking.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {bookings.length === 0 && (
          <div className="empty-state">
            <Package
              size={64}
              style={{ color: "#d1d5db", marginBottom: "20px" }}
            />
            <h3>No Bookings Yet</h3>
            <p>Start by booking your first scrap pickup!</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/book-pickup")}
            >
              Book Pickup Now
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Bookings Tab
  const renderBookings = () => (
    <div className="bookings-list">
      <div className="section-header">
        <h2>All Bookings</h2>
        <button
          className="btn-primary"
          onClick={() => navigate("/book-pickup")}
        >
          + New Booking
        </button>
      </div>

      <div className="bookings-grid">
        {bookings.map((booking) => (
          <div key={booking.id} className="booking-card-full">
            <div className="booking-card-header">
              <div>
                <h3>{booking.id}</h3>
                <p className="booking-date">
                  Booked on {new Date(booking.date).toLocaleDateString()}
                </p>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            <div className="booking-card-body">
              <div className="booking-info">
                <div className="info-item">
                  <Package size={18} />
                  <div>
                    <span className="label">Scrap Type</span>
                    <span className="value">{booking.scrap_type}</span>
                  </div>
                </div>

                <div className="info-item">
                  <TrendingUp size={18} />
                  <div>
                    <span className="label">Quantity</span>
                    <span className="value">{booking.quantity} kg</span>
                  </div>
                </div>

                <div className="info-item">
                  <DollarSign size={18} />
                  <div>
                    <span className="label">Estimated Price</span>
                    <span className="value">₹{booking.estimated_price}</span>
                  </div>
                </div>

                <div className="info-item">
                  <Calendar size={18} />
                  <div>
                    <span className="label">Pickup Date</span>
                    <span className="value">
                      {new Date(booking.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="info-item">
                  <MapPin size={18} />
                  <div>
                    <span className="label">Location</span>
                    <span className="value">{booking.city}</span>
                  </div>
                </div>
              </div>

              <div className="booking-actions">
                <button
                  className="btn-track"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <MapPin size={16} />
                  {["pending", "confirmed", "vendor_accepted"].includes(booking.status)
                    ? "View Details"
                    : "Track Vendor"}
                </button>

                {["pending", "confirmed"].includes(booking.status) && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    <XCircle size={16} />
                    Cancel
                  </button>
                )}

                {booking.status === "vendor_accepted" && (
                  <>
                    <button
                      className="btn-accept" // Reusing verify/accept style
                      style={{ background: '#dcfce7', color: '#166534' }}
                      onClick={() => handleApproveVendor(booking.id)}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => handleRejectVendor(booking.id)}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </>
                )}

                {/* Chat Button - only when vendor is accepted or scheduled */}
                {["vendor_accepted", "scheduled", "in_progress"].includes(booking.status) && (
                  <button
                    className="btn-chat"
                    onClick={() => setActiveChatPickupId(booking.id)}
                  >
                    <MessageCircle size={16} />
                    Chat
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {bookings.length === 0 && (
        <div className="empty-state">
          <Package
            size={64}
            style={{ color: "#d1d5db", marginBottom: "20px" }}
          />
          <h3>No Bookings Yet</h3>
          <p>Start by booking your first scrap pickup!</p>
          <button
            className="btn-primary"
            onClick={() => navigate("/book-pickup")}
          >
            Book Pickup Now
          </button>
        </div>
      )}
    </div>
  );

  // Profile Tab
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
            <span className="label">Phone:</span>
            <span className="value">{user?.phone || "Not provided"}</span>
          </div>
          <div className="detail-item">
            <span className="label">City:</span>
            <span className="value">{user?.city || "Not provided"}</span>
          </div>
          <div className="detail-item">
            <span className="label">Address:</span>
            <span className="value">{user?.address || "Not provided"}</span>
          </div>
          <div className="detail-item">
            <span className="label">Verified:</span>
            <span
              className="value"
              style={{ color: user?.isVerified ? "#10b981" : "#ef4444" }}
            >
              {user?.isVerified ? "✓ Verified" : "✗ Not Verified"}
            </span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn-secondary">
            <Edit size={16} />
            Edit Profile
          </button>
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm("Are you sure you want to logout?")) {
                logout();
                navigate("/");
              }
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1>📱 Dashboard</h1>
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
              className={`nav-item ${activeTab === "bookings" ? "active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              <Package size={20} />
              My Bookings
            </button>
            <button
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={20} />
              Profile
            </button>
          </nav>

          <div className="sidebar-footer">
            <button
              className="btn-new-booking"
              onClick={() => navigate("/book-pickup")}
            >
              + New Booking
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>
                {activeTab === "overview"
                  ? "Overview"
                  : activeTab === "bookings"
                    ? "My Bookings"
                    : "Profile"}
              </h1>
              <p>Manage your scrap pickups and track earnings</p>
            </div>
          </div>

          <div className="dashboard-content">
            {activeTab === "overview" && renderOverview()}
            {activeTab === "bookings" && renderBookings()}
            {activeTab === "profile" && renderProfile()}
          </div>
        </main>
      </div>
      {/* NEW: Location Tracking Modal */}
      {renderLocationModal()}
      {renderChatModal()}
    </div>
  );
};

export default ClientDashboard;
