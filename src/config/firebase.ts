// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARorEHQf-sSIff90FXUUuAj-HnTO5hMLQ",
  authDomain: "pakkadrop-4268c.firebaseapp.com",
  projectId: "pakkadrop-4268c",
  storageBucket: "pakkadrop-4268c.firebasestorage.app",
  messagingSenderId: "342688855692",
  appId: "1:342688855692:web:8c1329908e11edd82aada9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;