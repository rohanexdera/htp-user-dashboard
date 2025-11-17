import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDAZCGPHnfJXJcJVCfZR3yCKlWxN5zDNAU",
  authDomain: "partyone-live-pro-1.firebaseapp.com",
  projectId: "partyone-live-pro-1",
  storageBucket: "partyone-live-pro-1.firebasestorage.app",
  messagingSenderId: "621373515426",
  appId: "1:621373515426:web:47bfc5af5fc0303ef0ffbf",
  measurementId: "G-MQPXCZ46Z8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUserProfile(email) {
  try {
    console.log(`\n🔍 Checking profile for: ${email}\n`);
    
    // You need to provide the UID, not email
    // For now, let's just show instructions
    console.log('⚠️  You need to provide the Firebase UID, not email.');
    console.log('Get the UID from browser console when you log in with Google.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function checkUserByUID(uid) {
  try {
    console.log(`\n🔍 Checking profile for UID: ${uid}\n`);
    
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      console.log('❌ User profile not found in Firestore');
      process.exit(0);
    }
    
    const userData = userDocSnap.data();
    
    console.log('📊 User Profile Data:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:        ${userData.email || 'N/A'}`);
    console.log(`Name:         ${userData.name || 'N/A'}`);
    console.log(`Gender:       ${userData.gender || '❌ MISSING'}`);
    console.log(`DOB:          ${userData.dob || '❌ MISSING'}`);
    console.log(`Contacts:     ${userData.contacts && userData.contacts.length > 0 ? `✅ ${userData.contacts.length} contact(s)` : '❌ MISSING'}`);
    console.log(`Country:      ${userData.home_country || '❌ MISSING'} (${userData.home_country_name || 'N/A'})`);
    console.log(`State:        ${userData.home_state || '❌ MISSING'} (${userData.home_state_name || 'N/A'})`);
    console.log(`City:         ${userData.home_city || '❌ MISSING'} (${userData.home_city_name || 'N/A'})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check completeness
    const isComplete = !!(
      userData.gender && 
      userData.dob && 
      userData.contacts && 
      userData.contacts.length > 0 &&
      userData.home_country &&
      userData.home_state &&
      userData.home_city
    );
    
    if (isComplete) {
      console.log('✅ Profile is COMPLETE - User will be redirected to membership page');
    } else {
      console.log('❌ Profile is INCOMPLETE - User will be redirected to form page');
    }
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function clearProfileFields(uid) {
  try {
    console.log(`\n🧹 Clearing profile fields for UID: ${uid}\n`);
    
    const userDocRef = doc(db, 'users', uid);
    
    await updateDoc(userDocRef, {
      gender: deleteField(),
      dob: deleteField(),
      contacts: [],
      home_country: deleteField(),
      home_country_name: deleteField(),
      home_state: deleteField(),
      home_state_name: deleteField(),
      home_city: deleteField(),
      home_city_name: deleteField()
    });
    
    console.log('✅ Profile fields cleared! User will now be redirected to form on next login.\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];
const value = args[1];

if (!command) {
  console.log('\n📖 Usage:');
  console.log('  node check-user-profile.mjs check <UID>       - Check user profile completeness');
  console.log('  node check-user-profile.mjs clear <UID>       - Clear profile fields (for testing)\n');
  console.log('Example:');
  console.log('  node check-user-profile.mjs check y693O8xwOfR1UzhjoEH36tQw36L2\n');
  process.exit(0);
}

switch (command) {
  case 'check':
    if (!value) {
      console.error('❌ Please provide a UID');
      process.exit(1);
    }
    await checkUserByUID(value);
    break;
    
  case 'clear':
    if (!value) {
      console.error('❌ Please provide a UID');
      process.exit(1);
    }
    await clearProfileFields(value);
    break;
    
  default:
    console.error('❌ Unknown command. Use "check" or "clear"');
    process.exit(1);
}
