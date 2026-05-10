import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const signupForm = document.getElementById("signupAdminForm");
const signupBtn = document.getElementById("signupBtn");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const secretKey = document.getElementById("secretKey").value;

  // Hide previous errors
  errorMessage.style.display = "none";

  // 1. Validation: Do passwords match?
  if (password !== confirmPassword) {
    errorText.innerText = "Passwords do not match. Please try again.";
    errorMessage.style.display = "flex";
    return;
  }

  // 2. Validation: Is the secret key correct?
  if (secretKey !== "OrbitKey404") {
    errorText.innerText = "Invalid Admin Secret Key. Access denied.";
    errorMessage.style.display = "flex";
    return;
  }

  const originalBtnText = signupBtn.innerText;
  signupBtn.innerText = "Authorizing...";
  signupBtn.disabled = true;

  try {
    // 3. Attempt to create a brand new account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Save new admin to Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: fullName,
      email: user.email,
      role: "admin",
      createdAt: new Date(),
    });

    window.location.href = "live-feed.html";
  } catch (error) {
    // 4. THE UPGRADE MAGIC: If the email already exists
    if (error.code === "auth/email-already-in-use") {
      try {
        // Force them to log in right now to prove they own the account
        const existingUserCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = existingUserCredential.user;

        // Upgrade their existing Firestore profile to "admin"
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          role: "admin", // Overrides the "student" string
        });

        // Success! They are now an admin.
        window.location.href = "live-feed.html";
      } catch (loginError) {
        // If login fails, they typed the wrong password for the existing account
        errorText.innerText =
          "Account exists, but password is incorrect. Cannot upgrade.";
        errorMessage.style.display = "flex";
        console.error("Upgrade Error:", loginError);
      }
    } else if (error.code === "auth/weak-password") {
      errorText.innerText = "Password must be at least 6 characters.";
      errorMessage.style.display = "flex";
    } else {
      errorText.innerText = "Error: " + error.message;
      errorMessage.style.display = "flex";
    }
  } finally {
    signupBtn.innerText = originalBtnText;
    signupBtn.disabled = false;
  }
});
