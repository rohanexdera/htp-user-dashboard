import { auth, db } from "../../firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    applyActionCode
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

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
 * Login with Google - Simplified OAuth Flow
 * 1. Authenticate with Google (creates Firebase Auth user)
 * 2. Check if user profile exists in Firestore
 * 3. If not, create basic profile (additional details collected via form)
 * 4. No password needed for OAuth users!
 */
export const loginWithGoogle = async () => {
    try {
        console.log('🔐 Starting Google sign-in...');
        
        // Step 1: Authenticate with Google
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const idToken = await user.getIdToken();

        console.log('✅ Google sign-in successful:', user.email);
        console.log('User UID:', user.uid);

        // Step 2: Check if user profile exists in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            // Existing user - check if profile is complete
            console.log('✅ Returning user - profile found');
            const userData = userDocSnap.data();
            
            console.log('📊 Current user data from Firestore:', {
                gender: userData.gender,
                dob: userData.dob,
                contacts: userData.contacts,
                home_country: userData.home_country,
                home_state: userData.home_state,
                home_city: userData.home_city
            });
            
            // Check if essential profile fields are filled
            const isProfileComplete = !!(
                userData.gender && 
                userData.dob && 
                userData.contacts && 
                userData.contacts.length > 0 &&
                userData.home_country &&
                userData.home_state &&
                userData.home_city
            );
            
            console.log('✓ Profile completeness check:', {
                gender: !!userData.gender,
                dob: !!userData.dob,
                contacts: !!(userData.contacts && userData.contacts.length > 0),
                location: !!(userData.home_country && userData.home_state && userData.home_city),
                OVERALL: isProfileComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'
            });
            
            if (!isProfileComplete) {
                console.log('🔀 Profile incomplete - redirecting to FORM');
                return {
                    success: true,
                    isNewUser: false,
                    needsAdditionalInfo: true,
                    user: {
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName || userData.name,
                        photoURL: user.photoURL,
                        idToken,
                        token: idToken,
                        profileComplete: false
                    }
                };
            }
            
            console.log('🔀 Profile complete - redirecting to MEMBERSHIP');
            return {
                success: true,
                isNewUser: false,
                user: {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || userData.name,
                    photoURL: user.photoURL,
                    idToken,
                    token: idToken,
                    profileComplete: true
                }
            };
        }
        
        // Step 3: New user - create basic Firestore profile
        console.log('🆕 New user - creating basic profile in Firestore...');
        
        await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            name: user.displayName || 'User',
            profile_image: user.photoURL || null,
            role: ['user'],
            contacts: [],
            gender: null, // Will be collected in form
            dob: null, // Will be collected in form
            home_city: null,
            home_city_name: null,
            home_state: null,
            home_state_name: null,
            home_country: null,
            home_country_name: null,
            smoking_habbit: false,
            drinking_habbit: false,
            active_membership_id: null,
            active_membership_name: null,
            last_membership_id: null,
            last_membership_name: null,
            status: 'Active',
            name_lower_case: (user.displayName || 'user').toLowerCase(),
            phone_no: '', // Will be collected in form
            club_id: null,
            token: idToken,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        console.log('✅ Basic profile created in Firestore');
        console.log('ℹ️  Additional details will be collected via form');
        
        // Return success with flag indicating profile needs completion
        return {
            success: true,
            isNewUser: true,
            needsAdditionalInfo: true, // Flag to show form for additional details
            user: {
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                idToken,
                token: idToken,
                profileComplete: false
            }
        };
        
    } catch (error) {
        console.error("❌ Error in Google login:", error);
        
        // Handle specific Firebase errors
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            return {
                success: false,
                error: 'Google sign-in was cancelled'
            };
        }
        
        if (error.code === 'permission-denied') {
            return {
                success: false,
                error: 'Permission denied. Please check Firebase security rules.'
            };
        }
        
        return {
            success: false,
            error: error.message || 'Google sign-in failed'
        };
    }
};

/**
 * Update Google OAuth user profile with additional details
 * Called after user completes the additional information form
 */
export const updateGoogleUserProfile = async (additionalData) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        console.log('📝 Updating user profile with additional details...');
        
        const { gender, dob, contactNo, isWhatsapp, home_country, home_country_name, 
                home_state, home_state_name, home_city, home_city_name } = additionalData;

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
        }

        // Update Firestore document
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            gender: gender || 'Male',
            dob: dob || null,
            contacts: contacts,
            phone_no: contactNo || '',
            home_city: home_city || null,
            home_city_name: home_city_name || null,
            home_state: home_state || null,
            home_state_name: home_state_name || null,
            home_country: home_country || null,
            home_country_name: home_country_name || null,
            updatedAt: serverTimestamp()
        }, { merge: true }); // merge: true to update only these fields

        console.log('✅ Profile updated successfully');
        
        const idToken = await user.getIdToken(true); // Force refresh token
        
        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                idToken,
                token: idToken,
                profileComplete: true
            }
        };
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        return {
            success: false,
            error: error.message
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