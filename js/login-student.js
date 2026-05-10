import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
// Grab the error elements
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevents the page from refreshing

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Hide any previous errors when they click submit again
  errorMessage.style.display = "none";

  // Change button text to show it's loading
  const originalBtnText = loginBtn.innerText;
  loginBtn.innerText = "Signing in...";
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

      // 3. Verify they are a student
      if (userData.role === "student" || userData.role === "admin") {
        // We let admins in here too, just in case, but they will be routed to the live feed
        window.location.href = "live-feed.html";
      } else {
        // Inline Error instead of alert
        errorText.innerText = "Account role not recognized.";
        errorMessage.style.display = "flex";
        await auth.signOut();
      }
    } else {
      // Inline Error instead of alert
      errorText.innerText = "User profile not found in database.";
      errorMessage.style.display = "flex";
      await auth.signOut();
    }
  } catch (error) {
    console.error("Login Error:", error);

    // Make Firebase errors readable for users
    if (error.code === "auth/invalid-credential") {
      errorText.innerText = "Incorrect email or password.";
    } else if (error.code === "auth/too-many-requests") {
      errorText.innerText = "Too many failed attempts. Try again later.";
    } else {
      errorText.innerText = "Error logging in. Please try again.";
    }

    // Display the red error box
    errorMessage.style.display = "flex";
  } finally {
    // Reset button
    loginBtn.innerText = originalBtnText;
    loginBtn.disabled = false;
  }
});
