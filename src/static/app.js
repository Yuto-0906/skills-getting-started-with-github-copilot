document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  let activities = {};

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function renderActivityCards() {
    activitiesList.innerHTML = "";

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const participantsMarkup = details.participants.length
        ? `
          <ul class="participants-list">
            ${details.participants
              .map((participant) => `
                <li class="participant-item">
                  <span class="participant-email">${participant}</span>
                  <button
                    type="button"
                    class="participant-remove-btn"
                    aria-label="Remove ${participant} from ${name}"
                    title="Remove participant"
                    data-activity="${name}"
                    data-email="${participant}"
                  >
                    &times;
                  </button>
                </li>
              `)
              .join("")}
          </ul>
        `
        : '<p class="participants-empty">No participants yet.</p>';

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <p class="participants-heading">Participants</p>
          ${participantsMarkup}
        </div>
      `;

      activitiesList.appendChild(activityCard);
    });

    activitiesList.querySelectorAll(".participant-remove-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const activity = button.dataset.activity;
        const email = button.dataset.email;

        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
            {
              method: "DELETE",
            }
          );

          const result = await response.json();

          if (response.ok) {
            await fetchActivities();
            showMessage(result.message, "success");
          } else {
            showMessage(result.detail || "An error occurred", "error");
          }
        } catch (error) {
          showMessage("Failed to remove participant. Please try again.", "error");
          console.error("Error removing participant:", error);
        }
      });
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      activities = await response.json();

      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.keys(activities).forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      renderActivityCards();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        await fetchActivities();
        showMessage(result.message, "success");
        signupForm.reset();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
