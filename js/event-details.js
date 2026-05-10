import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const eventDetailCard = document.getElementById("eventDetailCard");
const loadingState = document.getElementById("loadingState");
const saveBtn = document.getElementById("saveBtn");
const reminderBtn = document.getElementById("reminderBtn");
const saveToast = document.getElementById("saveToast");
const toastText = document.getElementById("toastText");

let currentEventData = null;
let currentUserId = null;
let userSavedEventIds = [];

// ==========================================
// 1. AUTH & SIDEBAR LOGIC
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "welcome-page.html";
    return;
  }

  currentUserId = user.uid;

  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (userSnap.exists()) {
    const data = userSnap.data();

    // Load their cloud bookmarks
    userSavedEventIds = data.savedEvents || [];

    document.getElementById("profileInitials").textContent = data.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    if (data.role === "admin") {
      document.getElementById("adminCreateEventBtn").style.display = "flex";
    }
  }

  // Fetch the event ONLY after we know who the user is and what they've saved
  loadEventFromFirebase();
});

document.getElementById("mobileMenuBtn").onclick = () => {
  sidebar.classList.add("show");
  overlay.classList.add("show");
};

const closeSidebar = () => {
  sidebar.classList.remove("show");
  overlay.classList.remove("show");
};

document.getElementById("closeSidebarBtn").onclick = closeSidebar;
overlay.onclick = closeSidebar;

document.getElementById("logoutBtn").onclick = async () => {
  await signOut(auth);
  window.location.href = "welcome-page.html";
};

// ==========================================
// 2. FETCH REAL FIREBASE DATA
// ==========================================
async function loadEventFromFirebase() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  if (!eventId) {
    loadingState.innerHTML = "No event ID provided in the URL.";
    return;
  }

  try {
    const docRef = doc(db, "events", eventId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      currentEventData = { id: docSnap.id, ...docSnap.data() };
      populateUI(currentEventData);
      loadingState.style.display = "none";
      eventDetailCard.style.display = "grid";
    } else {
      loadingState.innerHTML = "Event not found. It may have been deleted.";
    }
  } catch (error) {
    console.error("Error fetching event:", error);
    loadingState.innerHTML = "Error loading event details.";
  }
}

function populateUI(data) {
  document.getElementById("eventTitle").textContent = data.title;
  document.getElementById("eventPoster").src = data.image;
  document.getElementById("eventDate").textContent = data.date;
  document.getElementById("eventTime").textContent = data.time;
  document.getElementById("eventVenue").textContent = data.location;
  document.getElementById("eventDescription").textContent = data.description;
  document.getElementById("eventCategory").textContent =
    data.category || "Event";

  // 🚦 PAST EVENT / HOSTED BADGE LOGIC
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(data.date);
  eventDate.setHours(0, 0, 0, 0);

  const isHosted = eventDate < today;
  const hostedBadgeContainer = document.getElementById("hostedBadgeContainer");
  const regBtn = document.getElementById("registerBtn");

  if (isHosted) {
    hostedBadgeContainer.innerHTML = `<div class="hosted-badge">Event Hosted</div>`;
    regBtn.style.display = "none";
  } else {
    hostedBadgeContainer.innerHTML = "";
    if (data.registrationLink) {
      regBtn.href = data.registrationLink;
      regBtn.style.display = "flex";
    } else {
      regBtn.style.display = "none";
    }
  }

  // Update button based on Cloud Data
  updateSaveButtonUI();
}

// ==========================================
// 3. ACTIONS & TOAST
// ==========================================
function showToast(msg) {
  toastText.textContent = msg;
  saveToast.classList.add("show");
  setTimeout(() => saveToast.classList.remove("show"), 2500);
}

function updateSaveButtonUI() {
  if (!currentEventData) return;

  const isSaved = userSavedEventIds.includes(currentEventData.id);
  const icon = saveBtn.querySelector("i");

  if (isSaved) {
    saveBtn.classList.add("saved");
    icon.classList.replace("fa-regular", "fa-solid");
  } else {
    saveBtn.classList.remove("saved");
    icon.classList.replace("fa-solid", "fa-regular");
  }
}

saveBtn.onclick = async () => {
  if (!currentEventData || !currentUserId) return;

  const isSaved = userSavedEventIds.includes(currentEventData.id);
  const userRef = doc(db, "users", currentUserId);

  // Optimistic UI Update
  if (isSaved) {
    userSavedEventIds = userSavedEventIds.filter(
      (id) => id !== currentEventData.id,
    );
    showToast("Event removed");
    updateSaveButtonUI();
    // Background Firestore Update
    await updateDoc(userRef, { savedEvents: arrayRemove(currentEventData.id) });
  } else {
    userSavedEventIds.push(currentEventData.id);
    showToast("Event saved");
    updateSaveButtonUI();
    // Background Firestore Update
    await updateDoc(userRef, { savedEvents: arrayUnion(currentEventData.id) });
  }
};

reminderBtn.onclick = () => {
  if (!currentEventData) return;
  const title = encodeURIComponent(currentEventData.title);
  const details = encodeURIComponent(currentEventData.description);
  const location = encodeURIComponent(currentEventData.location);
  const dateStr = currentEventData.date.replace(/-/g, "");
  const link = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateStr}T120000Z/${dateStr}T130000Z`;

  window.open(link, "_blank");
  showToast("Opening Calendar...");
};
