import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Stops the page from refreshing

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Hide previous errors
    if (errorMessage) errorMessage.style.display = "none";

    const originalBtnText = loginBtn.innerText;
    loginBtn.innerText = "Authenticating...";
    loginBtn.disabled = true;

    try {
      // 1. Log the user in via Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // 2. Fetch their role from the Firestore database
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // 3. STRICT SECURITY CHECK: Are they actually an Admin?
        if (userData.role === "admin") {
          // Success! Send them to the Live Feed (where the Create Event button will now appear)
          window.location.href = "live-feed.html";
        } else {
          // If a student tries to log in here, kick them out
          if (errorText)
            errorText.innerText =
              "Access Denied: This portal is restricted to Administrators.";
          if (errorMessage) errorMessage.style.display = "flex";
          await auth.signOut(); // Force log them out
        }
      } else {
        if (errorText)
          errorText.innerText = "User profile not found in database.";
        if (errorMessage) errorMessage.style.display = "flex";
        await auth.signOut();
      }
    } catch (error) {
      console.error("Admin Login Error:", error);

      // Handle Firebase Auth errors cleanly
      if (errorText) {
        if (error.code === "auth/invalid-credential") {
          errorText.innerText = "Incorrect email or password.";
        } else if (error.code === "auth/too-many-requests") {
          errorText.innerText = "Too many failed attempts. Try again later.";
        } else {
          errorText.innerText = "Error logging in. Please try again.";
        }
      }
      if (errorMessage) errorMessage.style.display = "flex";
    } finally {
      // Reset button
      loginBtn.innerText = originalBtnText;
      loginBtn.disabled = false;
    }
  });
} else {
  console.error("Could not find the login form. Check your HTML IDs!");
}
