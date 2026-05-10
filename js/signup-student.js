import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const signupForm = document.getElementById("signupForm");
const signupBtn = document.getElementById("signupBtn");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const originalBtnText = signupBtn.innerText;
  signupBtn.innerText = "Creating Account...";
  signupBtn.disabled = true;

  try {
    // 1. Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // 2. Save their profile to the Firestore Database
    // This is where we strictly assign the "student" role
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: fullName,
      email: user.email,
      role: "student", // Officially registered as a student
      createdAt: new Date(),
    });

    console.log("Student account created successfully!");

    // 3. Send them to the Live Feed!
    window.location.href = "live-feed.html";
  } catch (error) {
    console.error("Signup Error:", error);

    if (error.code === "auth/email-already-in-use") {
      alert("An account with this email already exists. Try logging in.");
    } else if (error.code === "auth/weak-password") {
      alert("Password is too weak. Please use at least 6 characters.");
    } else {
      alert("Error creating account: " + error.message);
    }
  } finally {
    signupBtn.innerText = originalBtnText;
    signupBtn.disabled = false;
  }
});
