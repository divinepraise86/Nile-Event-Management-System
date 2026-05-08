// my-events.js

const savedEventsContainer =
document.getElementById("savedEventsContainer");

const emptyState =
document.getElementById("emptyState");

const searchInput =
document.getElementById("searchInput");

/*
====================================================
DEMO EVENTS

These demo events are temporary until Firebase
backend is connected.

Once Firebase is connected:

1. User toggles save icon on live feed
2. Event data is stored in Firebase
3. My Events fetches saved events from Firebase
4. Event image + info automatically appear here
5. Event removed from my events when user untoggles save icon on live feed

The image below represents the same image
coming from the live feed event card.
====================================================
*/

const demoEvents = [

  {
    id:1,

    title:"Orbit Music Festival",

    date:"May 28, 2026",

    time:"7:00 PM",

    location:"Abuja Continental Arena",

    image:
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop"
  },

  {
    id:2,

    title:"Tech Innovators Summit",

    date:"June 4, 2026",

    time:"11:30 AM",

    location:"Civic Innovation Hub",

    image:
    "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop"
  },

  {
    id:3,

    title:"Fashion & Culture Expo",

    date:"June 12, 2026",

    time:"5:00 PM",

    location:"Transcorp Hilton",

    image:
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop"
  }
];

/*
====================================================
TEMPORARY STORAGE

If localStorage is empty,
inject demo events automatically.
====================================================
*/

if(!localStorage.getItem("savedEvents")){

  localStorage.setItem(
    "savedEvents",
    JSON.stringify(demoEvents)
  );
}

/* GET SAVED EVENTS */

let savedEvents =
JSON.parse(localStorage.getItem("savedEvents")) || [];


/* DISPLAY EVENTS */

function displaySavedEvents(events){

  savedEventsContainer.innerHTML = "";

  /* EMPTY STATE */

  if(events.length === 0){

    emptyState.style.display = "block";

    return;
  }

  emptyState.style.display = "none";

  /* CREATE EVENT CARDS */

  events.forEach((event,index) => {

    const eventCard =
    document.createElement("div");

    eventCard.classList.add("event-card");

    /* STAGGER ANIMATION */

    eventCard.style.animationDelay =
    `${index * 0.08}s`;

    eventCard.innerHTML = `

      <div class="event-left">

        <!-- EVENT IMAGE -->
        <div class="event-image">

          <!--
          FUTURE FIREBASE LINKAGE:

          src="${event.image}"

          Image will come directly from the
          live feed event card database.
          -->

          <img src="${event.image}" alt="${event.title}">

        </div>

        <!-- EVENT DETAILS -->

        <div class="event-details">

          <h3>${event.title}</h3>

          <div class="event-meta">

            <span>
              <i class="fa-regular fa-calendar"></i>
              ${event.date}
            </span>

            <span>
              <i class="fa-regular fa-clock"></i>
              ${event.time}
            </span>

            <span>
              <i class="fa-solid fa-location-dot"></i>
              ${event.location}
            </span>

          </div>

        </div>

      </div>

      <!-- UNSAVE -->

      <button
        class="unsave-btn"
        data-id="${event.id}"
      >
        Unsave
      </button>
    `;

    savedEventsContainer.appendChild(eventCard);
  });

  /* UNSAVE LOGIC */

  const unsaveButtons =
  document.querySelectorAll(".unsave-btn");

  unsaveButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const eventId =
      Number(button.dataset.id);

      /* REMOVE EVENT */

      savedEvents =
      savedEvents.filter(
        (event) => event.id !== eventId
      );

      /* UPDATE STORAGE */

      localStorage.setItem(
        "savedEvents",
        JSON.stringify(savedEvents)
      );

      /* REFRESH UI */

      displaySavedEvents(savedEvents);
      
      /*Run 'localStorage.removeItem("savedEvents");' in browser developer console
      to display unsaved event cards again for testing purposes*/

    });
  });
}

/* SEARCH */

searchInput.addEventListener("input", (e) => {

  const value =
  e.target.value.toLowerCase();

  const filteredEvents =
  savedEvents.filter((event) =>

    event.title
    .toLowerCase()
    .includes(value)
  );

  displaySavedEvents(filteredEvents);
});

/* INITIAL RENDER */

displaySavedEvents(savedEvents);

/*
====================================================
FUTURE FIREBASE STRUCTURE IDEA

Example:

const event = {

  id: doc.id,
  title: data.title,
  image: data.image,
  date: data.date,
  time: data.time,
  location: data.location
}

====================================================
*/