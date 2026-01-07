import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './VerifyEmailPage.css';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, isAuthenticated } = useAuth();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // If redirected from somewhere, go back there after verification
  const redirectTo = location.state?.redirectTo || '/';

  useEffect(() => {
    console.log("VerifyEmailPage: Mounted. State:", { isAuthenticated, isPhoneVerified: user?.is_phone_verified, otpSent });
    if (!isAuthenticated) {
      console.log("VerifyEmailPage: Not authenticated, redirecting to /login");
      navigate('/login');
      return;
    }

    if (user?.is_phone_verified) {
      console.log("VerifyEmailPage: Already verified, redirecting to", redirectTo);
      navigate(redirectTo);
    }
  }, [isAuthenticated, user, navigate, redirectTo]);

  // Initial OTP Send
  useEffect(() => {
    if (isAuthenticated && !otpSent && !user?.is_phone_verified) {
      console.log("VerifyEmailPage: Triggering sendOtp...");
      sendOtp();
    }
  }, [isAuthenticated, otpSent, user]);

  const sendOtp = async () => {
    try {
      console.log("VerifyEmailPage: Sending OTP to", user?.phone_number);
      // Assuming the backend sends OTP to the user's registered phone
      // We need to pass 'contact' to the endpoint. 
      // Since we are logged in, we can use user.phone_number
      if (!user?.phone_number) {
        console.error("VerifyEmailPage: User phone number missing");
        setError("User phone number not found.");
        return;
      }

      await api.post('otp/send/', { contact: user.phone_number, channel: 'sms' });
      setOtpSent(true);
      console.log("OTP Sent to", user.phone_number);
    } catch (err) {
      console.error("Failed to send OTP", err);
      setError("Failed to send OTP. Please try resending.");
    }
  };

  // Timer logic
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);


  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');

    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('account/verify/', { otp: code });

      // Success
      const updatedUser = res.data.user;
      updateUser(updatedUser);

      toast.success('Account verified successfully!');
      navigate(redirectTo, { replace: true });

    } catch (err) {
      console.error("Verification Error", err);
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
      setVerificationCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(60);
    setError('');

    await sendOtp();
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        <div className="verify-icon-wrapper">
          <Mail size={60} className="verify-icon" />
        </div>

        <h1 className="verify-title">Verify Your Phone</h1>
        <p className="verify-subtitle">
          We've sent a 6-digit verification code to your phone number ending in<br />
          <strong>...{user?.phone_number?.slice(-4)}</strong>
        </p>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="code-input-group">
          {verificationCode.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="code-input"
              disabled={isLoading}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          className="btn-verify"
          disabled={isLoading || verificationCode.join('').length !== 6}
        >
          {isLoading ? (
            <>
              <div className="spinner-small"></div>
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Verify
            </>
          )}
        </button>

        <div className="verify-footer">
          <p>Didn't receive the code?</p>
          <button
            onClick={handleResendCode}
            className="btn-resend"
            disabled={!canResend}
          >
            {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;