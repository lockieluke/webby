import {BrowserView, BrowserWindow, ipcMain} from 'electron'
import * as path from 'path'
import {registerLocalKeyStroke} from '../keystrokes'
import showCtxMenu from '../ctxMenus'
import TabWrapper from "./tabWrapper";

export let currentBV: BrowserView = null;

export default function main(window: BrowserWindow) {
    let totaltab: number = 0;
    let lifetimetabs: number = 0;
    let focusedtabs: number = 0;

    let webviewids: object = {};

    const currentwin: BrowserWindow = window;

    registerLocalKeyStroke('CommandOrControl+Shift+I', currentwin, function () {
        BrowserView.fromId(webviewids['tab-' + focusedtabs]).webContents.openDevTools({
            mode: 'right'
        })
    })

    ipcMain.on('tabmng-new', function (event, args: string[]) {

        focusedtabs = totaltab;

        const webview: BrowserView = new BrowserView({
            webPreferences: {
                nodeIntegration: false,
                enableRemoteModule: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../../window/preloads/preload.js'),
                nativeWindowOpen: true
            }
        })

        webview.setBackgroundColor('#ffffff');

        currentwin.setBrowserView(webview);
        webview.webContents.loadURL(args[0]).then(function () {
            resizeWebView();
            currentwin.on('resize', function () {
                resizeWebView();
            })

            function resizeWebView() {
                const {width, height} = currentwin.getContentBounds();
                if (webview != null && webview != undefined && !webview.isDestroyed()) {
                    webview.setBounds({
                        width: width,
                        height: height - 40,
                        x: 0,
                        y: 40
                    })
                }
            }
        });

        const domid: string = 'tab-' + totaltab;

        webview.webContents.on('context-menu', function (event, param) {
            showCtxMenu(currentwin, webview, param);
        })

        webview.webContents.on('page-title-updated', function (event, title, explicitSet) {
            currentwin.webContents.send('tabmng-browser-titleupdated', [domid, title]);
            if (focusedtabs == parseInt(domid.replace('tab-', '')))
                currentwin.setTitle("Zinc - " + title);
        })
        webview.webContents.on('new-window', function (event: Electron.NewWindowWebContentsEvent, url: string, frameName: string, disposition) {
            event.preventDefault();
            TabWrapper.newTab(url);
        })
        webview.webContents.on('did-finish-load', function () {
            currentwin.webContents.send('tabmng-browser-backforward', [webview.webContents.canGoBack(), webview.webContents.canGoForward()]);
        })
        webviewids[domid] = webview.id;

        event.returnValue = totaltab;

        totaltab += 1;
        lifetimetabs += 1;
    })

    ipcMain.on('tabmng-getinfo', function (event, args) {
        event.returnValue = [totaltab, lifetimetabs, focusedtabs];
    })

    ipcMain.on('tabmng-setinfo', function (event, args: string[]) {
        switch (args[0]) {
            case 'total':
                totaltab = parseInt(args[1]);
                break

            case 'focus':
                focusedtabs = parseInt(args[1]);
                break;

            case 'lifetime':
                lifetimetabs = parseInt(args[1]);
                break
        }
    })

    ipcMain.on('tabmng-focus', function (event, args) {
        const bv: BrowserView = BrowserView.fromId(webviewids['tab-' + args]);
        currentwin.setBrowserView(bv);
        currentwin.setTitle("Zinc - " + bv.webContents.getTitle());
        focusedtabs = args;
        currentBV = bv;
    })

    ipcMain.on('tabmng-close', function (event, args) {
        try {
            let handlingBV: BrowserView = BrowserView.fromId(webviewids[args]);
            currentwin.removeBrowserView(handlingBV);
            handlingBV.destroy();
            handlingBV = null;
        } catch {
        }
        delete webviewids[args];
        let tempwebviewids: object = {};
        for (let i = 0; i < Object.keys(webviewids).length; i++) {
            tempwebviewids["tab-" + i] = webviewids[Object.keys(webviewids)[i]];
        }
        webviewids = tempwebviewids;
        totaltab -= 1;
    })

    ipcMain.on('tabmng-back', function () {
        const currentWebView: BrowserView = BrowserView.fromId(webviewids['tab-' + focusedtabs]);
        currentWebView.webContents.goBack();
    })

    ipcMain.on('tabmng-forward', function () {
        const currentWebView: BrowserView = BrowserView.fromId(webviewids['tab-' + focusedtabs]);
        currentWebView.webContents.goForward();
    })

    ipcMain.on('tabmng-getcurrentbv', function (event, args) {
        event.returnValue = currentBV;
    })

    ipcMain.on('tabmng-getcurrentwin', function (event, args) {
        event.returnValue = currentwin;
    })
}