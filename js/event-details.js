/*
===================================================
DEMO EVENT DATA
This structure is exactly how your live feed
should pass data into the event detail page.
===================================================
*/

const eventData = {

  id: 1,

  title: "Tech Innovation Workshop",

  poster:
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",

  date: "May 20, 2026",

  startTime: "10:00 AM",

  endTime: "12:00 PM",

  venue: "Room A1, Engineering Building",

  locationType: "On Campus",

  description:
  `Join us for an immersive and interactive workshop exploring the latest innovations in Artificial Intelligence, software engineering, robotics, and startup technology.

Students will engage in hands-on demonstrations, networking sessions, and practical discussions led by experienced industry professionals.

Open to all students. Limited seats available.`,

  registrationLink:
  "https://forms.gle/example",

  googleCalendarEnabled: true
};


/*
===================================================
ELEMENTS
===================================================
*/

const titleEl = document.getElementById("eventTitle");
const posterEl = document.getElementById("eventPoster");
const dateEl = document.getElementById("eventDate");
const timeEl = document.getElementById("eventTime");
const venueEl = document.getElementById("eventVenue");
const descriptionEl = document.getElementById("eventDescription");
const locationBadge = document.getElementById("locationBadge");
const registerBtn = document.getElementById("registerBtn");
const reminderBtn = document.getElementById("reminderBtn");
const saveBtn = document.getElementById("saveBtn");
const toast = document.getElementById("toast");


/*
===================================================
LOAD EVENT DATA INTO PAGE
===================================================
*/

function loadEventDetails(){

  titleEl.textContent = eventData.title;

  posterEl.src = eventData.poster;

  dateEl.textContent = eventData.date;

  timeEl.textContent =
  `${eventData.startTime} - ${eventData.endTime}`;

  venueEl.textContent = eventData.venue;

  descriptionEl.textContent = eventData.description;

  locationBadge.textContent = eventData.locationType;


  // SHOW / HIDE REGISTRATION BUTTON
  if(eventData.registrationLink){

    registerBtn.href = eventData.registrationLink;

  }else{

    registerBtn.style.display = "none";
  }
}

loadEventDetails();


/*
===================================================
SAVE EVENT FEATURE
Synced between feed and detail page using localStorage
===================================================
*/

let savedEvents =
JSON.parse(localStorage.getItem("savedEvents")) || [];


function updateSaveButton(){

  const icon = saveBtn.querySelector("i");

  const isSaved = savedEvents.includes(eventData.id);

  if(isSaved){

    saveBtn.classList.add("saved");

    icon.classList.remove("fa-regular");
    icon.classList.add("fa-solid");

  }else{

    saveBtn.classList.remove("saved");

    icon.classList.remove("fa-solid");
    icon.classList.add("fa-regular");
  }
}

updateSaveButton();


saveBtn.addEventListener("click",()=>{

  const isSaved = savedEvents.includes(eventData.id);


  if(isSaved){

    savedEvents =
    savedEvents.filter(id => id !== eventData.id);

    showToast("Event removed");

  }else{

    savedEvents.push(eventData.id);

    showToast("Event saved");
  }


  localStorage.setItem(
    "savedEvents",
    JSON.stringify(savedEvents)
  );

  updateSaveButton();
});


/*
===================================================
GOOGLE CALENDAR REMINDER
===================================================
*/

reminderBtn.addEventListener("click",()=>{

  const googleCalendarURL = createGoogleCalendarLink(eventData);

  window.open(googleCalendarURL,"_blank");

  reminderBtn.classList.add("active-reminder");

  reminderBtn.innerHTML = `
    <i class="fa-solid fa-check"></i>
    <span>Reminder Set</span>
  `;

  showToast("Google Calendar reminder opened");
});


function createGoogleCalendarLink(event){

  // CONVERT TO GOOGLE CALENDAR FORMAT
  const startDate = "20260520T100000";
  const endDate = "20260520T120000";


  const details = encodeURIComponent(event.description);

  const location = encodeURIComponent(event.venue);

  const title = encodeURIComponent(event.title);


  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}


/*
===================================================
TOAST NOTIFICATION
===================================================
*/

const saveToast = document.getElementById("saveToast");
const toastText = document.getElementById("toastText");

function showToast(message){

  toastText.textContent = message;

  saveToast.classList.add("show");

  setTimeout(()=>{

    saveToast.classList.remove("show");

  },2500);
}


/*
===================================================
HOW TO RECEIVE DATA FROM LIVE FEED
===================================================

OPTION 1 — LOCAL STORAGE

When user clicks an event card:

localStorage.setItem(
  "selectedEvent",
  JSON.stringify(eventObject)
);

window.location.href = "event-details.html";


Then inside event-details page:

const eventData = JSON.parse(
  localStorage.getItem("selectedEvent")
);


OPTION 2 — FIREBASE

Fetch event using event ID:

/events/12345

Then populate page dynamically.

===================================================
*/
