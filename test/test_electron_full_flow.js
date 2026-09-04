// test/test_electron_full_flow.js
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config()

// Import the main process modules
const { registerChatIPC } = require('../out/main/index.js')

app.whenReady().then(async () => {
  // Check registered IPC handlers
  console.log('App ready. Creating window with preload...')
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
  console.log('Renderer loaded.')

  // Now execute a chat command from inside the renderer!
  const testCmd = 'open calculator'
  console.log(`Sending command from renderer: "${testCmd}"`)

  const result = await win.webContents.executeJavaScript(`
    new Promise(async (resolve, reject) => {
      try {
        const id = 'test-msg-' + Date.now();
        let receivedChunk = '';
        let receivedDone = null;
        let receivedError = null;

        const unsubChunk = window.ultron.chat.onChunk((d) => {
          console.log('[Renderer onChunk]', d);
          receivedChunk += d.chunk;
        });

        const unsubDone = window.ultron.chat.onDone((d) => {
          console.log('[Renderer onDone]', d);
          receivedDone = d;
          resolve({ receivedChunk, receivedDone, receivedError });
        });

        const unsubError = window.ultron.chat.onError((d) => {
          console.error('[Renderer onError]', d);
          receivedError = d;
          resolve({ receivedChunk, receivedDone, receivedError });
        });

        console.log('Calling window.ultron.chat.send...');
        const sendRes = await window.ultron.chat.send('${testCmd}', id);
        console.log('sendRes:', sendRes);
      } catch (err) {
        reject(err.message);
      }
    })
  `)

  console.log('\nRESULT FROM ELECTRON RENDERER TEST:')
  console.log(JSON.stringify(result, null, 2))

  setTimeout(() => app.quit(), 1000)
})
