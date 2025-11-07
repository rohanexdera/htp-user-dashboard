import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendVerificationEmail, checkEmailVerification, completeRegistration } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

const EmailVerification = () => {
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const { saveUserData } = useAuth();

    // Get registration data from navigation state
    const registrationData = location.state?.registrationData;
    const userEmail = location.state?.email;

    useEffect(() => {
        if (!registrationData || !userEmail) {
            navigate('/register');
        }
    }, [registrationData, userEmail, navigate]);

    useEffect(() => {
        // Cooldown timer for resend button
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleCheckVerification = async (silent = false) => {
        if (!silent) {
            setIsChecking(true);
        }
        setError('');
        setMessage('');

        try {
            const result = await checkEmailVerification();
            
            if (!result.success) {
                throw new Error(result.error);
            }

            if (result.isVerified) {
                // Email is verified! Complete backend registration
                if (!silent) {
                    setMessage('Email verified! Creating your account...');
                }

                const backendResult = await completeRegistration(registrationData);
                
                if (!backendResult.success) {
                    throw new Error(backendResult.error);
                }

                // Save user data to context and localStorage
                saveUserData(backendResult.user);

                // Navigate to form page
                setTimeout(() => {
                    navigate('/form');
                }, 1000);
            } else {
                if (!silent) {
                    setMessage('Email not verified yet. Please check your inbox and click the verification link.');
                }
            }
        } catch (err) {
            if (!silent) {
                setError(err.message || 'Failed to check verification status');
            }
        } finally {
            if (!silent) {
                setIsChecking(false);
            }
        }
    };

    const handleResendEmail = async () => {
        if (resendCooldown > 0) return;

        setError('');
        setMessage('Sending verification email...');

        try {
            const result = await sendVerificationEmail();
            
            if (!result.success) {
                throw new Error(result.error);
            }

            setMessage('Verification email sent! Please check your inbox.');
            setResendCooldown(60); // 60 second cooldown
        } catch (err) {
            setError(err.message || 'Failed to send verification email');
            setMessage('');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.iconCircle}>
                        <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 style={styles.title}>Verify Your Email</h2>
                    <p style={styles.subtitle}>We've sent a verification link to</p>
                    <p style={styles.email}>{userEmail}</p>
                </div>

                <div style={styles.infoBox}>
                    <div style={styles.infoIcon}>ℹ️</div>
                    <div style={styles.infoText}>
                        <strong>Important:</strong> Click the verification link in your email to activate your account.
                        After clicking the link, come back here and click "I've Verified My Email" button.
                    </div>
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {message && !error && (
                    <div style={styles.successBox}>
                        {message}
                    </div>
                )}

                <div style={styles.buttonGroup}>
                    <button
                        onClick={() => handleCheckVerification(false)}
                        disabled={isChecking}
                        style={{
                            ...styles.primaryButton,
                            ...(isChecking ? styles.buttonDisabled : {})
                        }}
                    >
                        {isChecking ? (
                            <span style={styles.buttonContent}>
                                <span style={styles.spinner}></span>
                                Checking...
                            </span>
                        ) : (
                            "I've Verified My Email"
                        )}
                    </button>

                    <button
                        onClick={handleResendEmail}
                        disabled={resendCooldown > 0}
                        style={{
                            ...styles.secondaryButton,
                            ...(resendCooldown > 0 ? styles.buttonDisabled : {})
                        }}
                    >
                        {resendCooldown > 0 
                            ? `Resend in ${resendCooldown}s` 
                            : 'Resend Verification Email'
                        }
                    </button>
                </div>

                <div style={styles.helpSection}>
                    <h3 style={styles.helpTitle}>Didn't receive the email?</h3>
                    <ul style={styles.helpList}>
                        <li>Check your spam or junk folder</li>
                        <li>Make sure you entered the correct email address</li>
                        <li>Wait a few minutes and try resending</li>
                        <li>Add noreply@firebase.com to your contacts</li>
                    </ul>
                </div>

                <div style={styles.footer}>
                    <button
                        onClick={() => navigate('/register')}
                        style={styles.backButton}
                    >
                        ← Back to Registration
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px'
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '40px',
        maxWidth: '500px',
        width: '100%'
    },
    header: {
        textAlign: 'center',
        marginBottom: '30px'
    },
    iconCircle: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#e3f2fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
    },
    icon: {
        width: '40px',
        height: '40px',
        color: '#1976d2'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#333',
        marginBottom: '10px'
    },
    subtitle: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '5px'
    },
    email: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1976d2',
        marginTop: '5px'
    },
    infoBox: {
        backgroundColor: '#e3f2fd',
        border: '1px solid #90caf9',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        display: 'flex',
        gap: '12px'
    },
    infoIcon: {
        fontSize: '20px',
        flexShrink: 0
    },
    infoText: {
        fontSize: '13px',
        color: '#1565c0',
        lineHeight: '1.5'
    },
    errorBox: {
        backgroundColor: '#ffebee',
        border: '1px solid #ef5350',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#c62828'
    },
    successBox: {
        backgroundColor: '#e8f5e9',
        border: '1px solid #81c784',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#2e7d32'
    },
    buttonGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '30px'
    },
    primaryButton: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    secondaryButton: {
        width: '100%',
        padding: '14px',
        backgroundColor: 'white',
        color: '#333',
        border: '2px solid #ddd',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.3s'
    },
    buttonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed'
    },
    buttonContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    spinner: {
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTop: '2px solid white',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block'
    },
    helpSection: {
        borderTop: '1px solid #eee',
        paddingTop: '20px',
        marginBottom: '20px'
    },
    helpTitle: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '12px'
    },
    helpList: {
        fontSize: '13px',
        color: '#666',
        lineHeight: '1.8',
        paddingLeft: '20px',
        margin: 0
    },
    footer: {
        textAlign: 'center'
    },
    backButton: {
        color: '#1976d2',
        fontSize: '14px',
        fontWeight: '500',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        transition: 'color 0.3s'
    }
};

// Add CSS animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default EmailVerification;
