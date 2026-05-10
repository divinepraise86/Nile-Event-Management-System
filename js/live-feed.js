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
  deleteDoc,
  updateDoc, // NEW: For updating the user's saved events in the cloud
  arrayUnion, // NEW: Adds an ID to the Firebase array
  arrayRemove, // NEW: Removes an ID from the Firebase array
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const eventsContainer = document.getElementById("eventsContainer");
const profileCircle = document.getElementById("profileInitials");
const adminCreateEventBtn = document.getElementById("adminCreateEventBtn");

// GLOBAL STATE
let allLoadedEvents = [];
let currentSearchTerm = "";
let currentTimeFilter = "All";
let currentCategoryFilter = "All";
let currentUserRole = "user";
let currentUserId = null;
let eventToDeleteId = null;
let userSavedEventIds = []; // NEW: Tracks the user's cloud bookmarks

// ==========================================
// 1. FIREBASE AUTH & ROLE LOGIC
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserId = user.uid; // Store the ID for cloud saving
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        currentUserRole = userData.role;

        // Load their saved events from the cloud (Default to empty array if none)
        userSavedEventIds = userData.savedEvents || [];

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

        if (adminCreateEventBtn) {
          if (currentUserRole === "admin") {
            adminCreateEventBtn.style.display = "flex";
          } else {
            adminCreateEventBtn.style.display = "none";
          }
        }

        // Fetch events ONLY after we know their role and cloud bookmarks
        fetchAndDisplayEvents();
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    window.location.href = "welcome-page.html";
  }
});

// ==========================================
// 2. UI INTERACTIONS & FILTER ENGINE
// ==========================================
const currentPage = window.location.pathname.split("/").pop();
const menuLinks = document.querySelectorAll(".menu-item, .logout-btn");

menuLinks.forEach((link) => {
  const href = link.getAttribute("href");
  if (href === currentPage) {
    link.classList.add("active");
  }
});

const searchInput = document.querySelector(".search-box input");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearchTerm = e.target.value.toLowerCase();
    applyFilters();
  });
}

const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    currentTimeFilter = e.target.textContent.trim();
    applyFilters();
  });
});

const categoryToggle = document.getElementById("categoryToggle");
const categoryMenu = document.getElementById("categoryMenu");

if (categoryToggle && categoryMenu) {
  categoryMenu.insertAdjacentHTML(
    "afterbegin",
    `<div class="category-item">All Categories</div>`,
  );

  categoryToggle.addEventListener("click", () => {
    categoryMenu.classList.toggle("show");
  });

  const categoryItems = document.querySelectorAll(".category-item");
  categoryItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      const selectedCategory = e.target.textContent.trim();

      if (selectedCategory === "All Categories") {
        currentCategoryFilter = "All";
        categoryToggle.innerHTML = `Category <i class="fa-solid fa-chevron-down"></i>`;
        categoryToggle.classList.remove("active");
      } else {
        currentCategoryFilter = selectedCategory;
        categoryToggle.innerHTML = `${selectedCategory} <i class="fa-solid fa-chevron-down"></i>`;
        categoryToggle.classList.add("active");
      }

      categoryMenu.classList.remove("show");
      applyFilters();
    });
  });

  window.addEventListener("click", (e) => {
    if (!e.target.closest(".category-dropdown")) {
      categoryMenu.classList.remove("show");
    }
  });
}

// --- View Toggle (Grid vs List) ---
const gridViewBtn = document.getElementById("gridViewBtn");
const listViewBtn = document.getElementById("listViewBtn");

