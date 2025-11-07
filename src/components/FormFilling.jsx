import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../utils/auth';

const FormFilling = () => {
  const { currentUser, userData, clearUserData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      clearUserData();
      navigate('/');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Welcome to Form Filling</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>User Information</h2>
        
        {currentUser && (
          <div style={styles.infoSection}>
            <div style={styles.infoRow}>
              <span style={styles.label}>Email:</span>
              <span style={styles.value}>{currentUser.email}</span>
            </div>
            
            <div style={styles.infoRow}>
              <span style={styles.label}>User ID:</span>
              <span style={styles.value}>{currentUser.uid}</span>
            </div>

            {userData && (
              <>
                {userData.name && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Name:</span>
                    <span style={styles.value}>{userData.name}</span>
                  </div>
                )}
                
                {userData.gender && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Gender:</span>
                    <span style={styles.value}>{userData.gender}</span>
                  </div>
                )}

                {userData.dob && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Date of Birth:</span>
                    <span style={styles.value}>{new Date(userData.dob).toLocaleDateString()}</span>
                  </div>
                )}

                {userData.contacts && userData.contacts.length > 0 && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Contact:</span>
                    <span style={styles.value}>
                      {userData.contacts.map((contact, index) => (
                        <div key={index}>
                          {contact.contact_no} {contact.is_whatsapp && '(WhatsApp)'}
                        </div>
                      ))}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div style={styles.formSection}>
          <h3 style={styles.sectionTitle}>Form Content</h3>
          <p style={styles.placeholder}>
            This is a protected page. Only authenticated users can access this content.
            You can add your form components here.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxWidth: '800px',
    margin: '0 auto'
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
    borderBottom: '2px solid #007bff',
    paddingBottom: '10px'
  },
  infoSection: {
    marginBottom: '30px'
  },
  infoRow: {
    display: 'flex',
    padding: '12px 0',
    borderBottom: '1px solid #eee',
    gap: '15px'
  },
  label: {
    fontWeight: '600',
    color: '#555',
    minWidth: '150px'
  },
  value: {
    color: '#333',
    flex: 1
  },
  formSection: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#333'
  },
  placeholder: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.6'
  }
};

export default FormFilling;