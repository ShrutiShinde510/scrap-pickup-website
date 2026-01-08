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
            // Optimistically add message or wait for poll? 
            // Let's just append the response which is the created message
            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
        } catch (err) {
            console.error("Failed to send message", err);
            alert("Failed to send message over the network.");
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
                            <div className="message-bubble">
                                <div className="message-text">{msg.message}</div>
                            </div>
                            <div className="message-time">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
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
    );
};

export default ChatBox;