if (gridViewBtn && listViewBtn && eventsContainer) {
  gridViewBtn.addEventListener("click", () => {
    eventsContainer.classList.remove("list-view");
    gridViewBtn.classList.add("active");
    listViewBtn.classList.remove("active");
  });

  listViewBtn.addEventListener("click", () => {
    eventsContainer.classList.add("list-view");
    listViewBtn.classList.add("active");
    gridViewBtn.classList.remove("active");
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
// 3. FIREBASE & FILTER LOGIC
// ==========================================

async function fetchAndDisplayEvents() {
  if (!eventsContainer) return;
  eventsContainer.innerHTML =
    "<p style='grid-column: 1/-1; text-align: center; color: #6b7280;'>Loading events...</p>";

  try {
    const eventsQuery = query(
      collection(db, "events"),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(eventsQuery);
    const eventList = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      eventList.push({
        id: doc.id,
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

    if (eventList.length === 0) {
      eventsContainer.innerHTML =
        "<p style='grid-column: 1/-1; text-align: center; color: #6b7280;'>No events found. Create one!</p>";
      return;
    }

    allLoadedEvents = eventList;
    applyFilters();
  } catch (error) {
    console.error("Error fetching events: ", error);
    eventsContainer.innerHTML =
      "<p style='grid-column: 1/-1; text-align: center; color: #dc2626;'>Error loading events. Please refresh the page.</p>";
  }
}

function applyFilters() {
  let filteredList = allLoadedEvents;

  if (currentSearchTerm) {
    filteredList = filteredList.filter(
      (ev) =>
        (ev.title && ev.title.toLowerCase().includes(currentSearchTerm)) ||
        (ev.description &&
          ev.description.toLowerCase().includes(currentSearchTerm)) ||
        (ev.category && ev.category.toLowerCase().includes(currentSearchTerm)),
    );
  }

  if (currentCategoryFilter !== "All") {
    filteredList = filteredList.filter(
      (ev) =>
        ev.category &&
        ev.category.toLowerCase() === currentCategoryFilter.toLowerCase(),
    );
  }

  if (currentTimeFilter !== "All") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredList = filteredList.filter((ev) => {
      if (!ev.date) return false;
      const evDate = new Date(ev.date);

      if (currentTimeFilter === "Today") {
        return evDate.toDateString() === today.toDateString();
      } else if (currentTimeFilter === "This Week") {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return evDate >= today && evDate <= nextWeek;
      } else if (currentTimeFilter === "This Month") {
        return (
          evDate.getMonth() === today.getMonth() &&
          evDate.getFullYear() === today.getFullYear()
        );
      }
      return true;
    });
  }

  displayEvents(filteredList);
}

function displayEvents(eventList) {
  eventsContainer.innerHTML = "";

  if (eventList.length === 0) {
    eventsContainer.innerHTML =
      "<p style='grid-column: 1/-1; text-align: center; color: #6b7280; padding: 40px;'>No events match your current filters.</p>";
    return;
  }

  // Get today's date for the Hosted Badge comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  eventList.forEach((event, index) => {
    const eventCard = document.createElement("div");
    eventCard.classList.add("event-card");
    eventCard.style.animationDelay = `${index * 0.08}s`;

    // NEW: Check Cloud ID array instead of localStorage
    const isSaved = userSavedEventIds.includes(event.id);
    const btnClass = isSaved
      ? "bookmark-btn save-btn saved"
      : "bookmark-btn save-btn";
    const iconClass = isSaved
      ? "fa-solid fa-bookmark"
      : "fa-regular fa-bookmark";

    // Admin Delete Button HTML
    const deleteBtnHTML =
      currentUserRole === "admin"
        ? `<button class="delete-event-btn" data-id="${event.id}" title="Delete Event"><i class="fa-solid fa-trash"></i></button>`
        : ``;

    // Past Event / Hosted Badge Logic
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    const isHosted = eventDate < today;

    const hostedBadgeHTML = isHosted
      ? `<div class="hosted-badge">Event Hosted</div>`
      : ``;

    // Only show Register button if a link exists AND the event hasn't passed
    const registerBtnHTML =
      event.registrationLink && !isHosted
        ? `<a href="${event.registrationLink}" target="_blank" class="register-btn-link"><button class="register-btn">Register</button></a>`
        : ``;

    eventCard.innerHTML = `
      <div class="event-card-link" data-id="${event.id}" style="cursor: pointer;">
        <div class="card-image">
          <img src="${event.image}" alt="${event.title}">
          <div class="event-badge">${event.category || "Event"}</div>
          
          ${hostedBadgeHTML} 
          ${deleteBtnHTML} 

          <button class="${btnClass}">
            <i class="${iconClass}"></i>
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
          <p class="event-description">${event.description}</p>
          <div class="card-footer">
            ${registerBtnHTML}
          </div>
        </div>
      </div>
    `;

    eventsContainer.appendChild(eventCard);
  });

  // Handle Event Card Clicks (Details Routing)
  const clickableCards = document.querySelectorAll(".event-card-link");
  clickableCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (
        e.target.closest(".save-btn") ||
        e.target.closest(".register-btn-link") ||
        e.target.closest(".delete-event-btn")
      ) {
        return;
      }
      const eventId = card.dataset.id;
      window.location.href = `event-details.html?id=${eventId}`;
    });
  });

  // Handle Admin Delete Clicks (Trigger Modal)
  const deleteBtns = document.querySelectorAll(".delete-event-btn");
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      eventToDeleteId = btn.dataset.id;
      document.getElementById("deleteModalOverlay").classList.add("show");
    });
  });
}

// ==========================================
// 4. CLOUD SAVE & TOAST NOTIFICATION LOGIC
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

document.addEventListener("click", async function (e) {
  const saveBtn = e.target.closest(".save-btn");
  if (!saveBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const cardLink = saveBtn.closest(".event-card-link");
  const eventId = cardLink.dataset.id;
  const icon = saveBtn.querySelector("i");

  if (!currentUserId) return; // Failsafe if user isn't fully loaded
  const userRef = doc(db, "users", currentUserId);

  const isSaved = userSavedEventIds.includes(eventId);

  if (isSaved) {
    // Optimistic UI update
    userSavedEventIds = userSavedEventIds.filter((id) => id !== eventId);
    saveBtn.classList.remove("saved");
    icon.classList.remove("fa-solid");
    icon.classList.add("fa-regular");
    showToast("Event Removed");

    // Background Firestore Update
    try {
      await updateDoc(userRef, { savedEvents: arrayRemove(eventId) });
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  } else {
    // Optimistic UI update
    userSavedEventIds.push(eventId);
    saveBtn.classList.add("saved");
    icon.classList.remove("fa-regular");
    icon.classList.add("fa-solid");
    showToast("Event Saved");

    // Background Firestore Update
    try {
      await updateDoc(userRef, { savedEvents: arrayUnion(eventId) });
    } catch (error) {
      console.error("Error saving bookmark:", error);
    }
  }
});

// ==========================================
// 5. CUSTOM DELETE MODAL LOGIC
// ==========================================
const deleteModal = document.getElementById("deleteModalOverlay");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.classList.remove("show");
    eventToDeleteId = null;
  });
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", async () => {
    if (!eventToDeleteId) return;

    try {
      // 1. Delete from Firestore completely
      await deleteDoc(doc(db, "events", eventToDeleteId));
      showToast("Event permanently deleted");

      // 2. Remove from Local Array
      allLoadedEvents = allLoadedEvents.filter(
        (ev) => ev.id !== eventToDeleteId,
      );

      // 3. Close modal and repaint screen
      deleteModal.classList.remove("show");
      eventToDeleteId = null;
      applyFilters();
    } catch (error) {
      console.error("Error deleting event:", error);
      showToast("Error deleting event.");
      deleteModal.classList.remove("show");
    }
  });
}
