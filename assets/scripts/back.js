// Fallback if history.back() doesn't work (e.g., direct navigation to 404)
document.querySelector('.back-button').addEventListener('click', function(e) {
  if (window.history.length <= 1) {
    e.preventDefault();
    window.location.href = '/';
  }
});