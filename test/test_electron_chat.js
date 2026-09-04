// test/test_electron_chat.js
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// Load the compiled main process IPC handlers
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config()

const { registerChatIPC } = require('../out/main/index.js')

// Wait! out/main/index.js executes app.whenReady() when imported!
