import React, { useState, useEffect } from 'react';
import { useNavigate ,useLocation } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './VerifyEmailPage.css';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const redirectTo = location.state?.redirectTo || '/';

  useEffect(() => {
    const pendingEmail = localStorage.getItem('pendingVerification');
    if (!pendingEmail) {
      navigate('/signup');
      return;
    }
    setEmail(pendingEmail);

    // Timer for resend button
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

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

    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email);

      if (user && user.verificationCode === code) {
        // Mark user as verified
        user.isVerified = true;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.removeItem('pendingVerification');

        // Auto login
        const userData = {
          id: user.id,
          name: user.fullName,
          email: user.email,
          isVerified: true,
          token: 'token_' + Date.now()
        };

        login(userData);
        alert('Email verified successfully! Welcome to EcoScrap.');
        navigate(redirectTo, { replace: true });
      } else {
        setError('Invalid verification code. Please try again.');
        setVerificationCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
      setIsLoading(false);
    }, 1500);
  };

  const handleResendCode = () => {
    if (!canResend) return;

    // Generate new code
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);
    
    if (user) {
      user.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('users', JSON.stringify(users));
      alert(`New verification code sent: ${user.verificationCode} (Check console for demo)`);
      console.log('New verification code:', user.verificationCode);
    }

    setCanResend(false);
    setResendTimer(60);
    
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Show verification code in console for demo
  useEffect(() => {
    if (email) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email);
      if (user) {
        console.log('='.repeat(50));
        console.log('DEMO MODE - Verification Code:', user.verificationCode);
        console.log('='.repeat(50));
      }
    }
  }, [email]);

  return (
    <div className="verify-page">
      <div className="verify-container">
        <div className="verify-icon-wrapper">
          <Mail size={60} className="verify-icon" />
        </div>

        <h1 className="verify-title">Verify Your Email</h1>
        <p className="verify-subtitle">
          We've sent a 6-digit verification code to<br/>
          <strong>{email}</strong>
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
              Verify Email
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

        <button onClick={() => navigate('/signup')} className="btn-back-signup">
          ← Back to Sign Up
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailPage;