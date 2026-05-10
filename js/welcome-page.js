// 1. Import Firebase tools and your database connection
import { auth, db } from "./firebase-config.js";
import {
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// 2. Grab the buttons from your HTML
const googleLoginBtn = document.getElementById("googleLoginBtn");
const studentLoginBtn = document.getElementById("studentLoginBtn");
const adminLoginBtn = document.getElementById("adminLoginBtn");

// 3. Set up the Google Login Provider
const provider = new GoogleAuthProvider();

// ==========================================
// GOOGLE SIGN-IN LOGIC
// ==========================================
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    try {
      // This triggers the Google Popup!
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("Success! Logged in as:", user.displayName);

      // Check if this user is already saved in our database
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // If they are new, save their profile to Firestore as a "student"
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: "student", // Automatically makes them a student
          createdAt: new Date(),
        });
        console.log("Saved new student to database!");
      }

      // Redirect them to the Live Feed! (Make sure this matches your file name)
      window.location.href = "live-feed.html";
    } catch (error) {
      console.error("Google Sign-In Error: ", error);
      alert("Could not log in with Google. Please try again.");
    }
  });
}

// ==========================================
// EMAIL & PASSWORD ROUTING
// ==========================================
if (studentLoginBtn) {
  studentLoginBtn.addEventListener("click", () => {
    // Redirects to a future login page we will build
    window.location.href = "login-student.html";
  });
}

if (adminLoginBtn) {
  adminLoginBtn.addEventListener("click", () => {
    // Redirects to a future login page we will build
    window.location.href = "login-admin.html";
  });
}
