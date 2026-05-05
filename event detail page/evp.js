document.addEventListener("DOMContentLoaded", function () {

  let savedEvents = [];

  const cards = document.querySelectorAll(".card");
  const savedList = document.getElementById("savedList");

  cards.forEach(card => {
    const btn = card.querySelector(".saveBtn");

    btn.addEventListener("click", function () {
      const title = card.querySelector(".title").textContent;
      const date = card.querySelector(".date").textContent;
      const location = card.querySelector(".location").textContent;

      const eventObj = { title, date, location };

      const exists = savedEvents.find(e => e.title === title);

      if (!exists) {
        savedEvents.push(eventObj);
        btn.textContent = "Unsave";
        btn.classList.add("saved");
        console.log("Saved:", eventObj);
      } else {
        savedEvents = savedEvents.filter(e => e.title !== title);
        btn.textContent = "Save Event";
        btn.classList.remove("saved");
        console.log("Removed:", eventObj);
      }

      updateMyEvents();
    });
  });

  function updateMyEvents() {
    savedList.innerHTML = "";

    savedEvents.forEach(ev => {
      const div = document.createElement("div");
      div.className = "event-item";
      div.innerHTML = `
        <strong>${ev.title}</strong><br>
        ${ev.date}<br>
        ${ev.location}
      `;
      savedList.appendChild(div);
    });
  }

});