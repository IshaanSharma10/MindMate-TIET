// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZwXsV1Qy0AUOFIUMXUJCTQwk5Yegp3TE",
  authDomain: "mindmate-61425.firebaseapp.com",
  projectId: "mindmate-61425",
  storageBucket: "mindmate-61425.firebasestorage.app",
  messagingSenderId: "852614692807",
  appId: "1:852614692807:web:a64f5fac5cfef4123f63e2",
  measurementId: "G-P7K303K1B4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };