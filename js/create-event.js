import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ==========================================
// 1. DASHBOARD AUTH & LOGIC
// ==========================================
const profileCircle = document.getElementById("profileInitials");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Generate Profile Initials dynamically
        const nameParts = userData.name.split(" ");
        let initials = "";
        if (nameParts.length >= 2) {
          initials = `${nameParts[0][0]}${nameParts[1][0]}`;
        } else {
          initials = `${nameParts[0].substring(0, 2)}`;
        }
        if (profileCircle) {
          profileCircle.textContent = initials.toUpperCase();
        }

        // Security Check: Only Admins can view this page
        if (userData.role !== "admin") {
          window.location.href = "live-feed.html";
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  } else {
    window.location.href = "welcome-page.html";
  }
});

// Logout Button Logic
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
      window.location.href = "welcome-page.html";
    }
  });
}

// Mobile Sidebar Toggle
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.add("show");
    sidebarOverlay.classList.add("show");
  });
}

function closeSidebar() {
  sidebar.classList.remove("show");
  sidebarOverlay.classList.remove("show");
}

if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

// ==========================================
// 2. CREATE EVENT UI (File Upload)
// ==========================================
const uploadBox = document.getElementById("uploadBox");
const fileInput = document.getElementById("fileInput");
const uploadText = document.getElementById("uploadText");
const uploadInfo = document.getElementById("uploadInfo");
const uploadIcon = document.getElementById("uploadIcon");
const preview = document.getElementById("preview");

if (uploadBox) {
  uploadBox.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", handleFile);

  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "#ECB730"; // Yellow hover state
  });

  uploadBox.addEventListener("dragleave", () => {
    uploadBox.style.borderColor = "#ddd";
  });

  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "#0047A5";
    const file = e.dataTransfer.files[0];
    handleFile({ target: { files: [file] } });
  });
}

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Only image files are allowed!");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("File is too large (max 5MB)");
    return;
  }

  uploadInfo.textContent = file.name;

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.style.display = "block";
    uploadIcon.style.display = "none";
    uploadText.style.display = "none";
  };
  reader.readAsDataURL(file);
}

// ==========================================
// 3. FIREBASE: PUBLISH EVENT LOGIC (WITH IMGBB)
// ==========================================
const eventForm = document.getElementById("eventForm");
const publishBtn = document.getElementById("publishBtn");
const formMessage = document.getElementById("formMessage");

// PASTE YOUR IMGBB API KEY HERE!
const IMGBB_API_KEY = "0d1624f87c5bf382f4bba1c93fe95da5";

if (eventForm) {
  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Grab all the values from the form inputs
    const title = document.getElementById("eventTitle").value;
    const category = document.getElementById("eventCategory").value;
    const dateInput = document.getElementById("eventDate").value;
    const locationType = document.getElementById("eventLocationType").value;
    const venue = document.getElementById("eventVenue").value;
    const description = document.getElementById("eventDescription").value;
    const link = document.getElementById("eventLink").value;
    const imageFile = document.getElementById("fileInput").files[0]; // Grab the physical file!

    // Ensure they selected an image
    if (!imageFile) {
      formMessage.style.display = "block";
      formMessage.style.color = "#dc2626";
      formMessage.innerText = "Please select a poster image before publishing.";
      return;
    }

    const dateObj = new Date(dateInput);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const originalBtnText = publishBtn.innerText;
    publishBtn.innerText = "Uploading Poster...";
    publishBtn.disabled = true;
    formMessage.style.display = "none";

    try {
      // 2. UPLOAD TO IMGBB FIRST
      const formData = new FormData();
      formData.append("image", imageFile);

      // Send the file to ImgBB's servers
      const imgbbResponse = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        },
      );

      const imgbbData = await imgbbResponse.json();

      // Check if ImgBB upload succeeded
      if (!imgbbData.success) {
        throw new Error("Failed to upload image to ImgBB");
      }

      // Extract the permanent URL ImgBB just created for us!
      const finalImageUrl = imgbbData.data.url;

      publishBtn.innerText = "Saving to Database...";

      // 3. Prepare the data package with the REAL image URL
      const eventData = {
        title: title,
        category: category,
        date: formattedDate,
        time: formattedTime,
        location: venue,
        locationType: locationType,
        description: description,
        registrationLink: link || "",
        image: finalImageUrl, // The real uploaded image!
        createdAt: serverTimestamp(),
        authorId: auth.currentUser.uid,
      };

      // 4. Send it to the "events" collection in Firestore
      await addDoc(collection(db, "events"), eventData);

      // 5. Success UI Feedback
      formMessage.style.display = "block";
      formMessage.style.color = "#059669";
      formMessage.innerText = "Event successfully published to the live feed!";

      eventForm.reset();
      preview.style.display = "none";
      uploadIcon.style.display = "block";
      uploadText.style.display = "block";
      uploadInfo.textContent = "JPG, PNG (Max 5MB)";
    } catch (error) {
      console.error("Publish Error: ", error);
      formMessage.style.display = "block";
      formMessage.style.color = "#dc2626";
      formMessage.innerText =
        "Failed to publish event. Please check your connection.";
    } finally {
      publishBtn.innerText = originalBtnText;
      publishBtn.disabled = false;
    }
  });
}
