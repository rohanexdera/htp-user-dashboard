import { auth } from "../../firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    applyActionCode
} from "firebase/auth";

const googleProvider = new GoogleAuthProvider();

// Backend API URL - Update this with your actual backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://party-one-developer.uc.r.appspot.com/';

/**
 * Register user with email and password
 * Uses Firebase/Firestore backend endpoint (not MySQL)
 */
export const registerWithEmailAndPassword = async (userData) => {
    try {
        const { email, password, name, gender, dob, contactNo, isWhatsapp, home_country, home_country_name, home_state, home_state_name, home_city, home_city_name } = userData;

        // Prepare contacts array as per backend schema
        // Backend requires at least one contact with mode='phone' for phone_no field
        const contacts = [];

        if (contactNo && contactNo.trim()) {
            // If user provided a contact number
            if (isWhatsapp) {
                // Add both phone and whatsapp entries
                contacts.push({
                    contact_no: contactNo,
                    mode: 'phone',
                    is_active: true,
                    is_verified: false
                });
                contacts.push({
                    contact_no: contactNo,
                    mode: 'whatsapp',
                    is_active: true,
                    is_verified: false
                });
            } else {
                // Add only phone entry
                contacts.push({
                    contact_no: contactNo,
                    mode: 'phone',
                    is_active: true,
                    is_verified: false
                });
            }
        } else {
            // No contact number provided - add empty phone contact as required by backend
            contacts.push({
                contact_no: "",
                mode: 'phone',
                is_active: false,
                is_verified: false
            });
        }

        // Prepare request body for /user/v2/create (Firestore endpoint)
        const requestBody = {
            email,
            password,
            name,
            gender: gender || null,
            dob: dob || null,
            contacts: contacts,
            role: ['user'], // Default role
            profile_image: null,
            home_city: home_city || null,
            home_city_name: home_city_name || null,
            home_state: home_state || null,
            home_state_name: home_state_name || null,
            home_country: home_country || null,
            home_country_name: home_country_name || null,
            smoking_habbit: false,
            drinking_habbit: false
        };

        // Call backend to create user (backend will create Firebase user and Firestore doc)
        const response = await fetch(`${API_BASE_URL}/user/v2/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Registration failed');
        }

        // Now sign in the user to get the token
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                name: name,
                idToken: idToken,
                token: idToken,
                home_city_name: home_city_name
            }
        };
    } catch (error) {
        console.error("Error in registration:", error);
        return {
            success: false,
            error: error.code || error.message
        };
    }
};

/**
 * Login user with email and password
 * Follows backend pattern: Firebase auth client-side, then call backend API
 */
export const loginWithEmailAndPassword = async (email, password) => {
    try {
        // Step 1: Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 2: Get ID token
        const idToken = await user.getIdToken();

        // Step 3: Call backend login API to update token and get user data
        const response = await fetch(`${API_BASE_URL}/login/v1/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Login failed');
        }

        return {
            success: true,
            user: {
                uid: data.uid || user.uid,
                email: data.email || user.email,
                idToken: data.token || idToken,
                token: data.token || idToken
            }
        };
    } catch (error) {
        console.error("Error in login:", error);
        return {
            success: false,
            error: error.code || error.message
        };
    }
};

/**
 * Login with Google
 * For Google login, we need to create the user if they don't exist
 */
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const idToken = await user.getIdToken();

        // Check if user exists in backend, if not create them
        // Try to get user info first, if fails, create new user
        try {
            // Try login first (for existing users)
            const loginResponse = await fetch(`${API_BASE_URL}/login/v1/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    password: user.uid // Use UID as password for social logins
                })
            });

            const loginData = await loginResponse.json();
            if (loginData.success) {
                return {
                    success: true,
                    user: {
                        uid: user.uid,
                        email: user.email,
                        idToken,
                        name: user.displayName,
                        photoURL: user.photoURL
                    }
                };
            }
        } catch (loginError) {
            // User doesn't exist, create them
            console.log('User not found, creating new user...');
        }

        // Create new user with Google account
        const createResponse = await fetch(`${API_BASE_URL}/user/v2/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: user.email,
                password: user.uid, // Use UID as password for social logins
                name: user.displayName || 'User',
                contacts: [{ contact_no: "", mode: "phone", is_active: false, is_verified: false }],
                role: ['user'],
                profile_image: user.photoURL || null,
                gender: null,
                dob: null,
                home_city: null,
                home_city_name: null,
                home_state: null,
                home_state_name: null,
                home_country: null,
                home_country_name: null,
                smoking_habbit: false,
                drinking_habbit: false
            })
        });

        const createData = await createResponse.json();

        if (!createData.success) {
            throw new Error(createData.message || 'Failed to create user account');
        }

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                idToken,
                name: user.displayName,
                photoURL: user.photoURL
            }
        };
    } catch (error) {
        console.error("Error in Google login:", error);
        return {
            success: false,
            error: error.code || error.message
        };
    }
};

/**
 * Logout user
 */
export const logout = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Error in logout:", error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};

/**
 * Send email verification to current user
 */
