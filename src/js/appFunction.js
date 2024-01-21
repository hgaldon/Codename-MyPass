const {ipcRenderer } = require('electron')
const ipc = ipcRenderer

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeBtn');
    closeBtn.addEventListener('click', () => {
        ipc.send('closeApp');
    });
});