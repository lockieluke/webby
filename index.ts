import ZincNative from "./main/native/zincNative";
import { app, BrowserWindow } from "electron";
import * as electronIsDev from "electron-is-dev";
import initWinControls from "./main/browser/winCtrls";
import initTabMNG from "./main/browser/tabMng";
import initWinEvents from "./main/window";
import initDevService from "./main/dev";
import * as path from "path";
import registerTabActionsKeystrokes from "./main/keystrokes/tabActions";
import NativeCommunication from "./main/native/communication";
import { getJavaPath, runJar } from "./main/native";
import defaultLogger, { LogLevel, LogTypes } from "./main/logger/";

app.setPath(
  'userData',
  path.join(app.getPath('appData'), 'Zinc', 'User Session Data'),
);

function createWindow(): void {
  let nativeCommunication: NativeCommunication = null;

  const win: BrowserWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Zinc',
    frame: false,
    backgroundColor: '#ffffff',
    minHeight: 60,
    minWidth: 180,
    icon: path.join(__dirname, '..', 'artwork', 'Zinc.png'),
    show: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: false,
      devTools: electronIsDev,
    },
  });

  win.setMenu(null);

  win.loadFile('window-ui/index.html');

  requireInitScripts();

  win.on('close', function () {
    if (BrowserWindow.getAllWindows().length < 1) {
      app.quit();
      nativeCommunication.getWS().send('QuitZinc');
      nativeCommunication.close();
    }
  });

  function requireInitScripts() {
    nativeCommunication = new NativeCommunication('8000', 'localhost');
    nativeCommunication.initialize();
    defaultLogger(LogTypes.ZincNative, "Communication with Zinc Native on port 8000", LogLevel.Log);
    (global as any).nativeCommunication = nativeCommunication;
    if (process.env.NO_NATIVE_JAR !== 'true') {
      const zincNative: ZincNative = new ZincNative(nativeCommunication, app);
      const jarPath: string = zincNative.getJarPath(), javaPath: string = getJavaPath(app);
      defaultLogger(LogTypes.ZincNative, `Starting bundled Zinc Native which is placed in ${jarPath} with JVM in ${javaPath}`, LogLevel.Log);
      runJar(
        javaPath,
        jarPath,
        "",
        function(stdout, stderr) {
          defaultLogger(LogTypes.ZincNative, stdout, LogLevel.Log);
          defaultLogger(LogTypes.ZincNative, stderr, LogLevel.Error);
        }
      );
    }
    initWinControls(win);
    initTabMNG(win);
    initWinEvents(win);
    registerTabActionsKeystrokes(win);
    if (!app.isPackaged) initDevService(win);
  }
}

app.on('ready', function () {
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length == 0) createWindow();
});
