import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithEmailAndPassword, loginWithGoogle } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { saveUserData } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginWithEmailAndPassword(email, password);

      if (result.success) {
        // Save user data to context
        saveUserData(result.user);
        // Email/password users already have complete profiles
        navigate('/membership-request');
      } else {
        // Handle error - use custom message if provided, otherwise lookup error code
        const errorMessage = result.message || getErrorMessage(result.error);
        setError(errorMessage);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await loginWithGoogle();

      if (result.success) {
        saveUserData(result.user);
        
        // Check if user needs to complete additional information
        if (result.needsAdditionalInfo || !result.user.profileComplete) {
          // New user or incomplete profile - redirect to form
          navigate('/form');
        } else {
          // Existing user with complete profile - redirect to dashboard/membership
          navigate('/membership-request');
        }
      } else {
        const errorMessage = getErrorMessage(result.error);
        setError(errorMessage);
      }
    } catch (err) {
      setError('Google login failed. Please try again.');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'email-not-verified': 'Please verify your email before logging in. Check your inbox for the verification link.',
    };
    return errorMessages[errorCode] || 'Login failed. Please try again.';
  };

  return (
    <div className="login-page">
      <div className="login-panel" role="region" aria-label="Login panel">
        <div className="login-header">
          <h1 className="login-title">Login</h1>
          <p className="login-subtitle">Access your account</p>
        </div>

        {error && (
          <div className="login-alert" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-field">
            <label htmlFor="email" className="field-label">Email address</label>
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
            />
          </div>

          <div className="form-field">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="text-input"
              disabled={loading}
              name="password"
              autoComplete="current-password"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="field-row">
            <label htmlFor="password" className="field-label">Password</label>
            <Link to="/forgot" className="aux-link">Trouble logging in?</Link>
          </div>

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="or-separator" aria-hidden="true">
          <span>or</span>
        </div>

        <div className="oauth-row">
          <button
            onClick={handleGoogleLogin}
            className="oauth-btn"
            disabled={loading}
            aria-label="Continue with Google"
          >
            <svg className="oauth-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="oauth-text">Google</span>
          </button>
        </div>

        <div className="signup-cta">
          <Link to="/register" className="outline-btn">Sign Up</Link>
        </div>

        <p className="legal-disclaimer">
          By continuing you agree our <Link to="/terms" className="legal-link">Terms &amp; Conditions</Link> and <Link to="/privacy" className="legal-link">Privacy Policy</Link> and to subscribe to emails for offers, alerts and services.
        </p>
      </div>
    </div>
  );
};

export default Login;