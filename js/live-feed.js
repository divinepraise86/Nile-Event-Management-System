import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const eventsContainer = document.getElementById("eventsContainer");
const profileCircle = document.getElementById("profileInitials");
const adminCreateEventBtn = document.getElementById("adminCreateEventBtn");

// ==========================================
// 1. FIREBASE AUTH & ROLE LOGIC
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Generate Profile Initials
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

        // Show "Create Event" button ONLY for Admins
        if (adminCreateEventBtn) {
          if (userData.role === "admin") {
            adminCreateEventBtn.style.display = "flex";
          } else {
            adminCreateEventBtn.style.display = "none";
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    window.location.href = "welcome-page.html";
  }
});

// ==========================================
// 2. UI INTERACTIONS (Sidebar, Filters, Logout)
// ==========================================
const currentPage = window.location.pathname.split("/").pop();
const menuLinks = document.querySelectorAll(".menu-item, .logout-btn");

menuLinks.forEach((link) => {
  const href = link.getAttribute("href");
  if (href === currentPage) {
    link.classList.add("active");
  }
});

const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
  });
});

const categoryToggle = document.getElementById("categoryToggle");
const categoryMenu = document.getElementById("categoryMenu");
if (categoryToggle && categoryMenu) {
  categoryToggle.addEventListener("click", () => {
    categoryMenu.classList.toggle("show");
    categoryToggle.classList.toggle("active");
  });
  window.addEventListener("click", (e) => {
    if (!e.target.closest(".category-dropdown")) {
      categoryMenu.classList.remove("show");
      categoryToggle.classList.remove("active");
    }
  });
}

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");

if (mobileMenuBtn && sidebar && sidebarOverlay) {
  mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.add("show");
    sidebarOverlay.classList.add("show");
  });
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("show");
  if (sidebarOverlay) sidebarOverlay.classList.remove("show");
}

if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

const logoutBtn = document.getElementById("logoutBtn");
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

// ==========================================
// 3. FIREBASE: FETCH & DISPLAY EVENTS
// ==========================================

// This replaces the old hardcoded 'const events = [...]' array!
async function fetchAndDisplayEvents() {
  if (!eventsContainer) return;
  eventsContainer.innerHTML =
    "<p style='grid-column: 1/-1; text-align: center; color: #6b7280;'>Loading events...</p>";

  try {
    // Query Firestore to get all events, ordered by newest first
    const eventsQuery = query(
      collection(db, "events"),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(eventsQuery);

    const eventList = [];

    // Loop through the database results and push them to our array
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      eventList.push({
        id: doc.id, // The unique Firestore string ID
        title: data.title,
        date: data.date,
        time: data.time,
        location: data.location,
        description: data.description,
        image: data.image,
        category: data.category,
        registrationLink: data.registrationLink,
      });
    });

    // If the database is empty, tell the user
    if (eventList.length === 0) {
      eventsContainer.innerHTML =
        "<p style='grid-column: 1/-1; text-align: center; color: #6b7280;'>No events found. Create one!</p>";
      return;
    }

    // Pass the real database array into the display function
    displayEvents(eventList);
  } catch (error) {
    console.error("Error fetching events: ", error);
    eventsContainer.innerHTML =
      "<p style='grid-column: 1/-1; text-align: center; color: #dc2626;'>Error loading events. Please refresh the page.</p>";
  }
}

// Your teammate's excellent render function (Untouched!)
function displayEvents(eventList) {
  eventsContainer.innerHTML = "";

  eventList.forEach((event, index) => {
    const eventCard = document.createElement("div");
    eventCard.classList.add("event-card");
    eventCard.style.animationDelay = `${index * 0.08}s`;

    eventCard.innerHTML = `
      <div class="event-card-link" data-id="${event.id}">
        <div class="card-image">
          <img src="${event.image}" alt="${event.title}">
          <div class="event-badge">
            ${event.category}
          </div>
          <button class="bookmark-btn save-btn">
            <i class="fa-regular fa-bookmark"></i>
          </button>
        </div>
        <div class="card-content">
          <h3>${event.title}</h3>
          <div class="event-info">
            <i class="fa-regular fa-calendar"></i>
            <span>${event.date}</span>
            <span>•</span>
            <span>${event.time}</span>
          </div>
          <div class="event-info">
            <i class="fa-solid fa-location-dot"></i>
            <span>${event.location}</span>
          </div>
          <p class="event-description">
            ${event.description}
          </p>
          <div class="card-footer">
            ${
              event.registrationLink
                ? `
                <a
                  href="${event.registrationLink}"
                  target="_blank"
                  class="register-btn-link"
                >
                  <button class="register-btn">
                    Register
                  </button>
                </a>
              `
                : ""
            }
          </div>
        </div>
      </div>
    `;

    eventsContainer.appendChild(eventCard);
  });

  // EVENT CARD CLICK
  const clickableCards = document.querySelectorAll(".event-card-link");
  clickableCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (
        e.target.closest(".save-btn") ||
        e.target.closest(".register-btn-link")
      ) {
        return;
      }
      const eventId = card.dataset.id;
      window.location.href = `event-details.html?id=${eventId}`;
    });
  });
}

// Trigger the database fetch when the page loads!
fetchAndDisplayEvents();

// ==========================================
// 4. SAVE TOAST NOTIFICATION
// ==========================================
const saveToast = document.getElementById("saveToast");
const toastText = document.getElementById("toastText");
let toastTimeout;

function showToast(message) {
  if (!saveToast || !toastText) return;
  toastText.textContent = message;
  saveToast.classList.add("show");
  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    saveToast.classList.remove("show");
  }, 2200);
}

document.addEventListener("click", function (e) {
  const saveBtn = e.target.closest(".save-btn");
  if (!saveBtn) return;

  e.preventDefault();
  e.stopPropagation();

  saveBtn.classList.toggle("saved");
  const icon = saveBtn.querySelector("i");

  if (saveBtn.classList.contains("saved")) {
    icon.classList.remove("fa-regular");
    icon.classList.add("fa-solid");
    showToast("Event Saved");
  } else {
    icon.classList.remove("fa-solid");
    icon.classList.add("fa-regular");
    showToast("Event Removed");
  }
});
