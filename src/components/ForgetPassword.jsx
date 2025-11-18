import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgetPassword.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.party.one';

const ForgetPassword = () => {
  const navigate = useNavigate();
  
  // Step management: 'email' | 'otp' | 'reset' | 'success'
  const [step, setStep] = useState('email');
  
  // Form state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP input refs for auto-focus
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Auto-focus first OTP input when entering OTP step
  useEffect(() => {
    if (step === 'otp' && otpRefs[0].current) {
      otpRefs[0].current.focus();
    }
  }, [step]);

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/v1/sendForgetPassewordOtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(data.message || 'OTP sent successfully to your email!');
        setStep('otp');
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setError('Please enter a complete 4-digit OTP.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/v1/VerifyEmailOtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otp: otpValue 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(data.message || 'OTP verified successfully!');
        setStep('reset');
      } else {
        setError(data.message || 'Invalid OTP. Please check and try again.');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/v1/updatePassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password: newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Password updated successfully!');
        setStep('success');
      } else {
        setError(data.message || 'Failed to update password. Please try again.');
      }
    } catch (err) {
      console.error('Update password error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change with auto-advance
  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{4}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      otpRefs[3].current?.focus();
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtp(['', '', '', '']);
    setError('');
    setSuccessMessage('');
    await handleSendOtp({ preventDefault: () => {} });
  };

  // Render Email Step
  const renderEmailStep = () => (
    <>
      <div className="forgot-header">
        <h1 className="forgot-title">Forgot Password</h1>
        <p className="forgot-subtitle">
          Enter your email address and we'll send you a verification code to reset your password.
        </p>
      </div>

      <div className="step-indicator">
        <div className="step-dot active"></div>
        <div className="step-dot"></div>
        <div className="step-dot"></div>
      </div>

      {error && (
        <div className="forgot-alert error" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="forgot-alert success" role="alert">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSendOtp} className="forgot-form" noValidate>
        <div className="form-field">
          <label htmlFor="email" className="field-label">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="text-input"
            disabled={loading}
            name="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="primary-btn"
          disabled={loading || !email}
        >
          {loading ? 'Sending OTP…' : 'Send Verification Code'}
        </button>
      </form>

      <Link to="/" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Login
      </Link>
    </>
  );

  // Render OTP Verification Step
  const renderOtpStep = () => (
    <>
      <div className="forgot-header">
        <h1 className="forgot-title">Enter Verification Code</h1>
        <p className="forgot-subtitle">
          We've sent a 4-digit code to <strong>{email}</strong>. Please enter it below.
        </p>
      </div>

      <div className="step-indicator">
        <div className="step-dot"></div>
        <div className="step-dot active"></div>
        <div className="step-dot"></div>
      </div>

      {error && (
        <div className="forgot-alert error" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="forgot-alert success" role="alert">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleVerifyOtp} className="forgot-form" noValidate>
        <div className="otp-container" onPaste={handleOtpPaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={otpRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              className="otp-input"
              disabled={loading}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="submit"
          className="primary-btn"
          disabled={loading || otp.join('').length !== 4}
        >
          {loading ? 'Verifying…' : 'Verify Code'}
        </button>
      </form>

      <div className="secondary-action">
        Didn't receive the code?{' '}
        <button onClick={handleResendOtp} disabled={loading} type="button">
          Resend OTP
        </button>
      </div>

      <Link to="/" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Login
      </Link>
    </>
  );

  // Render Password Reset Step
  const renderResetStep = () => (
    <>
      <div className="forgot-header">
        <h1 className="forgot-title">Reset Password</h1>
        <p className="forgot-subtitle">
          Create a new password for your account. Make sure it's strong and secure.
        </p>
      </div>

      <div className="step-indicator">
        <div className="step-dot"></div>
        <div className="step-dot"></div>
        <div className="step-dot active"></div>
      </div>

      {error && (
        <div className="forgot-alert error" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="forgot-alert success" role="alert">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleResetPassword} className="forgot-form" noValidate>
        <div className="form-field">
          <label htmlFor="newPassword" className="field-label">New Password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
            className="text-input"
            disabled={loading}
            name="new-password"
            autoComplete="new-password"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            minLength={6}
            autoFocus
          />
        </div>

        <div className="form-field">
          <label htmlFor="confirmPassword" className="field-label">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-type new password"
            required
            className="text-input"
            disabled={loading}
            name="confirm-password"
            autoComplete="new-password"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          className="primary-btn"
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? 'Updating Password…' : 'Reset Password'}
        </button>
      </form>

      <Link to="/" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Login
      </Link>
    </>
  );

  // Render Success Step
  const renderSuccessStep = () => (
    <>
      <div className="success-icon">
        <svg viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="success-message">
        <h2>Password Reset Successful!</h2>
        <p>
          Your password has been successfully updated. You can now log in with your new password.
        </p>
        
        <button
          onClick={() => navigate('/')}
          className="primary-btn"
        >
          Go to Login
        </button>
      </div>
    </>
  );

  return (
    <div className="forgot-page">
      <div className="forgot-panel" role="region" aria-label="Forgot password panel">
        {step === 'email' && renderEmailStep()}
        {step === 'otp' && renderOtpStep()}
        {step === 'reset' && renderResetStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
};

export default ForgetPassword;