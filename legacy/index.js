const electron = require("electron");
const { app, BrowserWindow, ipcMain, BrowserView, shell, nativeTheme} = electron;
const { registerProtocols } = require(__dirname + '/index/components/protocol/index');
const isDev = require('electron-is-dev');
const {closeMenu, openMenu} = require(__dirname + '/main/components/menu/index')
require(__dirname + '/main/components/ipcEvents/index')

// app.commandLine.appendSwitch('--enable-transparent-visuals');
// app.commandLine.appendSwitch('--enable-parallel-downloading');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        center: true,
        show: false,
        title: "Zinc",
        frame: false,
        backgroundColor: '#ffffff',
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
            enableRemoteModule: true,
            nodeIntegrationInSubFrames: true,
            devTools: isDev,
            webgl: true,
        },
        minHeight: 80,
        minWidth: 180,
        icon: __dirname + '/artwork/Zinc.png'
    })

    nativeTheme.themeSource = 'light'

    app.setAsDefaultProtocolClient('zinc')
    win.loadFile('index/index.html')
    win.setMenu(null)

    win.webContents.on('did-finish-load', async () => {
        await win.show()
    })

    ipcMain.on('webtitlechange', async (_event, args) => {
        win.title = "Zinc - " + args.toString()
    })

    ipcMain.on('webview:load', async (_event, args) => {
        BrowserView.fromId(args).webContents.on('new-window', (event, url) => {
            event.preventDefault()
            BrowserWindow.getFocusedWindow().webContents.send('new-tab', url)
        })
    })

    ipcMain.on('home', async (_event, _args) => {
        closeMenu()
        BrowserWindow.getFocusedWindow().webContents.send('home')
    })
}

ipcMain.on('menu:open', async () => {
    openMenu()
})

ipcMain.on('newtab', () => {
    closeMenu()
    BrowserWindow.getFocusedWindow().webContents.send('new-tab', 'zinc://newtab')
})

ipcMain.on('newwin', () => {
    shell.openPath(app.getPath('exe'))
})

ipcMain.on('closetab', (_event, args) => {
    const currentwin = BrowserWindow.getFocusedWindow()
    try {
        currentwin.removeBrowserView(BrowserView.fromId(args[0]))
        currentwin.addBrowserView(BrowserView.fromId(args[1]))
    } catch { }
})

ipcMain.on('quit', (_event, args) => {
    switch (args) {
        case false:
            closeMenu()
            break

        case true:
            closeMenu()
            BrowserWindow.getFocusedWindow().close()
            delete BrowserWindow.getFocusedWindow()
            break
    }
    process.exit(0)
})

ipcMain.on('about', (_event, _args) => {
    closeMenu()
    app.setAboutPanelOptions({
        applicationName: "Zinc",
        applicationVersion: '0.1.0',
        authors: "Zinc DevTeam",
        iconPath: __dirname + '/artwork/Zinc.png',
    })
    app.showAboutPanel()
})

ipcMain.on('reloadpage', (_event, args) => {
    closeMenu()
    BrowserWindow.getFocusedWindow().webContents.send('reloadpage', args)
})

ipcMain.on('navi-history', () => {
    closeMenu()
    BrowserWindow.getFocusedWindow().webContents.send('navi-history')
})

app.whenReady().then(function () {
    createWindow()


    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0 && process.platform === 'darwin') shell.openPath(app.getPath('exe'))
    })
})

app.whenReady().then(() => {
    registerProtocols()
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
    closeMenu()
})