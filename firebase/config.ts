
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2-A7Tw8jZrjA1Hg1sL47Tyz8JHYJFS8E",
  authDomain: "cambus-crdi-iuget-001.firebaseapp.com",
  projectId: "cambus-crdi-iuget-001",
  storageBucket: "cambus-crdi-iuget-001.firebasestorage.app",
  messagingSenderId: "659383756026",
  appId: "1:659383756026:web:9ef0c7e4242bf90922d543"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore using standard getFirestore for broad compatibility
export const db = getFirestore(app);

// Export services for use in the app
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
