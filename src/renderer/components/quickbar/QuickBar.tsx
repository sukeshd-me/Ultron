import React from 'react'
import {
  PhoneCall,
  Search,
  FolderPlus,
  Play,
  ShieldCheck,
  Smartphone,
  Terminal,
  Zap,
  Layers,
  Wifi,
  Cpu,
  Settings
} from 'lucide-react'

export function QuickBar({ onAction }: { onAction: (prompt: string) => void }) {
  const actions = [
    {
      label: '⚡ System Info & CPU',
      icon: <Cpu size={14} color="#00d4ff" />,
      prompt: 'Tell me the current time and show my CPU usage and memory usage'
    },
    {
      label: '⚡ Wi-Fi & IP Config',
      icon: <Wifi size={14} color="#00ff88" />,
      prompt: 'Show Wi-Fi status and show my IP address'
    },
    {
      label: '⚡ Windows Settings',
      icon: <Settings size={14} color="#a855f7" />,
      prompt: 'Open Windows Settings'
    },
    {
      label: '⚡ Explain Blackhole & YouTube',
      icon: <Zap size={14} color="#00ff88" />,
      prompt: 'hey explain about blackhole in a new folder called Blackhole.txt'
    },
    {
      label: '⚡ Full Multitask Pipeline',
      icon: <Layers size={14} color="#ffaa00" />,
      prompt: 'Open notepad, create a folder called ULTRON-Project on Desktop, create a python snake game in main.py on Desktop, and search file .env'
    },
    { label: 'Open Notepad', icon: <Play size={14} />, prompt: 'Open notepad' },
    { label: 'Open VS Code', icon: <Play size={14} />, prompt: 'Open VS Code' },
    { label: 'Create Desktop Folder', icon: <FolderPlus size={14} />, prompt: 'Create a folder called Workspace on Desktop' },
    { label: 'Security Audit', icon: <ShieldCheck size={14} />, prompt: 'Run security vulnerability scan on local targets' }
  ]

  return (
    <div className="quickbar">
      {actions.map((act, index) => (
        <button
          key={index}
          className="quick-action"
          onClick={() => onAction(act.prompt)}
          style={act.label.includes('⚡') ? { borderColor: 'rgba(0, 212, 255, 0.4)', background: 'rgba(0, 212, 255, 0.06)' } : {}}
        >
          <span className="icon">{act.icon}</span>
          <span>{act.label}</span>
        </button>
      ))}
    </div>
  )
}