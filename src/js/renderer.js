document.getElementById('min-btn').addEventListener('click', () => {
  window.electron.minimize();
});

document.getElementById('max-btn').addEventListener('click', () => {
  window.electron.maximize();
});

document.getElementById('close-btn').addEventListener('click', () => {
  window.electron.close();
});
