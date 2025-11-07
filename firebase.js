import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyC1SHEAoh9xwImaQWi1odjmn3dYn5HfYZQ",
    authDomain: "partyone-live-pro-1.firebaseapp.com",
    projectId: "partyone-live-pro-1",
    storageBucket: "partyone-live-pro-1.firebasestorage.app",
    messagingSenderId: "321911795767",
    appId: "1:321911795767:web:50fc4824340fc59fb04fb2",
    measurementId: "G-5FYDE7PCCE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };