const eventsContainer = document.getElementById("eventsContainer");

// USER DATA
// Replace with Firebase Auth user data later
const currentUser = {
  firstName: "Joan",
  lastName: "Azike",
};

// PROFILE INITIALS
const profileCircle = document.getElementById("profileInitials");

const initials = `${currentUser.firstName[0]}${currentUser.lastName[0]}`;

profileCircle.textContent = initials.toUpperCase();

// ACTIVE SIDEBAR BUTTONS
const currentPage = window.location.pathname.split("/").pop();

const menuLinks = document.querySelectorAll(".menu-item, .logout-btn");

menuLinks.forEach((link) => {
  const href = link.getAttribute("href");

  if (href === currentPage) {
    link.classList.add("active");
  }
});

// FILTER BUTTON ACTIVE STATES
const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");
  });
});

// CATEGORY DROPDOWN
const categoryToggle = document.getElementById("categoryToggle");
const categoryMenu = document.getElementById("categoryMenu");

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

// MOBILE SIDEBAR
const sidebar = document.getElementById("sidebar");

const sidebarOverlay = document.getElementById("sidebarOverlay");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");

const closeSidebarBtn = document.getElementById("closeSidebarBtn");

mobileMenuBtn.addEventListener("click", () => {
  sidebar.classList.add("show");
  sidebarOverlay.classList.add("show");
});

closeSidebarBtn.addEventListener("click", closeSidebar);

sidebarOverlay.addEventListener("click", closeSidebar);

function closeSidebar() {
  sidebar.classList.remove("show");
  sidebarOverlay.classList.remove("show");
}

// LOGOUT BUTTON
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();

  // Redirect to browser home page
  window.location.href = "welcome-page.html";
});

// SAMPLE EVENTS
// Replace with Firebase later
const events = [
  {
    id: 1,
    title: "Tech Innovation Workshop",
    date: "May 20, 2026",
    time: "10:00 AM",
    location: "Room A1, Engineering Building",
    description:
      "Gain hands-on experience with emerging tech and innovative tools shaping the future.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    category: "On Campus",
    registrationLink: "https://example.com/register",
  },

  {
    id: 2,
    title: "Music Night",
    date: "May 25, 2026",
    time: "6:00 PM",
    location: "Main Auditorium",
    description:
      "An evening of live performances by university music clubs and special guests.",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop",
    category: "Auditorium",
    registrationLink: "",
  },

  {
    id: 3,
    title: "Online Career Seminar",
    date: "June 5, 2026",
    time: "4:00 PM",
    location: "Microsoft Teams",
    description:
      "Explore career opportunities, CV tips, and alumni success stories.",
    image:
      "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?q=80&w=1200&auto=format&fit=crop",
    category: "Online",
    registrationLink: "https://example.com/join",
  },
];

// DISPLAY EVENTS
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

// LOAD EVENTS
displayEvents(events);

// SAVE BUTTON TOGGLE
// SAVE TOAST

const saveToast = document.getElementById("saveToast");

const toastText = document.getElementById("toastText");

let toastTimeout;

function showToast(message) {
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

/*
===================================================
FIREBASE EVENT STRUCTURE
===================================================

{
  id: 1,
  title: 'Tech Innovation Workshop',
  date: 'May 20, 2026',
  time: '10:00 AM',
  location: 'Room A1, Engineering Building',
  description: 'Event description',
  image: 'image-url',
  category: 'Tech',
  registrationLink: 'https://registration-link.com'
}

===================================================
*/
