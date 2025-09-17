// back.js

document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.querySelector('.back-button');
  if (!backBtn) return;

  backBtn.addEventListener('click', (e) => {
    if (window.history.length > 1) {
      // Normal case: go back
      e.preventDefault();
      window.history.back();
    } else {
      // Fallback: go to homepage
      e.preventDefault();
      window.location.href = '/';
    }
  });
});
