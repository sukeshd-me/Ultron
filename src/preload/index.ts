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
    getIp: () => ipcRenderer.invoke('network:getIp'),
    getStatus: () => ipcRenderer.invoke('network:getStatus'),
    ping: (host?: string) => ipcRenderer.invoke('network:ping', host)
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
    getMetrics: () => ipcRenderer.invoke('system:getMetrics'),
    getRealTelemetry: () => ipcRenderer.invoke('system:getRealTelemetry')
  },
  provider: {
    getStatus: () => ipcRenderer.invoke('provider:getStatus'),
    setMode: (mode: string) => ipcRenderer.invoke('provider:setMode', mode)
  },
  credentials: {
    hasPhonePin: () => ipcRenderer.invoke('credentials:hasPhonePin'),
    setPhonePin: (pin: string) => ipcRenderer.invoke('credentials:setPhonePin', pin),
    clearPhonePin: () => ipcRenderer.invoke('credentials:clearPhonePin'),
    unlockPhone: (explicitPin?: string) => ipcRenderer.invoke('credentials:unlockPhone', explicitPin),
    hasNvidiaKey: () => ipcRenderer.invoke('credentials:hasNvidiaKey'),
    getMaskedNvidiaKey: () => ipcRenderer.invoke('credentials:getMaskedNvidiaKey'),
    setNvidiaKey: (key: string) => ipcRenderer.invoke('credentials:setNvidiaKey', key),
    clearNvidiaKey: () => ipcRenderer.invoke('credentials:clearNvidiaKey'),
    validateNvidiaKey: (apiKey?: string) => ipcRenderer.invoke('credentials:validateNvidiaKey', apiKey),
    useSavedNvidiaKey: () => ipcRenderer.invoke('credentials:useSavedNvidiaKey'),
    continueOffline: () => ipcRenderer.invoke('credentials:continueOffline')
  },
  adb: {
    getDevices: () => ipcRenderer.invoke('adb:getDevices'),
    connectPhone: (target?: string) => ipcRenderer.invoke('adb:connectPhone', target),
    unlockPhone: (explicitPin?: string) => ipcRenderer.invoke('adb:unlockPhone', explicitPin),
    wakeScreen: () => ipcRenderer.invoke('adb:wakeScreen'),
    makeCall: (phoneNumber: string) => ipcRenderer.invoke('adb:makeCall', phoneNumber),
    sendMessage: (phoneNumber: string, message: string) => ipcRenderer.invoke('adb:sendMessage', phoneNumber, message)
  },
  screen: {
    getSources: (types?: ('screen' | 'window')[]) => ipcRenderer.invoke('screen:getSources', types),
    captureFrame: (sourceId?: string) => ipcRenderer.invoke('screen:captureFrame', sourceId),
    analyzeScreen: (prompt?: string, sourceId?: string) => ipcRenderer.invoke('screen:analyzeScreen', prompt, sourceId),
    setSharingState: (active: boolean, sourceId?: string) => ipcRenderer.invoke('screen:setSharingState', active, sourceId),
    getSharingState: () => ipcRenderer.invoke('screen:getSharingState')
  },
  permissions: {
    getAll: () => ipcRenderer.invoke('permissions:getAll'),
    set: (category: string, level: string) => ipcRenderer.invoke('permissions:set', category, level),
    reset: () => ipcRenderer.invoke('permissions:reset'),
    getAudit: (limit?: number) => ipcRenderer.invoke('permissions:getAudit', limit),
    grantTemporary: (category: string, action: string, durationMs?: number) => ipcRenderer.invoke('permissions:grantTemporary', category, action, durationMs)
  },
  developer: {
    inspectProject: (rootPath?: string) => ipcRenderer.invoke('developer:inspectProject', rootPath),
    checkTypescript: (rootPath?: string) => ipcRenderer.invoke('developer:checkTypescript', rootPath),
    checkBuild: (rootPath?: string) => ipcRenderer.invoke('developer:checkBuild', rootPath),
    gitStatus: (rootPath?: string) => ipcRenderer.invoke('developer:gitStatus', rootPath)
  },
  skills: {
    list: () => ipcRenderer.invoke('skills:list'),
    get: (skillId: string) => ipcRenderer.invoke('skills:get', skillId)
  },
  models: {
    getAll: () => ipcRenderer.invoke('models:getAll'),
    getByTier: (tier: string) => ipcRenderer.invoke('models:getByTier', tier)
  },
  router: {
    getTelemetry: () => ipcRenderer.invoke('router:getTelemetry')
  },
  voice: {
    transcribe: (audioBase64: string, language?: string) => ipcRenderer.invoke('voice:transcribe', audioBase64, language),
    processCommand: (audioBase64: string, language?: string) => ipcRenderer.invoke('voice:processCommand', audioBase64, language),
    getStatus: () => ipcRenderer.invoke('voice:getStatus'),
    switchModel: (modelName: string) => ipcRenderer.invoke('voice:switchModel', modelName),
    warmup: () => ipcRenderer.invoke('voice:warmup'),
    onState: (callback: (state: string) => void) => {
      ipcRenderer.on('voice:state', (_event, state) => callback(state))
    },
    onTranscript: (callback: (text: string) => void) => {
      ipcRenderer.on('voice:transcript', (_event, text) => callback(text))
    }
  },
  search: {
    query: (query: string, categories?: any[]) => ipcRenderer.invoke('search:query', query, categories),
    executeAction: (action: any) => ipcRenderer.invoke('search:executeAction', action)
  },
  diagnostics: {
    run: () => ipcRenderer.invoke('diagnostics:run'),
    getLatest: () => ipcRenderer.invoke('diagnostics:getLatest'),
    copyReport: (report: any) => ipcRenderer.invoke('diagnostics:copyReport', report)
  },
  workspace: {
    getContext: () => ipcRenderer.invoke('workspace:getContext'),
    switchProject: (path: string) => ipcRenderer.invoke('workspace:switchProject', path),
    getRecentWorkspaces: () => ipcRenderer.invoke('workspace:getRecentWorkspaces')
  },
  tasks: {
    list: (filter?: any) => ipcRenderer.invoke('tasks:list', filter),
    get: (id: string) => ipcRenderer.invoke('tasks:get', id),
    cancel: (id: string) => ipcRenderer.invoke('tasks:cancel', id),
    pause: (id: string) => ipcRenderer.invoke('tasks:pause', id),
    resume: (id: string) => ipcRenderer.invoke('tasks:resume', id),
    getLogs: (id: string) => ipcRenderer.invoke('tasks:getLogs', id)
  },
  missions: {
    create: (title: string, description: string, steps: any[]) => ipcRenderer.invoke('missions:create', title, description, steps),
    list: () => ipcRenderer.invoke('missions:list'),
    get: (id: string) => ipcRenderer.invoke('missions:get', id),
    start: (id: string) => ipcRenderer.invoke('missions:start', id),
    pause: (id: string) => ipcRenderer.invoke('missions:pause', id),
    resume: (id: string) => ipcRenderer.invoke('missions:resume', id),
    cancel: (id: string) => ipcRenderer.invoke('missions:cancel', id),
    retryStep: (missionId: string, stepId: string) => ipcRenderer.invoke('missions:retryStep', missionId, stepId)
  },
  workflows: {
    create: (name: string, description: string, steps: any[]) => ipcRenderer.invoke('workflows:create', name, description, steps),
    list: () => ipcRenderer.invoke('workflows:list'),
    execute: (id: string) => ipcRenderer.invoke('workflows:execute', id),
    cancel: (id: string) => ipcRenderer.invoke('workflows:cancel', id)
  },
  documents: {
    index: (filePath: string) => ipcRenderer.invoke('documents:index', filePath),
    query: (query: string, docId?: string) => ipcRenderer.invoke('documents:query', query, docId),
    list: () => ipcRenderer.invoke('documents:list'),
    delete: (docId: string) => ipcRenderer.invoke('documents:delete', docId)
  },
  recovery: {
    list: (limit?: number) => ipcRenderer.invoke('recovery:list', limit),
    undo: (actionId?: string) => ipcRenderer.invoke('recovery:undo', actionId),
    redo: (actionId?: string) => ipcRenderer.invoke('recovery:redo', actionId)
  },
  preferences: {
    getAll: () => ipcRenderer.invoke('preferences:getAll'),
    get: (key: string) => ipcRenderer.invoke('preferences:get', key),
    set: (key: string, value: any, category?: string) => ipcRenderer.invoke('preferences:set', key, value, category),
    delete: (key: string) => ipcRenderer.invoke('preferences:delete', key),
    reset: () => ipcRenderer.invoke('preferences:reset')
  },
  history: {
    list: (filter?: any) => ipcRenderer.invoke('history:list', filter),
    get: (id: string) => ipcRenderer.invoke('history:get', id),
    clear: () => ipcRenderer.invoke('history:clear')
  },
  securityCenter: {
    getReport: () => ipcRenderer.invoke('securityCenter:getReport'),
    getAudit: (limit?: number) => ipcRenderer.invoke('securityCenter:getAudit', limit)
  },
  repair: {
    listKnownFixes: () => ipcRenderer.invoke('repair:listKnownFixes'),
    executeRepair: (repairId: string) => ipcRenderer.invoke('repair:executeRepair', repairId)
  },
  notifications: {
    list: (limit?: number) => ipcRenderer.invoke('notifications:list', limit),
    dismiss: (id: string) => ipcRenderer.invoke('notifications:dismiss', id),
    clearAll: () => ipcRenderer.invoke('notifications:clearAll'),
    onNotification: (callback: (notification: any) => void) => {
      const handler = (_event: any, notification: any) => callback(notification)
      ipcRenderer.on('notifications:received', handler)
      return () => ipcRenderer.removeListener('notifications:received', handler)
    }
  },
  customSkills: {
    list: () => ipcRenderer.invoke('customSkills:list'),
    create: (skill: any) => ipcRenderer.invoke('customSkills:create', skill),
    update: (id: string, updates: any) => ipcRenderer.invoke('customSkills:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('customSkills:delete', id),
    toggle: (id: string, enabled: boolean) => ipcRenderer.invoke('customSkills:toggle', id, enabled)
  },
  actionPreview: {
    onPreview: (callback: (preview: any) => void) => {
      const handler = (_event: any, preview: any) => callback(preview)
      ipcRenderer.on('actionPreview:requested', handler)
      return () => ipcRenderer.removeListener('actionPreview:requested', handler)
    },
    respond: (previewId: string, approved: boolean, modifications?: any) => ipcRenderer.invoke('actionPreview:respond', previewId, approved, modifications)
  },
  goals: {
    create: (data: any) => ipcRenderer.invoke('goals:create', data),
    list: (project?: string) => ipcRenderer.invoke('goals:list', project),
    get: (id: string) => ipcRenderer.invoke('goals:get', id),
    update: (id: string, updates: any) => ipcRenderer.invoke('goals:update', { id, updates }),
    delete: (id: string) => ipcRenderer.invoke('goals:delete', id)
  },
  plugins: {
    list: () => ipcRenderer.invoke('plugins:list'),
    toggle: (id: string, enabled: boolean) => ipcRenderer.invoke('plugins:toggle', { id, enabled }),
    install: (manifest: any) => ipcRenderer.invoke('plugins:install', manifest),
    uninstall: (id: string) => ipcRenderer.invoke('plugins:uninstall', id)
  },
  credentialsVault: {
    list: () => ipcRenderer.invoke('credentials:list'),
    save: (data: any) => ipcRenderer.invoke('credentials:save', data),
    delete: (id: string) => ipcRenderer.invoke('credentials:delete', id),
    test: (id: string) => ipcRenderer.invoke('credentials:test', id)
  },
  windows: {
    list: () => ipcRenderer.invoke('windows:list'),
    focus: (appName: string) => ipcRenderer.invoke('windows:focus', appName),
    listPresets: () => ipcRenderer.invoke('windows:listPresets'),
    savePreset: (name: string, layout: any[]) => ipcRenderer.invoke('windows:savePreset', { name, layout })
  },
  projectIntelligence: {
    getHistory: (projectName: string, workspacePath?: string) => ipcRenderer.invoke('project:getHistory', { projectName, workspacePath }),
    recordDecision: (data: any) => ipcRenderer.invoke('project:recordDecision', data),
    getDecisions: (projectName: string) => ipcRenderer.invoke('project:getDecisions', projectName)
  },
  productivity: {
    getSummary: () => ipcRenderer.invoke('productivity:getSummary'),
    clear: () => ipcRenderer.invoke('productivity:clear'),
    listSuggestions: () => ipcRenderer.invoke('productivity:listSuggestions'),
    updateSuggestion: (id: string, status: string) => ipcRenderer.invoke('productivity:updateSuggestion', { id, status })
  },
  importExport: {
    exportConfig: (options?: any) => ipcRenderer.invoke('importExport:exportConfig', options),
    importConfig: () => ipcRenderer.invoke('importExport:importConfig')
  },
  debugger: {
    listEvents: (limit?: number) => ipcRenderer.invoke('debugger:listEvents', limit),
    clearEvents: () => ipcRenderer.invoke('debugger:clearEvents')
  },
  communication: {
    getStatus: () => ipcRenderer.invoke('communication:getStatus'),
    getSummary: (limit?: number) => ipcRenderer.invoke('communication:getSummary', limit),
    getRecent: (limit?: number, type?: string) => ipcRenderer.invoke('communication:getRecent', { limit, type }),
    sendMessage: (options: any) => ipcRenderer.invoke('communication:sendMessage', options)
  },
  inbox: {
    getItems: (filter?: any) => ipcRenderer.invoke('inbox:getItems', filter),
    getSummary: () => ipcRenderer.invoke('inbox:getSummary'),
    markRead: (id: string) => ipcRenderer.invoke('inbox:markRead', id),
    clearLowPriority: () => ipcRenderer.invoke('inbox:clearLowPriority'),
    summarize: () => ipcRenderer.invoke('inbox:summarize')
  },
  briefing: {
    generate: () => ipcRenderer.invoke('briefing:generate'),
    getLatest: () => ipcRenderer.invoke('briefing:getLatest'),
    list: (limit?: number) => ipcRenderer.invoke('briefing:list', limit)
  },
  focus: {
    start: (mode?: string, durationMinutes?: number, customApps?: string[]) => ipcRenderer.invoke('focus:start', { mode, durationMinutes, customApps }),
    end: () => ipcRenderer.invoke('focus:end'),
    getActive: () => ipcRenderer.invoke('focus:getActive'),
    list: (limit?: number) => ipcRenderer.invoke('focus:list', limit)
  },
  workspaces: {
    list: () => ipcRenderer.invoke('workspaces:list'),
    getActive: () => ipcRenderer.invoke('workspaces:getActive'),
    switch: (idOrName: string) => ipcRenderer.invoke('workspaces:switch', idOrName),
    save: (profile: any, items?: any[]) => ipcRenderer.invoke('workspaces:save', { profile, items }),
    delete: (id: string) => ipcRenderer.invoke('workspaces:delete', id)
  },
  continuity: {
    getStatus: () => ipcRenderer.invoke('continuity:getStatus'),
    getActive: () => ipcRenderer.invoke('continuity:getActive'),
    sync: (missionId: string, stateSummary: string) => ipcRenderer.invoke('continuity:sync', { missionId, stateSummary })
  },
  automations: {
    list: () => ipcRenderer.invoke('automations:list'),
    get: (id: string) => ipcRenderer.invoke('automations:get', id),
    save: (def: any) => ipcRenderer.invoke('automations:save', def),
    delete: (id: string) => ipcRenderer.invoke('automations:delete', id),
    toggle: (id: string, enabled: boolean) => ipcRenderer.invoke('automations:toggle', { id, enabled }),
    execute: (id: string, contextData?: any, permissionGranted?: boolean) => ipcRenderer.invoke('automations:execute', { id, contextData, permissionGranted }),
    listRuns: (limit?: number, automationId?: string) => ipcRenderer.invoke('automations:listRuns', { limit, automationId })
  },
  scheduledMissions: {
    list: () => ipcRenderer.invoke('missions:listScheduled'),
    schedule: (params: any) => ipcRenderer.invoke('missions:schedule', params),
    pause: (id: string) => ipcRenderer.invoke('missions:pauseScheduled', id),
    resume: (id: string) => ipcRenderer.invoke('missions:resumeScheduled', id),
    cancel: (id: string) => ipcRenderer.invoke('missions:cancelScheduled', id),
    delete: (id: string) => ipcRenderer.invoke('missions:deleteScheduled', id),
    runNow: (id: string) => ipcRenderer.invoke('missions:runScheduledNow', id)
  },
  memoryControl: {
    search: (filter: any) => ipcRenderer.invoke('memoryControl:search', filter),
    forget: (id: string, createBackup?: boolean) => ipcRenderer.invoke('memoryControl:forget', { id, createBackup }),
    archive: (id: string, archived: boolean) => ipcRenderer.invoke('memoryControl:archive', { id, archived }),
    export: (scope?: string) => ipcRenderer.invoke('memoryControl:export', scope),
    clearScope: (scope: string) => ipcRenderer.invoke('memoryControl:clearScope', scope)
  },
  personality: {
    list: () => ipcRenderer.invoke('personality:list'),
    getActive: () => ipcRenderer.invoke('personality:getActive'),
    setActive: (id: string) => ipcRenderer.invoke('personality:setActive', id)
  },
  simulation: {
    simulate: (goal: string, title?: string) => ipcRenderer.invoke('simulation:simulate', { goal, title })
  },
  backup: {
    create: (name?: string) => ipcRenderer.invoke('backup:create', name),
    list: () => ipcRenderer.invoke('backup:list'),
    restore: (id: string) => ipcRenderer.invoke('backup:restore', id),
    delete: (id: string) => ipcRenderer.invoke('backup:delete', id),
    export: (id: string, filePath: string) => ipcRenderer.invoke('backup:export', { id, filePath }),
    import: (filePath: string) => ipcRenderer.invoke('backup:import', filePath)
  },
  updates: {
    check: () => ipcRenderer.invoke('updates:check'),
    getCurrentVersion: () => ipcRenderer.invoke('updates:getCurrentVersion'),
    prepareBackup: () => ipcRenderer.invoke('updates:prepareBackup')
  },
  contextGraph: {
    query: (queryText: string) => ipcRenderer.invoke('contextGraph:query', queryText),
    getConnected: (entityTypeOrNodeId: string, entityId?: string) => ipcRenderer.invoke('contextGraph:getConnected', entityTypeOrNodeId, entityId),
    sync: () => ipcRenderer.invoke('contextGraph:sync')
  },
  git: {
    getStatus: (repoPath?: string) => ipcRenderer.invoke('git:getStatus', repoPath),
    getDiff: (repoPath?: string) => ipcRenderer.invoke('git:getDiff', repoPath),
    getActivity: (repoPath?: string) => ipcRenderer.invoke('git:getActivity', repoPath)
  },
  repo: {
    analyze: (repoPath?: string) => ipcRenderer.invoke('repo:analyze', repoPath),
    queryRole: (query: string, repoPath?: string) => ipcRenderer.invoke('repo:queryRole', query, repoPath),
    analyzeImpact: (change: string, target: string, repoPath?: string) => ipcRenderer.invoke('impact:analyze', change, target, repoPath)
  },
  agentTeams: {
    getRuns: (role?: any, limit?: number) => ipcRenderer.invoke('agentTeams:getRuns', role, limit)
  },
  modelPerf: {
    getStats: (modelId?: string) => ipcRenderer.invoke('modelPerf:getStats', modelId),
    getLogs: (limit?: number) => ipcRenderer.invoke('modelPerf:getLogs', limit)
  },
  contradictions: {
    getActive: () => ipcRenderer.invoke('contradictions:getActive'),
    resolve: (id: string) => ipcRenderer.invoke('contradictions:resolve', id)
  },
  checkpoints: {
    getForMission: (missionId: string) => ipcRenderer.invoke('missions:getCheckpoints', missionId),
    resolve: (checkpointId: string, action: 'APPROVED' | 'EDITED' | 'CANCELLED') => ipcRenderer.invoke('missions:resolveCheckpoint', checkpointId, action),
    onRequested: (callback: (checkpoint: any) => void) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('checkpoint:requested', handler)
      return () => ipcRenderer.removeListener('checkpoint:requested', handler)
    }
  },
  commandBar: {
    onToggle: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('commandBar:toggle', handler)
      return () => ipcRenderer.removeListener('commandBar:toggle', handler)
    }
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  }
})