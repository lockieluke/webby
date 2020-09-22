const {ipcRenderer} = require('electron');

let mouseX: number = 0
let mouseY: number = 0

document.addEventListener('contextmenu', async (event: MouseEvent) => {
    event.preventDefault()

    const element: HTMLElement = <HTMLElement> event.target

    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        ipcRenderer.send('textcontextmenu', [mouseX, mouseY])
    } else if (event.target instanceof HTMLImageElement || event.target instanceof HTMLPictureElement) {
        ipcRenderer.send('imagecontextmenu', [mouseX, mouseY, element.getAttribute('src').toString()])
    } else if (element.hasAttribute('href')) {
        ipcRenderer.send('anchorcontextmenu', [mouseX, mouseY])
    } else {
        ipcRenderer.send('contextmenu', [mouseX, mouseY])
    }
});

document.addEventListener('mousemove', async event => {
    mouseX = event.pageX
    mouseY = event.pageY
});