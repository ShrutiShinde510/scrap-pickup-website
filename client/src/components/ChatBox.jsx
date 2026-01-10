import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './ChatBox.css';

const ChatBox = ({ pickupId, className }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [error, setError] = useState(null);

    const [showOfferInput, setShowOfferInput] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');

    // Poll for new messages every 5 seconds
    useEffect(() => {
        let interval;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`pickup/chat/${pickupId}/`);
                setMessages(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch messages", err);
                // Only show error if it's the first load
                if (loading) setError("Could not load chat history.");
            } finally {
                setLoading(false);
            }
        };

        if (pickupId) {
            fetchMessages(); // Initial fetch
            interval = setInterval(fetchMessages, 5000); // Polling
        }

        return () => clearInterval(interval);
    }, [pickupId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await api.post(`pickup/chat/${pickupId}/`, {
                message: newMessage
            });
            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
        } catch (err) {
            console.error("Failed to send message", err);
            alert("Failed to send message over the network.");
        }
    };

    const handleSendOffer = async () => {
        if (!offerAmount || isNaN(offerAmount)) {
            alert("Please enter a valid amount");
            return;
        }

        try {
            const response = await api.post(`pickup/chat/${pickupId}/`, {
                message: `Offer: ₹${offerAmount}`,
                is_offer: true,
                offer_amount: offerAmount
            });
            setMessages(prev => [...prev, response.data]);
            setOfferAmount('');
            setShowOfferInput(false);
        } catch (err) {
            console.error("Failed to send offer", err);
            alert("Failed to send offer. " + (err.response?.data?.error || ""));
        }
    };

    const handleAcceptOffer = async (msgId) => {
        try {
            const response = await api.post(`pickup/offer/${msgId}/accept/`);
            alert(response.data.message);
            // Refresh messages to show updated status
            const res = await api.get(`pickup/chat/${pickupId}/`);
            setMessages(res.data);
        } catch (err) {
            console.error("Accept failed", err);
            alert("Failed to accept offer. " + (err.response?.data?.error || ""));
        }
    };

    const handleRejectOffer = async (msgId) => {
        try {
            const response = await api.post(`pickup/offer/${msgId}/reject/`);
            alert(response.data.message);
            // Refresh messages to show updated status
            const res = await api.get(`pickup/chat/${pickupId}/`);
            setMessages(res.data);
        } catch (err) {
            console.error("Reject failed", err);
            alert("Failed to reject offer. " + (err.response?.data?.error || ""));
        }
    };

    if (!pickupId) return null;

    return (
        <div className={`chat-box ${className || ''}`}>
            <div className="chat-header">
                <h4>Request Update Chat</h4>
                {/* Simple live indicator */}
                <span style={{ fontSize: '0.8rem', color: '#28a745' }}>● Live</span>
            </div>

            <div className="chat-messages">
                {loading && <div style={{ textAlign: 'center', color: '#888' }}>Loading chat...</div>}
                {error && <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>}

                {!loading && messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '2rem' }}>
                        No messages yet. Start the conversation!
                    </div>
                )}

                {messages.map((msg) => {
                    const isMine = msg.sender === user?.id || msg.sender_email === user?.email;
                    return (
                        <div key={msg.id} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                            {!isMine && (
                                <div className="message-header">
                                    {msg.sender_name || 'Vendor'}
                                </div>
                            )}
                            <div className={`message-bubble ${msg.is_offer ? 'offer-bubble' : ''}`}>
                                <div className="message-text">{msg.message}</div>
                                {msg.is_offer && (
                                    <div className="offer-action-area">
                                        <div className={`offer-status status-${msg.offer_status}`}>
                                            Status: {msg.offer_status.toUpperCase()}
                                        </div>

                                        {!isMine && msg.offer_status === 'pending' && (
                                            <div className="offer-buttons">
                                                <button className="btn-accept" onClick={() => handleAcceptOffer(msg.id)}>Accept</button>
                                                <button className="btn-reject" onClick={() => handleRejectOffer(msg.id)}>Reject</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="message-time">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-footer">
                {showOfferInput ? (
                    <div className="offer-input-wrapper">
                        <input
                            type="number"
                            placeholder="Entr Amount (₹)"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            className="offer-input"
                        />
                        <button type="button" className="btn-send-offer" onClick={handleSendOffer}>Send Offer</button>
                        <button type="button" className="btn-cancel-offer" onClick={() => setShowOfferInput(false)}>✕</button>
                    </div>
                ) : (
                    <button type="button" className="btn-toggle-offer" onClick={() => setShowOfferInput(true)}>
                        Make Offer
                    </button>
                )}

                <form className="chat-input-area" onSubmit={handleSend} style={{ display: showOfferInput ? 'none' : 'flex' }}>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" disabled={!newMessage.trim()}>
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBox;
