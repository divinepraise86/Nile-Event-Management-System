// 1. Import the core Firebase tools (Using the web CDNs)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// 2. PASTE YOUR KEYS HERE! Replace this whole firebaseConfig object with the one from your screen.
const firebaseConfig = {
  apiKey: "AIzaSyD0igzkCrR89trUFnOlg3fH8mt_0jXPgtM",
  authDomain: "orbit-event-hub.firebaseapp.com",
  projectId: "orbit-event-hub",
  storageBucket: "orbit-event-hub.firebasestorage.app",
  messagingSenderId: "203023070530",
  appId: "1:203023070530:web:2f36ade20f415aa54904db",
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. Export Auth and DB so your other JS files can use them
export const auth = getAuth(app);
export const db = getFirestore(app);
