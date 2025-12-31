import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; // Use configured API
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import './LoginPage.css'; // Has the new OTP styles
import { useNavigate, useLocation } from 'react-router-dom';

const OTPPage = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const stateEmail = location.state?.email;
    const statePassword = location.state?.password;

    const [contact, setContact] = useState(stateEmail || user?.email || '');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState(1); // 1: Send, 2: Verify
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Auto-focus logic or initial setup could go here
    }, []);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await api.post('/otp/send/', {
                contact,
                channel: contact.includes('@') ? 'email' : 'sms'
            });

            setMessage(`OTP Sent to ${contact}`);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        const otp = otpDigits.join('');
        if (otp.length < 6) {
            setError('Please enter complete 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            await api.post('/otp/verify/', {
                contact,
                otp
            });

            setMessage("OTP Verified!");

            // 2. Perform Login if password exists
            if (statePassword && stateEmail) {
                setMessage("OTP Verified! Logging in...");
                const loginResult = await login(stateEmail, statePassword);
                if (loginResult.success) {
                    navigate('/');
                } else {
                    setError("OTP OK, but Login Failed: " + (loginResult.error || "Invalid Credentials"));
                }
            } else if (user) {
                // Already logged in context
                navigate('/');
            } else {
                setError("Session validation failed. Please login again.");
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || "Invalid OTP");
            setOtpDigits(['', '', '', '', '', '']); // Clear on error
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otpDigits];
        newOtp[index] = value;
        setOtpDigits(newOtp);

        // Auto focus next
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container" style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="auth-form-container" style={{ width: '100%', padding: '2rem' }}>

                    {step === 1 ? (
                        <>
                            <div className="auth-header">
                                <h2>OTP Verification</h2>
                                <p>Verify your identity to continue</p>
                            </div>

                            {error && <div className="error-message"><span>⚠️</span> {error}</div>}

                            <form onSubmit={handleSendOTP} className="auth-form">
                                <div className="input-group">
                                    <label>Contact (Email or Phone)</label>
                                    <input
                                        type="text"
                                        className="form-input" // Use global CSS class if available or simple style
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        placeholder="Enter Email or Phone"
                                        disabled={loading}
                                    />
                                </div>
                                <button type="submit" className="btn-submit" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="otp-section">
                            <h3>Enter Verification Code</h3>
                            <p>We've sent a code to <strong>{contact}</strong></p>

                            {message && (
                                <div style={{ color: 'green', marginBottom: '1rem', background: '#d4edda', padding: '0.5rem', borderRadius: '4px' }}>
                                    <CheckCircle size={16} style={{ display: 'inline', marginRight: '5px' }} /> {message}
                                </div>
                            )}
                            {error && (
                                <div className="error-message">
                                    <AlertCircle size={16} style={{ display: 'inline', marginRight: '5px' }} /> {error}
                                </div>
                            )}

                            <div className="code-input-group">
                                {otpDigits.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="code-input"
                                        disabled={loading}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                className="btn-verify"
                                onClick={handleVerifyOTP}
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>

                            <button
                                type="button"
                                className="auth-link"
                                onClick={() => { setStep(1); setMessage(''); setError(''); setOtpDigits(['', '', '', '', '', '']); }}
                                style={{ marginTop: '10px', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                ← Change Contact / Resend
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OTPPage;
