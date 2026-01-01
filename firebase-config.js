// firebase-config.js - For Realtime Database
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Your Firebase configuration (REPLACE WITH YOUR ACTUAL CONFIG!)
const firebaseConfig = {
  apiKey: "AIzaSyDexePQbIejtgDZvpPbXJ982_CSpql8OoI",           // ← Replace with yours
  authDomain: "planora-86835.firebaseapp.com",  // ← Replace with yours
  projectId: "planora-86835",                  // ← Replace with yours
  storageBucket: "planora-86835.firebasestorage.app",  // ← Replace with yours
  messagingSenderId:"971834924900",          // ← Replace with yours
  appId: "1:971834924900:web:ff3d82595e08839130e471" // ← Replace with yours
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
window.auth = getAuth(app)
window.db = getDatabase(app);  // Using Realtime Database!

// Make available globally
window.auth = auth;
window.db = db;

console.log("Firebase Realtime Database initialized!");
