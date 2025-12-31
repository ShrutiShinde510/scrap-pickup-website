import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Mail, Phone, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import './LoginPage.css';
import { useNavigate, useLocation } from 'react-router-dom';

const OTPPage = () => {
    const { login, user } = useAuth(); // We need login function
    const navigate = useNavigate();
    const location = useLocation();

    const stateEmail = location.state?.email;
    const statePassword = location.state?.password;

    const [contact, setContact] = useState(stateEmail || user?.email || '');
    const [otp, setOtp] = useState('');
    const [channel, setChannel] = useState(contact.includes('@') ? 'email' : 'sms');
    const [step, setStep] = useState(1); // 1: Send, 2: Verify
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');



    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/otp/send/", {
                contact,
                channel: contact.includes('@') ? 'email' : 'sms'
            });

            if (response.status === 200) {
                setMessage(`OTP Sent to ${contact}`);
                setStep(2);

            }
        } catch (err) {
            setError(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/otp/verify/", {
                contact,
                otp
            });

            if (response.status === 200) {
                setMessage("OTP Verified!");

                // 2. Now perform Login using the stored password
                if (statePassword && stateEmail) {
                    setMessage("OTP Verified! Logging in...");
                    const loginResult = await login(stateEmail, statePassword);
                    if (loginResult.success) {
                        navigate('/');
                    } else {
                        setError("OTP OK, but Login Failed: " + (loginResult.error || "Invalid Credentials"));
                    }
                } else if (user) {
                } else {
                    setError("Session validation failed. Please login again.");
                    setTimeout(() => navigate('/login'), 2000);
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container" style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                <div className="auth-form-container" style={{ width: '100%', padding: '2rem' }}>
                    <div className="auth-header">
                        <h2>OTP Verification</h2>
                        <p>Verify your identity via Email or SMS</p>
                    </div>

                    {message && (
                        <div className="success-message" style={{ color: 'green', marginBottom: '1rem', padding: '0.5rem', background: '#d4edda', borderRadius: '4px' }}>
                            <CheckCircle size={16} style={{ display: 'inline', marginRight: '5px' }} /> {message}
                        </div>
                    )}
                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} style={{ display: 'inline', marginRight: '5px' }} /> {error}
                        </div>
                    )}

                    <form onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP} className="auth-form">

                        <div className="input-group">
                            <label>Contact (Email or Phone)</label>
                            <div className="input-wrapper">
                                {contact.includes('@') ? <Mail size={20} className="input-icon" /> : <Phone size={20} className="input-icon" />}
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="Enter Email or Phone"
                                    disabled={step === 2 || loading}
                                />
                            </div>
                        </div>

                        {step === 2 && (
                            <div className="input-group">
                                <label>Enter OTP</label>
                                <div className="input-wrapper">
                                    <Lock size={20} className="input-icon" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="6-digit OTP"
                                        maxLength={6}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Processing...' : (step === 1 ? 'Send OTP' : 'Verify OTP')}
                        </button>

                        {step === 2 && (
                            <button
                                type="button"
                                className="auth-link"
                                onClick={() => { setStep(1); setMessage(''); setError(''); setOtp('') }}
                                style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                            >
                                Change Contact / Resend
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OTPPage;
