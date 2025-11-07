/**
 * Comprehensive Authentication Test
 * Tests both Firebase and Backend authentication
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration (from firebase.js)
const firebaseConfig = {
    apiKey: "AIzaSyC1SHEAoh9xwImaQWi1odjmn3dYn5HfYZQ",
    authDomain: "partyone-live-pro-1.firebaseapp.com",
    projectId: "partyone-live-pro-1",
    storageBucket: "partyone-live-pro-1.firebasestorage.app",
    messagingSenderId: "321911795767",
    appId: "1:321911795767:web:50fc4824340fc59fb04fb2",
    measurementId: "G-5FYDE7PCCE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_BASE_URL = 'https://party-one-developer.uc.r.appspot.com';
const TEST_EMAIL = 'groook757@gmail.com';
const TEST_PASSWORD = 'Rohan@757';

async function runComprehensiveTest() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     COMPREHENSIVE AUTHENTICATION TEST                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Test Configuration:');
    console.log('   Email:', TEST_EMAIL);
    console.log('   Password:', TEST_PASSWORD);
    console.log('   Backend:', API_BASE_URL);
    console.log('   Firebase Project:', firebaseConfig.projectId);
    console.log('\n' + '─'.repeat(60) + '\n');

    try {
        // ============================================================
        // STEP 1: Test Firebase Authentication (Client-Side)
        // ============================================================
        console.log('🔥 STEP 1: Firebase Authentication (Client-Side)');
        console.log('─'.repeat(60));
        console.log('Attempting to sign in with Firebase...\n');

        let firebaseUser = null;
        let firebaseToken = null;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
            firebaseUser = userCredential.user;
            firebaseToken = await firebaseUser.getIdToken();

            console.log('✅ Firebase authentication SUCCESSFUL!\n');
            console.log('Firebase User Details:');
            console.log('   UID:', firebaseUser.uid);
            console.log('   Email:', firebaseUser.email);
            console.log('   Email Verified:', firebaseUser.emailVerified);
            console.log('   Creation Time:', firebaseUser.metadata.creationTime);
            console.log('   Last Sign In:', firebaseUser.metadata.lastSignInTime);
            console.log('   Token (first 50 chars):', firebaseToken.substring(0, 50) + '...');
            console.log('\n✅ FIREBASE AUTH: PASSED');

        } catch (firebaseError) {
            console.log('❌ Firebase authentication FAILED!\n');
            console.log('Error Details:');
            console.log('   Code:', firebaseError.code);
            console.log('   Message:', firebaseError.message);
            
            if (firebaseError.code === 'auth/user-not-found') {
                console.log('\n💡 Suggestion: User does not exist. Try registering first.');
            } else if (firebaseError.code === 'auth/wrong-password') {
                console.log('\n💡 Suggestion: Password is incorrect. Verify the password.');
            } else if (firebaseError.code === 'auth/invalid-email') {
                console.log('\n💡 Suggestion: Email format is invalid.');
            }
            
            console.log('\n❌ FIREBASE AUTH: FAILED');
            console.log('\n⚠️  Cannot proceed to backend test without Firebase authentication.');
            return;
        }

        console.log('\n' + '─'.repeat(60) + '\n');

        // ============================================================
        // STEP 2: Test Backend Login API
        // ============================================================
        console.log('🌐 STEP 2: Backend Login API Test');
        console.log('─'.repeat(60));
        console.log('Calling backend login endpoint...\n');

        try {
            const backendResponse = await fetch(`${API_BASE_URL}/login/v1/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: TEST_EMAIL,
                    password: TEST_PASSWORD
                })
            });

            console.log('Backend Response Status:', backendResponse.status);
            console.log('Backend Response Status Text:', backendResponse.statusText);

            const backendData = await backendResponse.json();
            
            console.log('\nBackend Response Data:');
            console.log(JSON.stringify(backendData, null, 2));

            if (backendData.success) {
                console.log('\n✅ Backend authentication SUCCESSFUL!\n');
                
                if (backendData.data && backendData.data.length > 0) {
                    const userData = backendData.data[0];
                    console.log('User Data from Backend:');
                    console.log('   ID:', userData.id);
                    console.log('   Name:', userData.name || 'N/A');
                    console.log('   Email:', userData.email);
                    console.log('   Gender:', userData.gender || 'N/A');
                    console.log('   DOB:', userData.dob || 'N/A');
                    console.log('   Token Present:', userData.token ? 'Yes' : 'No');
                    
                    if (userData.contacts) {
                        console.log('   Contacts:', userData.contacts.length);
                    }
                }
                
                console.log('\n✅ BACKEND API: PASSED');
            } else {
                console.log('\n❌ Backend authentication FAILED!\n');
                console.log('Error from Backend:');
                console.log('   Message:', backendData.message);
                console.log('   Error Code:', backendData.error);
                
                if (backendData.error === 'auth/wrong-password') {
                    console.log('\n💡 Analysis: Backend Firebase auth failed');
                    console.log('   - Frontend Firebase auth: ✅ Success');
                    console.log('   - Backend Firebase auth: ❌ Failed');
                    console.log('\n   Possible causes:');
                    console.log('   1. Backend using different Firebase project');
                    console.log('   2. Backend Firebase credentials not configured');
                    console.log('   3. Backend code issue with Firebase auth');
                }
                
                console.log('\n❌ BACKEND API: FAILED');
            }

        } catch (backendError) {
            console.log('\n❌ Backend API call FAILED!\n');
            console.log('Error:', backendError.message);
            console.log('\n❌ BACKEND API: FAILED');
        }

        console.log('\n' + '─'.repeat(60) + '\n');

        // ============================================================
        // FINAL SUMMARY
        // ============================================================
        console.log('📊 FINAL TEST SUMMARY');
        console.log('─'.repeat(60));
        console.log('Firebase Auth (Client):', firebaseUser ? '✅ PASSED' : '❌ FAILED');
        console.log('Backend API:', '(See above for status)');
        console.log('\n' + '═'.repeat(60) + '\n');

        if (firebaseUser) {
            console.log('🎯 CONCLUSION:');
            console.log('   Firebase authentication is working correctly on the client side.');
            console.log('   Check the backend logs to see why the backend Firebase auth is failing.');
            console.log('\n📝 NEXT STEPS:');
            console.log('   1. Check backend deployment logs');
            console.log('   2. Verify backend Firebase configuration');
            console.log('   3. Ensure backend has the same Firebase project credentials');
            console.log('   4. Check if user exists in backend database');
        }

    } catch (error) {
        console.log('\n💥 UNEXPECTED ERROR:');
        console.log(error);
    }
}

// Run the test
runComprehensiveTest().catch(console.error);
