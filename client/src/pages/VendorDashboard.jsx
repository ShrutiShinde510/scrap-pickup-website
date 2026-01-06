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
    History,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "./VendorDashboard.css";

const VendorDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Vendor's selected scrap types
    const [selectedScrapTypes, setSelectedScrapTypes] = useState([]);
    const [showScrapSelection, setShowScrapSelection] = useState(false);

    // Available scrap types
    const availableScrapTypes = [
        "Plastic",
        "Paper",
        "Metal",
        "Glass",
        "Electronic Waste",
        "Cardboard",
        "Textile",
        "Mixed Scrap"
    ];

    const [bookings, setBookings] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [bookingFilter, setBookingFilter] = useState("all");
    const [stats, setStats] = useState({
        totalAssigned: 0,
        pendingPickups: 0,
        completedPickups: 0,
        totalEarnings: 0,
    });
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [vendorLocation, setVendorLocation] = useState({
        latitude: 18.5204,
        longitude: 73.8567
    });

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        // Check if vendor has selected scrap types
        const savedScrapTypes = localStorage.getItem('vendorScrapTypes');
        if (savedScrapTypes) {
            setSelectedScrapTypes(JSON.parse(savedScrapTypes));
        } else {
            setShowScrapSelection(true);
        }

        loadBookings();
        getCurrentLocation();
    }, [user, navigate]);

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setVendorLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.log("Location access denied, using default location");
                }
            );
        }
    };

    const handleScrapTypeToggle = (type) => {
        setSelectedScrapTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const saveScrapTypes = () => {
        if (selectedScrapTypes.length === 0) {
            alert("Please select at least one scrap type");
            return;
        }
        localStorage.setItem('vendorScrapTypes', JSON.stringify(selectedScrapTypes));
        setShowScrapSelection(false);
        loadBookings();
    };

    const loadBookings = async () => {
        try {
            // Replace with actual API call
            // const res = await api.get("vendor/bookings/");
            // const vendorBookings = res.data;

            // Mock data - Remove this in production
            const mockBookings = [
                {
                    id: "BK001",
                    client_name: "Rajesh Kumar",
                    client_phone: "+91 98765 43210",
                    scrap_type: "Plastic",
                    quantity: 25,
                    estimated_price: 500,
                    date: new Date().toISOString(),
                    status: "assigned",
                    address: "123 MG Road, Koregaon Park",
                    landmark: "Near Osho Garden",
                    city: "Pune",
                    pincode: "411001",
                    client_latitude: 18.5362,
                    client_longitude: 73.8847
                },
                {
                    id: "BK002",
                    client_name: "Priya Sharma",
                    client_phone: "+91 87654 32109",
                    scrap_type: "Paper",
                    quantity: 15,
                    estimated_price: 300,
                    date: new Date().toISOString(),
                    status: "in_progress",
                    address: "456 FC Road, Shivaji Nagar",
                    landmark: "Opposite City Mall",
                    city: "Pune",
                    pincode: "411005",
                    client_latitude: 18.5304,
                    client_longitude: 73.8432
                },
                {
                    id: "BK003",
                    client_name: "Amit Patel",
                    client_phone: "+91 76543 21098",
                    scrap_type: "Metal",
                    quantity: 40,
                    estimated_price: 1200,
                    date: new Date(Date.now() - 86400000).toISOString(),
                    status: "completed",
                    address: "789 Baner Road, Baner",
                    landmark: "Near Baner Police Station",
                    city: "Pune",
                    pincode: "411045",
                    client_latitude: 18.5598,
                    client_longitude: 73.7752,
                    review: {
                        rating: 5,
                        comment: "Excellent service! Very professional and punctual."
                    }
                },
                {
                    id: "BK004",
                    client_name: "Sneha Desai",
                    client_phone: "+91 65432 10987",
                    scrap_type: "Plastic",
                    quantity: 30,
                    estimated_price: 600,
                    date: new Date(Date.now() - 172800000).toISOString(),
                    status: "completed",
                    address: "321 Aundh Road, Aundh",
                    landmark: "Near Aundh IT Park",
                    city: "Pune",
                    pincode: "411007",
                    client_latitude: 18.5579,
                    client_longitude: 73.8094,
                    review: {
                        rating: 4,
                        comment: "Good service, came on time."
                    }
                },
                {
                    id: "BK005",
                    client_name: "Vikram Singh",
                    client_phone: "+91 54321 09876",
                    scrap_type: "Paper",
                    quantity: 50,
                    estimated_price: 1000,
                    date: new Date(Date.now() - 259200000).toISOString(),
                    status: "completed",
                    address: "567 Hinjewadi Phase 1",
                    landmark: "Near Rajiv Gandhi Infotech Park",
                    city: "Pune",
                    pincode: "411057",
                    client_latitude: 18.5912,
                    client_longitude: 73.7389,
                    review: {
                        rating: 5,
                        comment: "Very satisfied with the service!"
                    }
                },
                {
                    id: "BK006",
                    client_name: "Meera Iyer",
                    client_phone: "+91 43210 98765",
                    scrap_type: "Metal",
                    quantity: 20,
                    estimated_price: 600,
                    date: new Date(Date.now() - 345600000).toISOString(),
                    status: "cancelled",
                    address: "890 Kothrud, Karve Road",
                    landmark: "Near Kothrud Depot",
                    city: "Pune",
                    pincode: "411038",
                    client_latitude: 18.5074,
                    client_longitude: 73.8077
                },
                {
                    id: "BK007",
                    client_name: "Arjun Reddy",
                    client_phone: "+91 32109 87654",
                    scrap_type: "Plastic",
                    quantity: 35,
                    estimated_price: 700,
                    date: new Date(Date.now() - 432000000).toISOString(),
                    status: "completed",
                    address: "234 Viman Nagar, Airport Road",
                    landmark: "Near Phoenix Market City",
                    city: "Pune",
                    pincode: "411014",
                    client_latitude: 18.5679,
                    client_longitude: 73.9143
                },
                {
                    id: "BK008",
                    client_name: "Kavita Joshi",
                    client_phone: "+91 21098 76543",
                    scrap_type: "Paper",
                    quantity: 45,
                    estimated_price: 900,
                    date: new Date(Date.now() - 518400000).toISOString(),
                    status: "completed",
                    address: "678 Hadapsar, Magarpatta Road",
                    landmark: "Near Magarpatta City",
                    city: "Pune",
                    pincode: "411028",
                    client_latitude: 18.5196,
                    client_longitude: 73.9346,
                    review: {
                        rating: 3,
                        comment: "Service was okay, could be better."
                    }
                }
            ];

            // Filter bookings based on vendor's selected scrap types
            const filteredBookings = mockBookings.filter(booking =>
                selectedScrapTypes.includes(booking.scrap_type)
            );

            setBookings(filteredBookings);
            setAllBookings(filteredBookings); // Store all bookings for history

            const stats = {
                totalAssigned: filteredBookings.length,
                pendingPickups: filteredBookings.filter(b => b.status === "assigned").length,
                completedPickups: filteredBookings.filter(b => b.status === "completed").length,
                totalEarnings: filteredBookings
                    .filter(b => b.status === "completed")
                    .reduce((sum, b) => sum + parseFloat(b.estimated_price || 0), 0),
            };
            setStats(stats);
        } catch (err) {
            console.error("Failed to load bookings:", err);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            assigned: { color: "#3b82f6", icon: Calendar, text: "Assigned" },
            in_progress: { color: "#8b5cf6", icon: TrendingUp, text: "In Progress" },
            completed: { color: "#10b981", icon: CheckCircle, text: "Completed" },
            cancelled: { color: "#ef4444", icon: XCircle, text: "Cancelled" },
        };

        const badge = badges[status] || badges.assigned;
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

    const handleAcceptBooking = async (bookingId) => {
        try {
            // Replace with actual API call
            // await api.post(`vendor/accept/${bookingId}/`);

            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: "in_progress" } : b
            ));
            loadBookings();
            alert("Booking accepted! Navigate to client location.");
        } catch (err) {
            console.error("Accept Error:", err);
            alert("Failed to accept booking");
        }
    };

    const handleCompleteBooking = async (bookingId) => {
        if (!confirm("Mark this booking as completed?")) return;

        try {
            // Replace with actual API call
            // await api.post(`vendor/complete/${bookingId}/`);

            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: "completed" } : b
            ));
            loadBookings();
            alert("Booking completed successfully!");
        } catch (err) {
            console.error("Complete Error:", err);
            alert("Failed to complete booking");
        }
    };

    const openClientLocation = (booking) => {
        const clientLat = booking.client_latitude;
        const clientLng = booking.client_longitude;
        window.open(
            `https://www.google.com/maps/dir/?api=1&origin=${vendorLocation.latitude},${vendorLocation.longitude}&destination=${clientLat},${clientLng}`,
            '_blank'
        );
    };

    const calculateDistance = (booking) => {
        const lat1 = vendorLocation.latitude;
        const lon1 = vendorLocation.longitude;
        const lat2 = booking.client_latitude;
        const lon2 = booking.client_longitude;

        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance.toFixed(1);
    };

    // Scrap Type Selection Modal
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
                                Select the types of scrap materials you want to collect. You'll only receive bookings for these selected types.
                            </p>

                            <div className="scrap-type-grid">
                                {availableScrapTypes.map(type => (
                                    <div
                                        key={type}
                                        className={`scrap-type-card ${selectedScrapTypes.includes(type) ? 'selected' : ''}`}
                                        onClick={() => handleScrapTypeToggle(type)}
                                    >
                                        <CheckSquare
                                            size={24}
                                            color={selectedScrapTypes.includes(type) ? "#059669" : "#d1d5db"}
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

    // Booking Details Modal
    const renderBookingModal = () => {
        if (!selectedBooking) return null;

        return (
            <div className="location-modal-overlay" onClick={() => setSelectedBooking(null)}>
                <div className="location-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>📍 Booking Details & Navigation</h2>
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
                            <h3>Booking Information</h3>
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
                                <div className="modal-info-item">
                                    <span className="modal-label">Price:</span>
                                    <span className="modal-value" style={{ color: "#059669" }}>₹{selectedBooking.estimated_price}</span>
                                </div>
                                <div className="modal-info-item">
                                    <span className="modal-label">Distance:</span>
                                    <span className="modal-value">{calculateDistance(selectedBooking)} km</span>
                                </div>
                            </div>
                        </div>

                        {/* Client Information */}
                        <div className="modal-section">
                            <h3>Client Information</h3>
                            <div className="vendor-location-card" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
                                <div className="vendor-icon">
                                    <User size={32} />
                                </div>
                                <div className="vendor-details">
                                    <h4>{selectedBooking.client_name}</h4>
                                    <p className="vendor-distance">{selectedBooking.client_phone}</p>
                                    <p className="vendor-eta">📧 Client contact details</p>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="btn-track-maps"
                                    onClick={() => openClientLocation(selectedBooking)}
                                >
                                    <Navigation size={18} />
                                    Navigate to Client
                                </button>
                                <button
                                    className="btn-call-vendor"
                                    onClick={() => window.open(`tel:${selectedBooking.client_phone}`)}
                                >
                                    <Phone size={18} />
                                    Call Client
                                </button>
                            </div>
                        </div>

                        {/* Pickup Location */}
                        <div className="modal-section">
                            <h3>Pickup Location</h3>
                            <div className="pickup-location-card">
                                <MapPin size={20} style={{ color: "#059669" }} />
                                <div>
                                    <p className="pickup-address">{selectedBooking.address}</p>
                                    {selectedBooking.landmark && <p className="pickup-landmark">Landmark: {selectedBooking.landmark}</p>}
                                    <p className="pickup-city">{selectedBooking.city}, {selectedBooking.pincode}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="modal-section">
                            {selectedBooking.status === 'assigned' && (
                                <button
                                    className="btn-accept-booking"
                                    onClick={() => {
                                        handleAcceptBooking(selectedBooking.id);
                                        setSelectedBooking(null);
                                    }}
                                >
                                    <CheckCircle size={18} />
                                    Accept & Start Pickup
                                </button>
                            )}

                            {selectedBooking.status === 'in_progress' && (
                                <button
                                    className="btn-complete-booking"
                                    onClick={() => {
                                        handleCompleteBooking(selectedBooking.id);
                                        setSelectedBooking(null);
                                    }}
                                >
                                    <CheckCircle size={18} />
                                    Mark as Completed
                                </button>
                            )}
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
                        <h3>{stats.totalAssigned}</h3>
                        <p>Total Assigned</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: "#fef3c7" }}>
                        <Clock size={28} style={{ color: "#fbbf24" }} />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.pendingPickups}</h3>
                        <p>Pending Pickups</p>
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

            {/* Selected Scrap Types */}
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
                    {selectedScrapTypes.map(type => (
                        <span key={type} className="scrap-chip">{type}</span>
                    ))}
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
                                <span className="label">Client:</span>
                                <span className="value">{booking.client_name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Scrap Type:</span>
                                <span className="value">{booking.scrap_type}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Quantity:</span>
                                <span className="value">{booking.quantity} kg</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Price:</span>
                                <span className="value price">₹{booking.estimated_price}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {bookings.length === 0 && (
                    <div className="empty-state">
                        <Package size={64} style={{ color: "#d1d5db", marginBottom: "20px" }} />
                        <h3>No Bookings Yet</h3>
                        <p>Bookings matching your scrap types will appear here</p>
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
            </div>

            <div className="bookings-grid">
                {bookings.map((booking) => (
                    <div key={booking.id} className="booking-card-full">
                        <div className="booking-card-header">
                            <div>
                                <h3>{booking.id}</h3>
                                <p className="booking-date">
                                    Client: {booking.client_name}
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
                                        <span className="label">Price</span>
                                        <span className="value">₹{booking.estimated_price}</span>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <MapPin size={18} />
                                    <div>
                                        <span className="label">Location</span>
                                        <span className="value">{booking.city}</span>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <Phone size={18} />
                                    <div>
                                        <span className="label">Contact</span>
                                        <span className="value">{booking.client_phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="booking-actions">
                                <button
                                    className="btn-track"
                                    onClick={() => setSelectedBooking(booking)}
                                >
                                    <MapPin size={16} />
                                    View Details
                                </button>

                                {booking.status === "assigned" && (
                                    <button
                                        className="btn-accept"
                                        onClick={() => handleAcceptBooking(booking.id)}
                                    >
                                        <CheckCircle size={16} />
                                        Accept
                                    </button>
                                )}

                                {booking.status === "in_progress" && (
                                    <button
                                        className="btn-complete"
                                        onClick={() => handleCompleteBooking(booking.id)}
                                    >
                                        <CheckCircle size={16} />
                                        Complete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {bookings.length === 0 && (
                <div className="empty-state">
                    <Package size={64} style={{ color: "#d1d5db", marginBottom: "20px" }} />
                    <h3>No Bookings Available</h3>
                    <p>Bookings matching your selected scrap types will appear here</p>
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

    // All Bookings Tab with Filters
    const renderAllBookings = () => {
        const getFilteredBookings = () => {
            switch (bookingFilter) {
                case "completed":
                    return allBookings.filter(b => b.status === "completed");
                case "reviewed":
                    return allBookings.filter(b => b.status === "completed" && b.review);
                case "pending":
                    return allBookings.filter(b => b.status === "assigned" || b.status === "in_progress");
                case "cancelled":
                    return allBookings.filter(b => b.status === "cancelled");
                default:
                    return allBookings;
            }
        };

        const filteredBookings = getFilteredBookings();
        const completedCount = allBookings.filter(b => b.status === "completed").length;
        const reviewedCount = allBookings.filter(b => b.status === "completed" && b.review).length;
        const pendingCount = allBookings.filter(b => b.status === "assigned" || b.status === "in_progress").length;
        const cancelledCount = allBookings.filter(b => b.status === "cancelled").length;

        return (
            <div className="all-bookings-section">
                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${bookingFilter === "all" ? "active" : ""}`}
                        onClick={() => setBookingFilter("all")}
                    >
                        <History size={18} />
                        All Bookings
                        <span className="filter-count">{allBookings.length}</span>
                    </button>
                    <button
                        className={`filter-tab ${bookingFilter === "completed" ? "active" : ""}`}
                        onClick={() => setBookingFilter("completed")}
                    >
                        <CheckCircle size={18} />
                        Completed
                        <span className="filter-count">{completedCount}</span>
                    </button>
                    <button
                        className={`filter-tab ${bookingFilter === "reviewed" ? "active" : ""}`}
                        onClick={() => setBookingFilter("reviewed")}
                    >
                        <Star size={18} />
                        Reviewed
                        <span className="filter-count">{reviewedCount}</span>
                    </button>
                    <button
                        className={`filter-tab ${bookingFilter === "pending" ? "active" : ""}`}
                        onClick={() => setBookingFilter("pending")}
                    >
                        <Clock size={18} />
                        Pending
                        <span className="filter-count">{pendingCount}</span>
                    </button>
                    <button
                        className={`filter-tab ${bookingFilter === "cancelled" ? "active" : ""}`}
                        onClick={() => setBookingFilter("cancelled")}
                    >
                        <XCircle size={18} />
                        Cancelled
                        <span className="filter-count">{cancelledCount}</span>
                    </button>
                </div>

                {/* Bookings List */}
                <div className="bookings-history-grid">
                    {filteredBookings.map((booking) => (
                        <div key={booking.id} className="booking-history-card">
                            <div className="booking-card-header">
                                <div>
                                    <h3>{booking.id}</h3>
                                    <p className="booking-date">
                                        {new Date(booking.date).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                {getStatusBadge(booking.status)}
                            </div>

                            <div className="booking-card-body">
                                <div className="booking-info">
                                    <div className="info-item">
                                        <User size={18} />
                                        <div>
                                            <span className="label">Client</span>
                                            <span className="value">{booking.client_name}</span>
                                        </div>
                                    </div>

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
                                            <span className="label">Price</span>
                                            <span className="value" style={{ color: "#059669", fontWeight: "700" }}>₹{booking.estimated_price}</span>
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

                                {/* Review Section */}
                                {booking.review && (
                                    <div className="booking-review">
                                        <div className="review-header">
                                            <Star size={16} style={{ color: "#fbbf24", fill: "#fbbf24" }} />
                                            <span className="review-rating">
                                                {booking.review.rating}/5
                                            </span>
                                        </div>
                                        <p className="review-comment">"{booking.review.comment}"</p>
                                    </div>
                                )}

                                <div className="booking-actions">
                                    <button
                                        className="btn-track"
                                        onClick={() => setSelectedBooking(booking)}
                                    >
                                        <MapPin size={16} />
                                        View Details
                                    </button>

                                    {booking.status === "assigned" && (
                                        <button
                                            className="btn-accept"
                                            onClick={() => handleAcceptBooking(booking.id)}
                                        >
                                            <CheckCircle size={16} />
                                            Accept
                                        </button>
                                    )}

                                    {booking.status === "in_progress" && (
                                        <button
                                            className="btn-complete"
                                            onClick={() => handleCompleteBooking(booking.id)}
                                        >
                                            <CheckCircle size={16} />
                                            Complete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredBookings.length === 0 && (
                    <div className="empty-state">
                        <Filter size={64} style={{ color: "#d1d5db", marginBottom: "20px" }} />
                        <h3>No Bookings Found</h3>
                        <p>No bookings match the selected filter</p>
                    </div>
                )}
            </div>
        );
    };

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
                            className={`nav-item ${activeTab === "bookings" ? "active" : ""}`}
                            onClick={() => setActiveTab("bookings")}
                        >
                            <Package size={20} />
                            My Pickups
                        </button>
                        <button
                            className={`nav-item ${activeTab === "allBookings" ? "active" : ""}`}
                            onClick={() => setActiveTab("allBookings")}
                        >
                            <History size={20} />
                            All Bookings
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
                                {activeTab === "overview"
                                    ? "Dashboard Overview"
                                    : activeTab === "bookings"
                                        ? "My Pickups"
                                        : activeTab === "allBookings"
                                            ? "All Bookings"
                                            : "Profile"}
                            </h1>
                            <p>Manage your scrap pickups and track earnings</p>
                        </div>
                    </div>

                    <div className="dashboard-content">
                        {activeTab === "overview" && renderOverview()}
                        {activeTab === "bookings" && renderBookings()}
                        {activeTab === "allBookings" && renderAllBookings()}
                        {activeTab === "profile" && renderProfile()}
                    </div>
                </main>
            </div>

            {renderScrapSelectionModal()}
            {renderBookingModal()}
        </div>
    );
};

export default VendorDashboard;