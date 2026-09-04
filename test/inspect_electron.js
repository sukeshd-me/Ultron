// test/inspect_electron.js
const { app, BrowserWindow } = require('electron')
const path = require('path')

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../out/preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  })

  await win.loadFile(path.join(__dirname, '../out/renderer/index.html'))

  const ultronType = await win.webContents.executeJavaScript(`
    ({
      hasUltron: Boolean(window.ultron),
      hasChat: Boolean(window.ultron?.chat),
      hasSend: typeof window.ultron?.chat?.send,
      keys: Object.keys(window.ultron || {}),
      chatKeys: Object.keys(window.ultron?.chat || {}),
      sendSource: window.ultron?.chat?.send ? window.ultron.chat.send.toString() : 'none'
    })
  `)

  console.log('ULTRON IN RENDERER:', JSON.stringify(ultronType, null, 2))
  app.quit()
})
