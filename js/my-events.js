import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const container = document.getElementById("savedEventsContainer");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");

let mySavedEvents = [];
let currentUserId = null;

// ==========================================
// 1. AUTH & SIDEBAR LOGIC
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "welcome-page.html";
    return;
  }
  currentUserId = user.uid;

  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      document.getElementById("profileInitials").textContent = data.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      if (data.role === "admin") {
        document.getElementById("adminCreateEventBtn").style.display = "flex";
      }

      // Fetch the array of Cloud IDs
      const savedIds = data.savedEvents || [];
      fetchSavedEventsData(savedIds);
    }
  } catch (error) {
    console.error("Error loading profile:", error);
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

// ==========================================
// 2. FETCH CLOUD DATA & RENDER
// ==========================================
async function fetchSavedEventsData(savedIds) {
  if (savedIds.length === 0) {
    container.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  container.innerHTML =
    "<p style='text-align: center; color: #6b7280; width: 100%;'>Loading your bookmarks from the cloud...</p>";
  mySavedEvents = [];

  // Loop through IDs and fetch the actual event data
  for (const id of savedIds) {
    const eventSnap = await getDoc(doc(db, "events", id));
    if (eventSnap.exists()) {
      mySavedEvents.push({ id: eventSnap.id, ...eventSnap.data() });
    } else {
      // Clean up orphaned IDs if an admin deleted the event entirely
      await updateDoc(doc(db, "users", currentUserId), {
        savedEvents: arrayRemove(id),
      });
    }
  }

  renderEvents(mySavedEvents);
}

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
    card.style.cursor = "pointer";
    card.dataset.id = ev.id;

    card.innerHTML = `
      <div class="event-left">
        <div class="event-image"><img src="${ev.image}" alt="${ev.title}"></div>
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

  // Handle Cloud Unsaving
  document.querySelectorAll(".unsave-btn").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const eventId = btn.dataset.id;

      // Remove from UI instantly
      mySavedEvents = mySavedEvents.filter((ev) => ev.id !== eventId);
      renderEvents(mySavedEvents);

      // Remove from Cloud
      try {
        await updateDoc(doc(db, "users", currentUserId), {
          savedEvents: arrayRemove(eventId),
        });
      } catch (error) {
        console.error("Failed to unsave:", error);
      }
    };
  });

  // Handle Routing to Details
  document.querySelectorAll(".event-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".unsave-btn")) return;
      window.location.href = `event-details.html?id=${card.dataset.id}`;
    });
  });
}

// Handle Search Filter
if (searchInput) {
  searchInput.oninput = (e) => {
    const val = e.target.value.toLowerCase();
    renderEvents(
      mySavedEvents.filter((ev) => ev.title.toLowerCase().includes(val)),
    );
  };
}
