import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.party.one';

const Profile = () => {
  const { currentUser, userData, saveUserData } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Account deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1: confirm, 2: OTP, 3: final confirm
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

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

  // Account deletion handlers
  const handleRequestDeleteOtp = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/v1/sendAccountDeleteEmailOtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: currentUser.uid
        })
      });

      const data = await response.json();

      if (data.success) {
        setDeleteSuccess('OTP sent to your email successfully!');
        setDeleteStep(2);
      } else {
        setDeleteError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending delete OTP:', err);
      setDeleteError('Failed to send OTP. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleVerifyDeleteOtp = async () => {
    if (!deleteOtp || deleteOtp.length !== 4) {
      setDeleteError('Please enter a valid 4-digit OTP');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      const response = await fetch(`${API_BASE_URL}/user/v1/VerifyEmailOtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userDetails.email,
          otp: deleteOtp
        })
      });

      const data = await response.json();

      if (data.success) {
        setDeleteSuccess('OTP verified successfully!');
        setDeleteStep(3);
      } else {
        setDeleteError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setDeleteError('Failed to verify OTP. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const token = await currentUser.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/user/v1/deleteUser?uid=${currentUser.uid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        }
      });

      const data = await response.json();

      if (data.success) {
        setDeleteSuccess(data.message || 'Account deletion request submitted. You have 7 days to cancel.');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setDeleteError(data.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setDeleteError('Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setDeleteOtp('');
    setDeleteError('');
    setDeleteSuccess('');
  };

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

          {/* Danger Zone */}
          <div className="danger-zone">
            <h2>Danger Zone</h2>
            <div className="danger-zone-content">
              <div className="danger-zone-info">
                <h3>Delete Account</h3>
                <p>
                  Once you delete your account, there is no going back after 7 days. 
                  Please be certain.
                </p>
              </div>
              <button 
                className="danger-btn" 
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={resetDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={resetDeleteModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {deleteStep === 1 && (
              <>
                <div className="modal-icon danger">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="modal-title">Delete Your Account?</h2>
                <p className="modal-description">
                  This action will mark your account for deletion. Your account and all data will be 
                  permanently deleted after 7 days. You can still login and cancel the deletion during this period.
                </p>
                <p className="modal-warning">
                  We will send you an OTP to verify this action.
                </p>
                {deleteError && <div className="modal-error">{deleteError}</div>}
                {deleteSuccess && <div className="modal-success">{deleteSuccess}</div>}
                <div className="modal-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={resetDeleteModal}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={handleRequestDeleteOtp}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              </>
            )}

            {deleteStep === 2 && (
              <>
                <div className="modal-icon info">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M3 8L10.89 13.26C11.567 13.72 12.433 13.72 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="modal-title">Enter OTP</h2>
                <p className="modal-description">
                  We've sent a 4-digit OTP to <strong>{userDetails?.email}</strong>
                </p>
                {deleteError && <div className="modal-error">{deleteError}</div>}
                {deleteSuccess && <div className="modal-success">{deleteSuccess}</div>}
                <div className="otp-input-group">
                  <input
                    type="text"
                    maxLength="4"
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit OTP"
                    className="otp-input"
                    autoFocus
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => setDeleteStep(1)}
                    disabled={deleteLoading}
                  >
                    Back
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleVerifyDeleteOtp}
                    disabled={deleteLoading || deleteOtp.length !== 4}
                  >
                    {deleteLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </>
            )}

            {deleteStep === 3 && (
              <>
                <div className="modal-icon danger">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="modal-title">Final Confirmation</h2>
                <p className="modal-description">
                  Are you absolutely sure? This will mark your account for permanent deletion after 7 days.
                </p>
                <div className="confirmation-list">
                  <p>✓ OTP verified successfully</p>
                  <p>✓ All your data will be deleted in 7 days</p>
                  <p>✓ You can still login and cancel within 7 days</p>
                  <p>✓ You will receive confirmation emails and notifications</p>
                </div>
                {deleteError && <div className="modal-error">{deleteError}</div>}
                {deleteSuccess && <div className="modal-success">{deleteSuccess}</div>}
                <div className="modal-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={resetDeleteModal}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Processing...' : 'Yes, Delete My Account'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;