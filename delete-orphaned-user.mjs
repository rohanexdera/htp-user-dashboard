/**
 * Script to fix orphaned Firebase Auth users
 * Run this to delete Firebase Auth users that don't have Firestore documents
 * 
 * This happens when Google OAuth creates Auth user but backend fails to create Firestore doc
 */

import { initializeApp } from 'firebase/app';
import { getAuth, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';

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

/**
 * Delete a user from Firebase Auth
 * Note: This only works if the user is currently signed in
 * For admin deletion, you need to use Firebase Admin SDK on the backend
 */
async function deleteOrphanedUser(email) {
    try {
        console.log(`\n🔍 Checking user: ${email}`);
        console.log('⚠️  Note: This script can only delete if user signs in first');
        console.log('⚠️  For admin deletion, you need backend Firebase Admin access\n');
        
        // To delete from client side, user must be signed in
        const currentUser = auth.currentUser;
        
        if (currentUser && currentUser.email === email) {
            console.log('✅ User is currently signed in');
            console.log(`Deleting user: ${currentUser.uid}`);
            
            await deleteUser(currentUser);
            console.log('✅ User deleted successfully');
            console.log('✅ They can now sign up again with Google\n');
            return true;
        } else {
            console.log('❌ User is not signed in');
            console.log('\n📋 To delete this user, you need to:');
            console.log('   1. Go to Firebase Console');
            console.log('   2. Authentication > Users');
            console.log(`   3. Find user: ${email}`);
            console.log('   4. Click delete icon');
            console.log('   OR');
            console.log('   5. Use Firebase Admin SDK on backend\n');
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

/**
 * Instructions for manual cleanup
 */
function printManualInstructions() {
    console.log('\n' + '='.repeat(70));
    console.log('MANUAL CLEANUP INSTRUCTIONS FOR ORPHANED FIREBASE AUTH USERS');
    console.log('='.repeat(70));
    console.log('\n📍 Problem:');
    console.log('   Google Sign-In created user in Firebase Auth');
    console.log('   But backend failed to create Firestore document');
    console.log('   User exists in Auth but has no profile data\n');
    console.log('🔧 Solution Options:\n');
    console.log('1️⃣  FIREBASE CONSOLE (Easiest):');
    console.log('   • Go to: https://console.firebase.google.com/');
    console.log('   • Select project: partyone-live-pro-1');
    console.log('   • Navigate to: Authentication > Users');
    console.log('   • Find user: rohanad757@gmail.com');
    console.log('   • Click the 3-dot menu > Delete user');
    console.log('   • User can then sign up again with Google\n');
    console.log('2️⃣  BACKEND API (Best for automation):');
    console.log('   Create an admin endpoint in htp-nodejs:');
    console.log('   ```javascript');
    console.log('   router.post(\'/admin/deleteOrphanedUser\', async (req, res) => {');
    console.log('       const { uid } = req.body;');
    console.log('       await admin.auth().deleteUser(uid);');
    console.log('       res.json({ success: true });');
    console.log('   });');
    console.log('   ```\n');
    console.log('3️⃣  FIRESTORE DOCUMENT (Alternative):');
    console.log('   Create the missing Firestore document manually:');
    console.log('   • Go to Firestore in Firebase Console');
    console.log('   • Collection: users');
    console.log('   • Add document with UID from Auth user');
    console.log('   • Include required fields: name, email, contacts, etc.\n');
    console.log('='.repeat(70));
    console.log('\n');
}

// Run the check
const emailToCheck = 'rohanad757@gmail.com';
console.log('🚀 Firebase Auth User Cleanup Tool');
console.log('===================================\n');

deleteOrphanedUser(emailToCheck).then(() => {
    printManualInstructions();
    
    console.log('💡 RECOMMENDATION:');
    console.log('   Go to Firebase Console and delete the user manually');
    console.log(`   URL: https://console.firebase.google.com/u/0/project/partyone-live-pro-1/authentication/users`);
    console.log('\n✅ After deletion, user can sign up again with Google successfully\n');
    
    process.exit(0);
});
