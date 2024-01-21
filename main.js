const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ipc = ipcMain

const createWindow = () => {
    const win = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            devTools: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('src/index.html')
    
    ipc.on('closeApp', ()=>{
        console.log('ass')
        win.close()
    })
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})