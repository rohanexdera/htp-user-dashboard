import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.party.one';

const Profile = () => {
  const { currentUser, userData, saveUserData } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user details from the backend
        const response = await fetch(
          `${API_BASE_URL}/user/v1/user?uid=${currentUser.uid}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch user details from server');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          // Backend returns complete user data
          setUserDetails(data.data);
          saveUserData(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch user details');
        }
        
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError(err.message);
        
        // Fallback to cached data from localStorage/context
        if (userData && Object.keys(userData).length > 0) {
          setUserDetails(userData);
        } else {
          // Last resort: use only Firebase auth data
          const firebaseData = {
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            phoneNumber: currentUser.phoneNumber
          };
          setUserDetails(firebaseData);
        }
        
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <h2>Not Authenticated</h2>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {userDetails?.photoURL ? (
              <img src={userDetails.photoURL} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                {(userDetails?.displayName || userDetails?.name || userDetails?.email)?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="profile-name">
            {userDetails?.displayName || userDetails?.name || 'User'}
          </h1>
          <p className="profile-email">{userDetails?.email}</p>
          {userDetails?.emailVerified && (
            <span className="verified-badge">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Verified
            </span>
          )}
        </div>

        {error && (
          <div className="profile-warning">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
            </svg>
            <span>Some profile data could not be loaded from server. Showing cached data.</span>
          </div>
        )}

        <div className="profile-details">
          <h2>Personal Information</h2>
          
          <div className="detail-grid">
            <div className="detail-item">
              <label>Full Name</label>
              <p>{userDetails?.name || userDetails?.displayName || 'Not provided'}</p>
            </div>

            <div className="detail-item">
              <label>Email</label>
              <p>{userDetails?.email}</p>
            </div>

            {(userDetails?.phone_no || userDetails?.phoneNumber) && (
              <div className="detail-item">
                <label>Phone Number</label>
                <p>{userDetails.phone_no || userDetails.phoneNumber}</p>
              </div>
            )}

            {userDetails?.dob && (
              <div className="detail-item">
                <label>Date of Birth</label>
                <p>{new Date(userDetails.dob).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            )}

            {userDetails?.gender && (
              <div className="detail-item">
                <label>Gender</label>
                <p style={{ textTransform: 'capitalize' }}>{userDetails.gender}</p>
              </div>
            )}

            {userDetails?.role && (
              <div className="detail-item">
                <label>Account Type</label>
                <p style={{ textTransform: 'capitalize' }}>{userDetails.role}</p>
              </div>
            )}
          </div>

          {(userDetails?.home_country_name || userDetails?.home_state_name || userDetails?.home_city_name) && (
            <>
              <h2>Location</h2>
              <div className="detail-grid">
                {userDetails?.home_country_name && (
                  <div className="detail-item">
                    <label>Country</label>
                    <p>{userDetails.home_country_name}</p>
                  </div>
                )}

                {userDetails?.home_state_name && (
                  <div className="detail-item">
                    <label>State</label>
                    <p>{userDetails.home_state_name}</p>
                  </div>
                )}

                {userDetails?.home_city_name && (
                  <div className="detail-item">
                    <label>City</label>
                    <p>{userDetails.home_city_name}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {(userDetails?.smoking_habbit || userDetails?.drinking_habbit) && (
            <>
              <h2>Preferences</h2>
              <div className="detail-grid">
                {userDetails?.smoking_habbit && (
                  <div className="detail-item">
                    <label>Smoking</label>
                    <p style={{ textTransform: 'capitalize' }}>{userDetails.smoking_habbit}</p>
                  </div>
                )}

                {userDetails?.drinking_habbit && (
                  <div className="detail-item">
                    <label>Drinking</label>
                    <p style={{ textTransform: 'capitalize' }}>{userDetails.drinking_habbit}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="membership-section">
            <h2>Membership Information</h2>
            
            {userDetails?.active_membership_name ? (
              <div className="membership-card">
                <div className="membership-info-left">
                  <div className="membership-badge">
                    <span className="status active">
                      {userDetails.active_membership_name}
                    </span>
                  </div>
                  {userDetails?.status && (
                    <div className="membership-status-info">
                      <label>Membership Status</label>
                      <p>
                        <span className={`status-badge ${userDetails.status.toLowerCase()}`}>
                          {userDetails.status}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                {userDetails?.loyality_point !== undefined && (
                  <div className="loyalty-points">
                    <label>Loyalty Points</label>
                    <p className="points">{userDetails.loyality_point}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="membership-card no-membership">
                <p>No active membership</p>
                <button className="membership-cta" onClick={() => window.location.href = '/membership-request'}>
                  Get Membership
                </button>
              </div>
            )}
          </div>

          {userDetails?.createdAt && (
            <div className="account-meta">
              <h2>Account Details</h2>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Member Since</label>
                  <p>{new Date(userDetails.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;