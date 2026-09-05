// src/shared/skills/skills.types.ts — Central Skills Architecture for ULTRON V1.0.3
import { PermissionCategory } from '../permissions.types'

export type SkillId =
  | 'windows'
  | 'android'
  | 'browser'
  | 'files'
  | 'coding'
  | 'research'
  | 'memory'
  | 'vision'
  | 'developer'
  | 'system'
  | 'search'
  | 'tasks'
  | 'security'
  | 'diagnostics'

export interface SkillDefinition {
  id: SkillId
  name: string
  description: string
  capabilities: string[]
  tools: string[]
  permissions: PermissionCategory[]
  availability: 'always' | 'connected_phone' | 'screen_active' | 'online_only' | 'developer_mode'
  icon: string
}

/**
 * The 10 Core Skills defining ULTRON's functional capabilities.
 */
export const SKILLS_CATALOG: SkillDefinition[] = [
  {
    id: 'windows',
    name: 'Windows Skill',
    description: 'Control Windows OS, retrieve system hardware telemetry, manage settings, and adjust volume/brightness.',
    capabilities: [
      'Query real-time CPU, RAM, Disk, and Process stats',
      'Open Windows Settings pages (WiFi, Bluetooth, Apps, Display)',
      'Adjust system volume and display brightness',
      'Power operations (Shutdown, Restart, Lock) with safety confirmation'
    ],
    tools: [
      'system.getCpu',
      'system.getMemory',
      'system.getDisk',
      'system.getProcesses',
      'system.getTime',
      'system.getDate',
      'settings.open',
      'system.setBrightness',
      'system.getBrightness',
      'system.setVolume',
      'system.getVolume',
      'system.lock',
      'system.restart',
      'system.shutdown'
    ],
    permissions: ['WINDOWS'],
    availability: 'always',
    icon: 'Monitor'
  },
  {
    id: 'android',
    name: 'Android Skill',
    description: 'Bridge to connected Android smartphones via ADB with real hardware telemetry, contact resolution, and app launching.',
    capabilities: [
      'Connect via USB or Wireless ADB with authorization check',
      'Inspect genuine device model, Android OS version, and battery percentage',
      'Discover installed third-party apps dynamically from device',
      'Launch Android applications and verify foreground execution',
      'Search contacts and initiate phone calls',
      'Manage call state (End call, Mute/Unmute microphone)'
    ],
    tools: [
      'adb.connect',
      'adb.getDevices',
      'android.getBattery',
      'android.getPhoneState',
      'android.listApps',
      'android.openApp',
      'android.callContact',
      'android.endCall',
      'android.muteCall',
      'android.holdCall',
      'android.resumeCall',
      'android.powerOff',
      'android.restart',
      'android.lock'
    ],
    permissions: ['ANDROID'],
    availability: 'always',
    icon: 'Smartphone'
  },
  {
    id: 'browser',
    name: 'Browser Skill',
    description: 'Launch web applications and websites safely into the user default browser.',
    capabilities: [
      'Fast-launch popular web services (YouTube, Google, GitHub, Twitter/X, Reddit)',
      'Navigate to arbitrary URLs via validated protocols'
    ],
    tools: [
      'apps.open',
      'research.search'
    ],
    permissions: ['BROWSER'],
    availability: 'always',
    icon: 'Globe'
  },
  {
    id: 'files',
    name: 'Files Skill',
    description: 'Safe filesystem operations across Desktop, Documents, and Downloads with safety barriers.',
    capabilities: [
      'Create files and directories',
      'Read file contents safely',
      'Copy, move, and organize files',
      'Locate and search files by pattern',
      'Safely delete files with confirmation'
    ],
    tools: [
      'filesystem.createFile',
      'filesystem.createDirectory',
      'filesystem.readFile',
      'filesystem.searchFiles',
      'filesystem.copyFile',
      'filesystem.moveFile',
      'filesystem.deleteFile'
    ],
    permissions: ['FILES'],
    availability: 'always',
    icon: 'Folder'
  },
  {
    id: 'coding',
    name: 'Coding Skill',
    description: 'Multi-language code synthesis, formatting, and script generation.',
    capabilities: [
      'Synthesize runnable code in Python, TypeScript, JavaScript, C++, Rust, PowerShell',
      'Generate scripts with proper file extensions and structure'
    ],
    tools: [
      'code.generate'
    ],
    permissions: ['DEVELOPER'],
    availability: 'always',
    icon: 'Code'
  },
  {
    id: 'research',
    name: 'Research Skill',
    description: 'Web search, YouTube query dispatch, and information summarization.',
    capabilities: [
      'Search YouTube videos and topics',
      'Dispatch search queries to web engines',
      'Synthesize multi-source research into concise answers'
    ],
    tools: [
      'research.youtube',
      'research.search'
    ],
    permissions: ['NETWORK'],
    availability: 'always',
    icon: 'Search'
  },
  {
    id: 'memory',
    name: 'Memory Skill',
    description: 'Scoped persistent memory management across Personal, Conversation, Project, and Task scopes.',
    capabilities: [
      'Recall user preferences, workflow habits, and persistent facts',
      'Store and retrieve project-specific architectural decisions',
      'Manage temporary task execution context',
      'Redact sensitive credentials and tokens before SQLite storage'
    ],
    tools: [
      'memory.save',
      'memory.search',
      'memory.list',
      'memory.delete',
      'memory.clear',
      'memory.getStats'
    ],
    permissions: ['MEMORY'],
    availability: 'always',
    icon: 'Brain'
  },
  {
    id: 'vision',
    name: 'Vision Skill',
    description: 'Local screen capture, frame sampling, and multimodal screen understanding.',
    capabilities: [
      'Enumerate local screens and application windows via desktopCapturer',
      'Capture on-demand screen frames without permanent storage or silent capture',
      'Analyze UI elements, errors, and visible text with multimodal vision models',
      'Translate visual comprehension into structured action plans'
    ],
    tools: [
      'screen.getSources',
      'screen.captureFrame',
      'screen.analyzeScreen'
    ],
    permissions: ['SCREEN'],
    availability: 'always',
    icon: 'Eye'
  },
  {
    id: 'developer',
    name: 'Developer Skill',
    description: 'Deep self-inspection of the ULTRON codebase, TypeScript diagnostics, Git status, and verified code fixing.',
    capabilities: [
      'Inspect project directory structure, package.json, and source files',
      'Execute real TypeScript checks (tsc --noEmit) and report actual errors',
      'Check Git status, current branch, and recent commits without auto-pushing',
      'Verify build health via electron-vite build',
      'Execute verified code repair workflows (Understand -> Plan -> Edit -> Build -> Verify)'
    ],
    tools: [
      'developer.inspectProject',
      'developer.checkTypescript',
      'developer.checkBuild',
      'developer.gitStatus',
      'developer.fixCode'
    ],
    permissions: ['DEVELOPER'],
    availability: 'always',
    icon: 'Terminal'
  },
  {
    id: 'system',
    name: 'System Skill',
    description: 'Autonomous multi-step orchestration, concurrency monitoring, and action verification.',
    capabilities: [
      'Decompose complex multi-step user instructions into sequential tools',
      'Verify execution outcomes after each step before progressing',
      'Track millisecond execution telemetry and generate Claude-style activity timelines',
      'Enforce permission gates and confirmation cards'
    ],
    tools: [
      'system.executeTaskPlan',
      'system.verifyResult'
    ],
    permissions: ['AUTOMATION'],
    availability: 'always',
    icon: 'Cpu'
  },
  {
    id: 'search',
    name: 'Universal Search Skill',
    description: 'Universal PC search across installed applications, files, projects, memories, tasks, and Git repositories.',
    capabilities: [
      'Search Windows Start Menu & installed applications',
      'Search recent files, Documents, and Downloads',
      'Search active codebases and Git repositories',
      'Search SQLite memory and past conversations',
      'Execute safe launch and open actions'
    ],
    tools: [
      'search.query',
      'search.executeAction'
    ],
    permissions: ['WINDOWS', 'FILES'],
    availability: 'always',
    icon: 'Search'
  },
  {
    id: 'tasks',
    name: 'Task Management Skill',
    description: 'Concurrent background task orchestration, process tree lifecycle control, and real-time execution logs.',
    capabilities: [
      'Manage long-running background tasks (Builds, Monitors, Scrapers)',
      'Real-time task log streaming with millisecond precision',
      'Graceful task pause, resume, and cancellation (AbortController)',
      'Inspect task progress and resource allocation'
    ],
    tools: [
      'tasks.list',
      'tasks.get',
      'tasks.cancel',
      'tasks.pause',
      'tasks.resume',
      'tasks.getLogs'
    ],
    permissions: ['BACKGROUND_TASKS', 'AUTOMATION'],
    availability: 'always',
    icon: 'ListTodo'
  },
  {
    id: 'security',
    name: 'Security & Protection Skill',
    description: 'Zero-trust security policy enforcement, secret redaction, path traversal defense, and action risk assessment.',
    capabilities: [
      'Enforce granular 11-category permission gates',
      'Prevent directory traversal and unauthorized filesystem writes',
      'Automatic API key and credential redaction before persistence',
      'Provide audit trail for high-risk system modifications'
    ],
    tools: [
      'permissions.getAll',
      'permissions.set',
      'permissions.getAudit',
      'permissions.grantTemporary'
    ],
    permissions: ['DEVELOPER'],
    availability: 'always',
    icon: 'ShieldCheck'
  },
  {
    id: 'diagnostics',
    name: 'Diagnostics Skill',
    description: 'Comprehensive ULTRON Self-Diagnostics (Health Check) across 19+ subsystems with authentic ground-truth reporting.',
    capabilities: [
      'Check Electron, Node.js, and Windows OS runtime health',
      'Verify SQLite database integrity and WAL journaling',
      'Validate AI provider credentials and model latency',
      'Inspect ADB device connectivity and screen capture readiness',
      'Generate and export comprehensive diagnostic reports'
    ],
    tools: [
      'diagnostics.run',
      'diagnostics.getLatest',
      'diagnostics.copyReport'
    ],
    permissions: ['WINDOWS'],
    availability: 'always',
    icon: 'Activity'
  }
]

export function getSkillById(id: SkillId): SkillDefinition | undefined {
  return SKILLS_CATALOG.find((s) => s.id === id)
}

export function getSkillForTool(toolName: string): SkillDefinition {
  const found = SKILLS_CATALOG.find((s) => s.tools.includes(toolName))
  if (found) return found

  if (toolName.startsWith('search.')) return getSkillById('search')!
  if (toolName.startsWith('tasks.')) return getSkillById('tasks')!
  if (toolName.startsWith('diagnostics.')) return getSkillById('diagnostics')!
  if (toolName.startsWith('permissions.')) return getSkillById('security')!
  if (toolName.startsWith('adb.') || toolName.startsWith('android.')) return getSkillById('android')!
  if (toolName.startsWith('filesystem.')) return getSkillById('files')!
  if (toolName.startsWith('research.')) return getSkillById('research')!
  if (toolName.startsWith('code.')) return getSkillById('coding')!
  if (toolName.startsWith('screen.')) return getSkillById('vision')!
  if (toolName.startsWith('developer.')) return getSkillById('developer')!
  if (toolName.startsWith('memory.')) return getSkillById('memory')!
  if (toolName.startsWith('apps.')) return getSkillById('browser')!
  return getSkillById('windows')!
}
