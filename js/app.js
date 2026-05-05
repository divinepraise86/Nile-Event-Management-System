document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.querySelector(".btn-google");

  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      // For Sprint 1, just a placeholder alert or redirect.
      // In Sprint 2, this will trigger the Firebase Auth flow.
      console.log("Google Auth Flow Triggered");
    });
  }
});
