import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const container = document.getElementById("savedEventsContainer");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");

// 1. AUTH & SIDEBAR LOGIC
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "welcome-page.html";
    return;
  }

  // Handle Initials & Admin Button
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

// 2. SIDEBAR TOGGLES
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

// 3. SEARCH & DISPLAY (Placeholder Data for now)
let mySavedEvents = JSON.parse(localStorage.getItem("savedEvents")) || [];

function renderEvents(list) {
  container.innerHTML = "";
  if (list.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  list.forEach((ev, i) => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.style.animationDelay = `${i * 0.1}s`;
    card.innerHTML = `
      <div class="event-left">
        <div class="event-image"><img src="${ev.image}"></div>
        <div class="event-details">
          <h3>${ev.title}</h3>
          <div class="event-meta">
            <span><i class="fa-regular fa-calendar"></i> ${ev.date}</span>
            <span><i class="fa-regular fa-clock"></i> ${ev.time}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${ev.location}</span>
          </div>
        </div>
      </div>
      <button class="unsave-btn" data-id="${ev.id}">Unsave</button>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll(".unsave-btn").forEach((btn) => {
    btn.onclick = () => {
      mySavedEvents = mySavedEvents.filter((e) => e.id != btn.dataset.id);
      localStorage.setItem("savedEvents", JSON.stringify(mySavedEvents));
      renderEvents(mySavedEvents);
    };
  });
}

searchInput.oninput = (e) => {
  const val = e.target.value.toLowerCase();
  renderEvents(
    mySavedEvents.filter((ev) => ev.title.toLowerCase().includes(val)),
  );
};

renderEvents(mySavedEvents);