export const sendVerificationEmail = async (user) => {
    try {
        if (!user) {
            user = auth.currentUser;
        }
        
        if (!user) {
            throw new Error('No user logged in');
        }

        await sendEmailVerification(user);
        return { success: true };
    } catch (error) {
        console.error("Error sending verification email:", error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Check if user's email is verified
 */
export const checkEmailVerification = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        // Reload user to get latest emailVerified status
        await user.reload();
        return {
            success: true,
            isVerified: user.emailVerified
        };
    } catch (error) {
        console.error("Error checking email verification:", error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Register user with email verification flow
 * Step 1: Create Firebase user
 * Step 2: Send verification email
 * Step 3: Wait for verification (user clicks link in email)
 * Step 4: Create backend user record
 */
export const registerWithEmailVerification = async (userData) => {
    try {
        const { email, password, name, gender, dob, contactNo, isWhatsapp, 
                home_country, home_country_name, home_state, home_state_name, 
                home_city, home_city_name } = userData;

        // Step 1: Create Firebase user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 2: Send verification email
        await sendEmailVerification(user);

        // Return user info without backend creation
        // Backend creation will happen after email verification
        return {
            success: true,
            needsVerification: true,
            user: {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified
            },
            // Store registration data for later use (including password for backend)
            registrationData: {
                name, gender, dob, contactNo, isWhatsapp, password,
                home_country, home_country_name,
                home_state, home_state_name,
                home_city, home_city_name
            }
        };
    } catch (error) {
        console.error("Error in registration:", error);
        return {
            success: false,
            error: error.code || error.message
        };
    }
};

/**
 * Complete backend user creation after email verification
 * This should be called after user verifies their email
 */
export const completeRegistration = async (registrationData) => {
    try {
        const user = auth.currentUser;
        
        if (!user) {
            throw new Error('No user logged in');
        }

        // Reload user to get latest emailVerified status
        await user.reload();

        if (!user.emailVerified) {
            throw new Error('Email not verified yet');
        }

        const { name, gender, dob, contactNo, isWhatsapp, password,
                home_country, home_country_name, home_state, home_state_name,
                home_city, home_city_name } = registrationData;

        // First, check if user already exists in backend by trying to login
        try {
            const loginResponse = await fetch(`${API_BASE_URL}/login/v1/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    password: password
                })
            });

            const loginData = await loginResponse.json();
            
            if (loginData.success) {
                // User already exists in backend, just return the data
                console.log('User already exists in backend, logging in...');
                const idToken = await user.getIdToken();
                
                return {
                    success: true,
                    user: {
                        uid: loginData.uid || user.uid,
                        email: loginData.email || user.email,
                        name: name,
                        idToken: loginData.token || idToken,
                        token: loginData.token || idToken,
                        home_city_name: home_city_name,
                        emailVerified: true
                    }
                };
            }
        } catch (loginError) {
            // Login failed, user doesn't exist in backend yet, continue with creation
            console.log('User not in backend, proceeding with creation...');
        }

        // Prepare contacts array
        const contacts = [];
        if (contactNo && contactNo.trim()) {
            if (isWhatsapp) {
                contacts.push({
                    contact_no: contactNo,
                    mode: 'phone',
                    is_active: true,
                    is_verified: false
                });
                contacts.push({
                    contact_no: contactNo,
                    mode: 'whatsapp',
                    is_active: true,
                    is_verified: false
                });
            } else {
                contacts.push({
                    contact_no: contactNo,
                    mode: 'phone',
                    is_active: true,
                    is_verified: false
                });
            }
        } else {
            contacts.push({
                contact_no: "",
                mode: 'phone',
                is_active: false,
                is_verified: false
            });
        }

        // Prepare request body for backend
        const requestBody = {
            email: user.email,
            password: password, // Use the actual password
            name,
            gender: gender || 'Male', // Default to 'Male' if not provided (backend requires it)
            dob: dob || null,
            contacts: contacts,
            role: ['user'],
            profile_image: null,
            home_city: home_city || null,
            home_city_name: home_city_name || null,
            home_state: home_state || null,
            home_state_name: home_state_name || null,
            home_country: home_country || null,
            home_country_name: home_country_name || null,
            smoking_habbit: false,
            drinking_habbit: false
        };

        console.log('Creating backend user with data:', requestBody);

        // Create backend user record
        const response = await fetch(`${API_BASE_URL}/user/v2/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log('Backend response:', data);

        if (!data.success) {
            // If error is "email already exists", try to login
            if (data.message && data.message.includes('already in use')) {
                console.log('Email already exists, attempting login...');
                const loginResponse = await fetch(`${API_BASE_URL}/login/v1/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: user.email,
                        password: password
                    })
                });

                const loginData = await loginResponse.json();
                
                if (loginData.success) {
                    const idToken = await user.getIdToken();
                    return {
                        success: true,
                        user: {
                            uid: loginData.uid || user.uid,
                            email: loginData.email || user.email,
                            name: name,
                            idToken: loginData.token || idToken,
                            token: loginData.token || idToken,
                            home_city_name: home_city_name,
                            emailVerified: true
                        }
                    };
                }
            }
            
            // Log detailed error for debugging
            console.error('Backend validation error:', data);
            throw new Error(data.message || 'Backend user creation failed');
        }

        // Get ID token
        const idToken = await user.getIdToken();

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                name: name,
                idToken: idToken,
                token: idToken,
                home_city_name: home_city_name,
                emailVerified: true
            }
        };
    } catch (error) {
        console.error("Error completing registration:", error);
        return {
            success: false,
            error: error.code || error.message
        };
    }
};