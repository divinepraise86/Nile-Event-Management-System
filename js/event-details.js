import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// 1. AUTH & SIDEBAR LOGIC
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "welcome-page.html";
    return;
  }
  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (userSnap.exists()) {
    const data = userSnap.data();
    document.getElementById("profileInitials").textContent = data.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    if (data.role === "admin")
      document.getElementById("adminCreateEventBtn").style.display = "flex";
  }
});

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");

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

// 2. FETCH REAL FIREBASE DATA
const eventDetailCard = document.getElementById("eventDetailCard");
const loadingState = document.getElementById("loadingState");
let currentEventData = null;

async function loadEventFromFirebase() {
  // Get the ID from the URL (e.g., event-details.html?id=xyz123)
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

  const regBtn = document.getElementById("registerBtn");
  if (data.registrationLink) {
    regBtn.href = data.registrationLink;
    regBtn.style.display = "flex";
  } else {
    regBtn.style.display = "none";
  }

  // Check if saved in localStorage (Temporary until Real Bookmarking)
  updateSaveButtonUI();
}

// 3. ACTIONS & TOAST
const saveBtn = document.getElementById("saveBtn");
const reminderBtn = document.getElementById("reminderBtn");
const saveToast = document.getElementById("saveToast");
const toastText = document.getElementById("toastText");

function showToast(msg) {
  toastText.textContent = msg;
  saveToast.classList.add("show");
  setTimeout(() => saveToast.classList.remove("show"), 2500);
}

function updateSaveButtonUI() {
  let savedEvents = JSON.parse(localStorage.getItem("savedEvents")) || [];
  const isSaved = savedEvents.some((e) => e.id === currentEventData.id);
  const icon = saveBtn.querySelector("i");

  if (isSaved) {
    saveBtn.classList.add("saved");
    icon.classList.replace("fa-regular", "fa-solid");
  } else {
    saveBtn.classList.remove("saved");
    icon.classList.replace("fa-solid", "fa-regular");
  }
}

saveBtn.onclick = () => {
  let savedEvents = JSON.parse(localStorage.getItem("savedEvents")) || [];
  const isSaved = savedEvents.some((e) => e.id === currentEventData.id);

  if (isSaved) {
    savedEvents = savedEvents.filter((e) => e.id !== currentEventData.id);
    showToast("Event removed");
  } else {
    // We push the whole object so it works with the temporary My Events setup
    savedEvents.push(currentEventData);
    showToast("Event saved");
  }
  localStorage.setItem("savedEvents", JSON.stringify(savedEvents));
  updateSaveButtonUI();
};

reminderBtn.onclick = () => {
  if (!currentEventData) return;
  // Basic Google Calendar link builder
  const title = encodeURIComponent(currentEventData.title);
  const details = encodeURIComponent(currentEventData.description);
  const location = encodeURIComponent(currentEventData.location);
  const dateStr = currentEventData.date.replace(/-/g, ""); // Crude formatting for demo
  const link = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateStr}T120000Z/${dateStr}T130000Z`;

  window.open(link, "_blank");
  showToast("Opening Calendar...");
};

// Initialize the page
loadEventFromFirebase();
