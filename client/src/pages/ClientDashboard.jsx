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
  Trash2,
  Edit,
  Eye,
  Navigation,
  Phone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
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

  useEffect(() => {
    if (!user) {
      navigate("/login");
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
      assigned: { color: "#3b82f6", icon: Calendar, text: "Assigned" },
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
      alert("Booking cancelled successfully");
    } catch (err) {
      console.error("Cancel Error:", err);
      alert("Failed to cancel booking");
    }
  };


  // NEW: Open Google Maps with vendor location
  const openVendorLocation = (booking) => {
    // Mock vendor location - In real app, this comes from backend
    const vendorLat = booking.vendor_latitude || 18.5204;
    const vendorLng = booking.vendor_longitude || 73.8567;

    window.open(`https://www.google.com/maps?q=${vendorLat},${vendorLng}`, '_blank');
  };

  // NEW: Render Location Tracking Modal
  const renderLocationModal = () => {
    if (!selectedBooking) return null;

    const vendorInfo = {
      name: selectedBooking.vendor_name || "Vendor",
      phone: selectedBooking.vendor_phone || "+91 98765 43210",
      latitude: selectedBooking.vendor_latitude || 18.5204,
      longitude: selectedBooking.vendor_longitude || 73.8567,
      distance: "2.5 km away",
      eta: "12 minutes"
    };

    return (
      <div className="location-modal-overlay" onClick={() => setSelectedBooking(null)}>
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
                  <span className="modal-value">{getStatusBadge(selectedBooking.status)}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">Scrap Type:</span>
                  <span className="modal-value">{selectedBooking.scrap_type}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">Quantity:</span>
                  <span className="modal-value">{selectedBooking.quantity} kg</span>
                </div>
              </div>
            </div>

            {/* Vendor Location */}
            <div className="modal-section">
              <h3>Vendor Information</h3>
              {selectedBooking.status === 'pending' ? (
                <div className="vendor-pending">
                  <Clock size={48} style={{ color: '#fbbf24', marginBottom: '12px' }} />
                  <p>Vendor not assigned yet</p>
                  <small>You'll be able to track vendor once assigned</small>
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
                      <p className="vendor-coords">
                        📍 {vendorInfo.latitude.toFixed(4)}°, {vendorInfo.longitude.toFixed(4)}°
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="modal-actions">
                    <button
                      className="btn-track-maps"
                      onClick={() => openVendorLocation(selectedBooking)}
                    >
                      <Navigation size={18} />
                      Open in Google Maps
                    </button>
                    <button
                      className="btn-call-vendor"
                      onClick={() => window.open(`tel:${vendorInfo.phone}`)}
                    >
                      <Phone size={18} />
                      Call Vendor
                    </button>
                  </div>

                  {/* Live Tracking Info */}
                  {selectedBooking.status === 'in_progress' && (
                    <div className="tracking-active">
                      <div className="tracking-pulse"></div>
                      <p>🔴 Live tracking active</p>
                      <small>Vendor is on the way to your location</small>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Your Pickup Location */}
            <div className="modal-section">
              <h3>Your Pickup Location</h3>
              <div className="pickup-location-card">
                <MapPin size={20} style={{ color: '#059669' }} />
                <div>
                  <p className="pickup-address">{selectedBooking.address}</p>
                  {selectedBooking.landmark && <p className="pickup-landmark">Landmark: {selectedBooking.landmark}</p>}
                  <p className="pickup-city">{selectedBooking.city}, {selectedBooking.pincode}</p>
                </div>
              </div>
            </div>
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
                <span>{booking.id}</span>
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
                  {booking.status === 'pending' ? 'View Details' : 'Track Vendor'}
                </button>




                {booking.status === "pending" && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    <XCircle size={16} />
                    Cancel
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
    </div>
  );
};

export default ClientDashboard;

