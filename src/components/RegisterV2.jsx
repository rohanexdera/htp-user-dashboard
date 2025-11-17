import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerWithEmailAndPassword, loginWithGoogle } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://party-one-developer.uc.r.appspot.com';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dob: '',
    contactNo: '',
    isWhatsapp: false,
    country: '',
    countryName: '',
    state: '',
    stateName: '',
    city: '',
    cityName: ''
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { saveUserData } = useAuth();

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (formData.country) {
      fetchStates(formData.country);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [formData.country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.country && formData.state) {
      fetchCities(formData.country, formData.state);
    } else {
      setCities([]);
    }
  }, [formData.state]);

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await fetch(`${API_BASE_URL}/location/v2/countries`);
      const data = await response.json();
      if (data.success && data.data) {
        setCountries(data.data);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchStates = async (countryId) => {
    setLoadingStates(true);
    try {
      const response = await fetch(`${API_BASE_URL}/location/v1/userState?country=${countryId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setStates(data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async (countryId, stateId) => {
    setLoadingCities(true);
    try {
      const response = await fetch(`${API_BASE_URL}/location/v3/userCities?country=${countryId}&state=${stateId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setCities(data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'country') {
      const selectedCountry = countries.find(c => c.id == value);
      setFormData(prev => ({
        ...prev,
        country: value,
        countryName: selectedCountry?.name || '',
        state: '',
        stateName: '',
        city: '',
        cityName: ''
      }));
    } else if (name === 'state') {
      const selectedState = states.find(s => s.id == value);
      setFormData(prev => ({
        ...prev,
        state: value,
        stateName: selectedState?.name || '',
        city: '',
        cityName: ''
      }));
    } else if (name === 'city') {
      const selectedCity = cities.find(c => c.id == value);
      setFormData(prev => ({
        ...prev,
        city: value,
        cityName: selectedCity?.name || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.country) {
      setError('Please select a country');
      return false;
    }
    if (!formData.city) {
      setError('Please select a city');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        gender: formData.gender || undefined,
        dob: formData.dob || undefined,
        contactNo: formData.contactNo,
        isWhatsapp: formData.isWhatsapp,
        home_country: parseInt(formData.country),
        home_country_name: formData.countryName,
        home_state: formData.state ? parseInt(formData.state) : null,
        home_state_name: formData.stateName || null,
        home_city: parseInt(formData.city),
        home_city_name: formData.cityName
      };

      const result = await registerWithEmailAndPassword(userData);
      
      if (result.success && result.needsVerification) {
        // Registration successful - show verification message
        alert(`✅ Registration successful!\n\nA verification email has been sent to ${result.email}.\n\nPlease check your inbox and click the verification link before logging in.`);
        // Redirect to login page
        navigate('/');
      } else if (result.success) {
        // Shouldn't happen with new flow, but handle just in case
        saveUserData(result.user);
        navigate('/membership-request');
      } else {
        // Handle Firebase error codes
        const errorMessage = getErrorMessage(result.error);
        setError(errorMessage);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        saveUserData(result.user);
        
        // Google OAuth users need to complete profile if incomplete
        if (result.needsAdditionalInfo || !result.user.profileComplete) {
          navigate('/form');
        } else {
          navigate('/membership-request');
        }
      } else {
        const errorMessage = getErrorMessage(result.error);
        setError(errorMessage);
      }
    } catch (err) {
      setError('Google signup failed. Please try again.');
      console.error('Google signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
      'auth/weak-password': 'Password is too weak.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    };
    return errorMessages[errorCode] || errorCode || 'Registration failed. Please try again.';
  };

  return (
    <div className="register-page">
      <div className="register-panel" role="region" aria-label="Registration panel">
        <div className="register-header">
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Sign up to get started</p>
        </div>

        {error && (
          <div className="register-alert" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form" noValidate>
          <div className="form-field">
            <label htmlFor="name" className="field-label">Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className="text-input"
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="email" className="field-label">Email *</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="text-input"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="dual-row">
            <div className="form-field">
              <label htmlFor="password" className="field-label">Password *</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
                className="text-input"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword" className="field-label">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                className="text-input"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="dual-row">
            <div className="form-field">
              <label htmlFor="gender" className="field-label">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="select-input"
                disabled={loading}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="dob" className="field-label">Date of Birth</label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="text-input date-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="country" className="field-label">Country *</label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              className="select-input"
              disabled={loading || loadingCountries}
            >
              <option value="">
                {loadingCountries ? 'Loading countries...' : 'Select Country'}
              </option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {formData.country && (
            <div className="form-field">
              <label htmlFor="state" className="field-label">State</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="select-input"
                disabled={loading || loadingStates}
              >
                <option value="">
                  {loadingStates ? 'Loading states...' : 'Select State (Optional)'}
                </option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.country && (
            <div className="form-field">
              <label htmlFor="city" className="field-label">City *</label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="select-input"
                disabled={loading || loadingCities || !formData.state}
              >
                <option value="">
                  {loadingCities ? 'Loading cities...' : formData.state ? 'Select City' : 'Select State First'}
                </option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="contactNo" className="field-label">Contact Number</label>
            <input
              id="contactNo"
              type="tel"
              name="contactNo"
              value={formData.contactNo}
              onChange={handleChange}
              placeholder="Enter your contact number"
              className="text-input"
              disabled={loading}
              autoComplete="tel"
            />
          </div>

          {formData.contactNo && (
            <div className="checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isWhatsapp"
                  checked={formData.isWhatsapp}
                  onChange={handleChange}
                  disabled={loading}
                  className="checkbox-input"
                />
                <span className="checkbox-text">This is a WhatsApp number</span>
              </label>
            </div>
          )}

          <button 
            type="submit" 
            className="primary-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account…' : 'Sign Up'}
          </button>
        </form>

        <div className="or-separator" aria-hidden="true">
          <span>or</span>
        </div>

        <div className="oauth-row">
          <button 
            onClick={handleGoogleSignup}
            className="oauth-btn"
            disabled={loading}
            aria-label="Continue with Google"
          >
            <svg className="oauth-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="oauth-text">Google</span>
          </button>
        </div>

        <p className="login-cta">
          Already have an account? <Link to="/" className="cta-link">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
