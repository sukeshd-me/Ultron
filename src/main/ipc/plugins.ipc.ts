import { ipcMain } from 'electron'
import { pluginService } from '../services/plugin.service'

export function registerPluginsIpc(): void {
  ipcMain.handle('plugins:list', async () => {
    return pluginService.listPlugins()
  })

  ipcMain.handle('plugins:toggle', async (_, { id, enabled }) => {
    return pluginService.togglePlugin(id, enabled)
  })

  ipcMain.handle('plugins:install', async (_, manifest) => {
    return pluginService.installPlugin(manifest)
  })

  ipcMain.handle('plugins:uninstall', async (_, id) => {
    return pluginService.uninstallPlugin(id)
  })
}
