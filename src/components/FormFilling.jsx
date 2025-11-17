import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../utils/auth';
import './Register.css'; // Reuse Register.css for consistent styling

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.party.one';

const FormFilling = () => {
  const { currentUser, userData, clearUserData } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    gender: 'Male',
    dob: '',
    contactNo: '',
    isWhatsapp: false,
    home_country: null,
    home_country_name: '',
    home_state: null,
    home_state_name: '',
    home_city: null,
    home_city_name: '',
    smoking_habbit: false,
    drinking_habbit: false
  });

  // Location data state
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (formData.home_country) {
      fetchStates(formData.home_country);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [formData.home_country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.home_state && formData.home_country) {
      fetchCities(formData.home_state, formData.home_country);
    } else {
      setCities([]);
    }
  }, [formData.home_state, formData.home_country]);

  const fetchCountries = async () => {
    try {
      setLoadingLocations(true);
      console.log('🌍 Fetching countries...');
      // Using MySQL endpoint (v2) as per backend comments
      const response = await fetch(`${API_BASE_URL}/location/v2/countries`);
      const result = await response.json();
      
      console.log('Countries API response:', result);
      
      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} countries`);
        setCountries(result.data);
      } else {
        console.error('❌ Failed to load countries:', result.message);
      }
    } catch (err) {
      console.error('❌ Error fetching countries:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchStates = async (countryId) => {
    try {
      setLoadingLocations(true);
      console.log(`🏛️ Fetching states for country ${countryId}...`);
      const response = await fetch(`${API_BASE_URL}/location/v1/userState?country=${countryId}`);
      const result = await response.json();
      
      console.log('States API response:', result);
      
      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} states`);
        setStates(result.data);
      } else {
        console.error('❌ Failed to load states:', result.message);
        setStates([]);
      }
    } catch (err) {
      console.error('❌ Error fetching states:', err);
      setStates([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchCities = async (stateId, countryId) => {
    try {
      setLoadingLocations(true);
      console.log(`🏙️ Fetching cities for country ${countryId}, state ${stateId}...`);
      const response = await fetch(`${API_BASE_URL}/location/v3/userCities?country=${countryId}&state=${stateId}`);
      const result = await response.json();
      
      console.log('Cities API response:', result);
      
      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} cities`);
        setCities(result.data);
      } else {
        console.error('❌ Failed to load cities:', result.message);
        setCities([]);
      }
    } catch (err) {
      console.error('❌ Error fetching cities:', err);
      setCities([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    console.log(`📝 Input changed: ${name} = ${value}`);
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'home_country') {
      const selectedCountry = countries.find(c => c.id === parseInt(value));
      console.log(`🌍 Country selected:`, selectedCountry);
      setFormData(prev => ({
        ...prev,
        home_country: parseInt(value),
        home_country_name: selectedCountry?.name || '',
        home_state: null,
        home_state_name: '',
        home_city: null,
        home_city_name: ''
      }));
      // Reset states and cities
      setStates([]);
      setCities([]);
    } else if (name === 'home_state') {
      const selectedState = states.find(s => s.id === parseInt(value));
      console.log(`🏛️ State selected:`, selectedState);
      setFormData(prev => ({
        ...prev,
        home_state: parseInt(value),
        home_state_name: selectedState?.name || '',
        home_city: null,
        home_city_name: ''
      }));
      // Reset cities
      setCities([]);
    } else if (name === 'home_city') {
      const selectedCity = cities.find(c => c.id === parseInt(value));
      console.log(`🏙️ City selected:`, selectedCity);
      setFormData(prev => ({
        ...prev,
        home_city: parseInt(value),
        home_city_name: selectedCity?.name || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (!formData.dob) {
      setError('Date of birth is required');
      return;
    }
    
    if (!formData.contactNo || formData.contactNo.trim() === '') {
      setError('Contact number is required');
      return;
    }
    
    if (!formData.home_country || !formData.home_state || !formData.home_city) {
      setError('Please select country, state, and city');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare contacts array based on backend schema (v2/update uses mode: 'phone'|'whatsapp')
      const contacts = [];
      if (formData.isWhatsapp) {
        contacts.push({
          contact_no: formData.contactNo,
          mode: 'phone',
          is_active: true,
          is_verified: false
        });
        contacts.push({
          contact_no: formData.contactNo,
          mode: 'whatsapp',
          is_active: true,
          is_verified: false
        });
      } else {
        contacts.push({
          contact_no: formData.contactNo,
          mode: 'phone',
          is_active: true,
          is_verified: false
        });
      }

      // Prepare update payload matching backend updateUserSchemaV2
      const updatePayload = {
        uid: currentUser.uid,
        gender: formData.gender,
        dob: formData.dob,
        contacts: contacts,
        home_city: formData.home_city,
        home_city_name: formData.home_city_name,
        home_state: formData.home_state,
        home_state_name: formData.home_state_name,
        home_country: formData.home_country,
        home_country_name: formData.home_country_name,
        smoking_habbit: formData.smoking_habbit,
        drinking_habbit: formData.drinking_habbit
      };

      console.log('📤 Sending profile update:', updatePayload);

      // Call backend API to update user profile
      const response = await fetch(`${API_BASE_URL}/user/v2/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Profile updated successfully');
        setSuccess('Profile updated successfully!');
        
        // Wait a moment to show success message
        setTimeout(() => {
          // Redirect to membership request page
          navigate('/membership-request');
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }

    } catch (err) {
      console.error('❌ Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      clearUserData();
      navigate('/');
    }
  };

  return (
    <div className="register-page">
      <div className="register-panel" role="region" aria-label="Complete Profile Form">
        <div className="register-header">
          <h1 className="register-title">Complete Your Profile</h1>
          <p className="register-subtitle">
            Welcome, {userData?.name || currentUser?.email}! Please complete your profile to continue.
          </p>
        </div>

        {error && (
          <div className="register-alert" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="register-alert" role="alert" style={{
            background: 'rgba(40, 167, 69, 0.1)',
            borderColor: 'rgba(40, 167, 69, 0.3)',
            color: '#4ade80'
          }}>
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form" noValidate>
          {/* Gender and DOB Row */}
          <div className="dual-row">
            <div className="form-field">
              <label htmlFor="gender" className="field-label">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="select-input"
                required
                disabled={loading}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="dob" className="field-label">Date of Birth *</label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="text-input date-input"
                max={new Date().toISOString().split('T')[0]}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Contact Number */}
          <div className="form-field">
            <label htmlFor="contactNo" className="field-label">Contact Number *</label>
            <input
              id="contactNo"
              type="tel"
              name="contactNo"
              value={formData.contactNo}
              onChange={handleInputChange}
              placeholder="Enter your contact number"
              className="text-input"
              required
              disabled={loading}
              autoComplete="tel"
            />
          </div>

          {/* WhatsApp Checkbox */}
          {formData.contactNo && (
            <div className="checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isWhatsapp"
                  checked={formData.isWhatsapp}
                  onChange={handleInputChange}
                  className="checkbox-input"
                  disabled={loading}
                />
                <span className="checkbox-text">This is a WhatsApp number</span>
              </label>
            </div>
          )}

          {/* Country Selection */}
          <div className="form-field">
            <label htmlFor="home_country" className="field-label">Country *</label>
            <select
              id="home_country"
              name="home_country"
              value={formData.home_country || ''}
              onChange={handleInputChange}
              className="select-input"
              disabled={loading || loadingLocations}
              required
            >
              <option value="">
                {loadingLocations ? 'Loading countries...' : 'Select Country'}
              </option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* State Selection */}
          {formData.home_country && (
            <div className="form-field">
              <label htmlFor="home_state" className="field-label">
                State * {loadingLocations && states.length === 0 && '(Loading...)'}
              </label>
              <select
                id="home_state"
                name="home_state"
                value={formData.home_state || ''}
                onChange={handleInputChange}
                className="select-input"
                disabled={loading || (loadingLocations && states.length === 0)}
                required
              >
                <option value="">
                  {loadingLocations && states.length === 0
                    ? 'Loading states...' 
                    : states.length === 0 
                      ? 'No states available'
                      : 'Select State'}
                </option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* City Selection */}
          {formData.home_country && (
            <div className="form-field">
              <label htmlFor="home_city" className="field-label">
                City * {loadingLocations && formData.home_state && cities.length === 0 && '(Loading...)'}
              </label>
              <select
                id="home_city"
                name="home_city"
                value={formData.home_city || ''}
                onChange={handleInputChange}
                className="select-input"
                disabled={loading || !formData.home_state || (loadingLocations && cities.length === 0)}
                required
              >
                <option value="">
                  {!formData.home_state
                    ? 'Select State First'
                    : loadingLocations && cities.length === 0
                      ? 'Loading cities...' 
                      : cities.length === 0 
                        ? 'No cities available'
                        : 'Select City'}
                </option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Habits Section */}
          <div className="form-field">
            <label className="field-label">Preferences (Optional)</label>
            
            <div className="checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="smoking_habbit"
                  checked={formData.smoking_habbit}
                  onChange={handleInputChange}
                  className="checkbox-input"
                  disabled={loading}
                />
                <span className="checkbox-text">Smoking</span>
              </label>
            </div>

            <div className="checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="drinking_habbit"
                  checked={formData.drinking_habbit}
                  onChange={handleInputChange}
                  className="checkbox-input"
                  disabled={loading}
                />
                <span className="checkbox-text">Drinking</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading ? 'Updating Profile…' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormFilling;