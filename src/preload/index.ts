// src/preload/index.ts — Typed contextBridge for ULTRON
import { contextBridge, ipcRenderer } from 'electron'

type Callback = (...args: any[]) => void

contextBridge.exposeInMainWorld('ultron', {
  chat: {
    send: (message: string, clientMessageId?: string) => ipcRenderer.invoke('chat:send', message, clientMessageId),
    cancel: () => ipcRenderer.invoke('chat:cancel'),
    clear: () => ipcRenderer.invoke('chat:clear'),
    setApiKey: (key: string) => ipcRenderer.invoke('chat:setApiKey', key),
    isConfigured: () => ipcRenderer.invoke('chat:isConfigured'),
    testConnection: () => ipcRenderer.invoke('chat:testConnection'),
    onChunk: (callback: Callback) => {
      const handler = (_event: any, data: any) => callback(data)
      ipcRenderer.on('chat:chunk', handler)
      return () => ipcRenderer.removeListener('chat:chunk', handler)
    },
    onDone: (callback: Callback) => {
      const handler = (_event: any, data: any) => callback(data)
      ipcRenderer.on('chat:done', handler)
      return () => ipcRenderer.removeListener('chat:done', handler)
    },
    onError: (callback: Callback) => {
      const handler = (_event: any, data: any) => callback(data)
      ipcRenderer.on('chat:error', handler)
      return () => ipcRenderer.removeListener('chat:error', handler)
    },
    onStateChange: (callback: Callback) => {
      const handler = (_event: any, state: any) => callback(state)
      ipcRenderer.on('state:change', handler)
      return () => ipcRenderer.removeListener('state:change', handler)
    },
    onTasksUpdate: (callback: Callback) => {
      const handler = (_event: any, tasks: any) => callback(tasks)
      ipcRenderer.on('tasks:update', handler)
      return () => ipcRenderer.removeListener('tasks:update', handler)
    },
    onMetricsUpdate: (callback: Callback) => {
      const handler = (_event: any, metrics: any) => callback(metrics)
      ipcRenderer.on('metrics:update', handler)
      return () => ipcRenderer.removeListener('metrics:update', handler)
    }
  },
  tools: {
    execute: (toolCall: any) => ipcRenderer.invoke('tools:execute', toolCall),
    confirm: (id: string, confirmed: boolean) => ipcRenderer.invoke('tools:confirm', id, confirmed)
  },
  apps: {
    open: (appName: string) => ipcRenderer.invoke('apps:open', appName)
  },
  files: {
    create: (targetPath: string, content?: string) => ipcRenderer.invoke('files:create', targetPath, content),
    createFolder: (targetPath: string) => ipcRenderer.invoke('files:createFolder', targetPath),
    read: (targetPath: string) => ipcRenderer.invoke('files:read', targetPath),
    copy: (src: string, dest: string) => ipcRenderer.invoke('files:copy', src, dest),
    move: (src: string, dest: string) => ipcRenderer.invoke('files:move', src, dest),
    search: (query: string, root?: string) => ipcRenderer.invoke('files:search', query, root),
    delete: (targetPath: string) => ipcRenderer.invoke('files:delete', targetPath)
  },
  network: {
    getWifiStatus: () => ipcRenderer.invoke('network:getWifiStatus'),
    getAdapters: () => ipcRenderer.invoke('network:getAdapters'),
    getIp: () => ipcRenderer.invoke('network:getIp')
  },
  powershell: {
    executeSafeAction: (script: string) => ipcRenderer.invoke('powershell:executeSafeAction', script)
  },
  memory: {
    list: (options?: any) => ipcRenderer.invoke('memory:list', options),
    search: (params: any) => ipcRenderer.invoke('memory:search', params),
    save: (entry: any) => ipcRenderer.invoke('memory:save', entry),
    delete: (id: string) => ipcRenderer.invoke('memory:delete', id),
    clear: () => ipcRenderer.invoke('memory:clear'),
    getStats: () => ipcRenderer.invoke('memory:stats')
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (updates: any) => ipcRenderer.invoke('settings:set', updates),
    open: (target?: string) => ipcRenderer.invoke('settings:open', target)
  },
  system: {
    getTime: () => ipcRenderer.invoke('system:getTime'),
    getDate: () => ipcRenderer.invoke('system:getDate'),
    getCpu: () => ipcRenderer.invoke('system:getCpu'),
    getMemory: () => ipcRenderer.invoke('system:getMemory'),
    getDisk: () => ipcRenderer.invoke('system:getDisk'),
    getProcesses: (limit?: number) => ipcRenderer.invoke('system:getProcesses', limit),
    getBrightness: () => ipcRenderer.invoke('system:getBrightness'),
    setBrightness: (value: number) => ipcRenderer.invoke('system:setBrightness', value),
    getVersion: () => ipcRenderer.invoke('system:getVersion'),
    getPlatform: () => ipcRenderer.invoke('system:getPlatform'),
    getTasks: () => ipcRenderer.invoke('system:getTasks'),
    getMetrics: () => ipcRenderer.invoke('system:getMetrics')
  },
  provider: {
    getStatus: () => ipcRenderer.invoke('provider:getStatus'),
    setMode: (mode: string) => ipcRenderer.invoke('provider:setMode', mode)
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  }
})