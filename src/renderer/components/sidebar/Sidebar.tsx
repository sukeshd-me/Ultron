import React from 'react'
import {
  Home,
  Bot,
  Phone,
  PhoneCall,
  MessageSquare,
  Users,
  Search,
  Shield,
  FileText,
  Scan,
  Zap,
  AlertCircle,
  Network,
  Folder,
  LayoutGrid,
  Terminal,
  Brain,
  Settings,
  Puzzle
} from 'lucide-react'
import { NavPage } from '../../../shared/types'
import { useUIStore } from '../../stores/uiStore'

interface NavItem {
  id: NavPage
  label: string
  icon: React.ReactNode
  section?: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Command Center', icon: <Home size={16} />, section: 'MAIN' },
  { id: 'ai', label: 'AI Intelligence', icon: <Bot size={16} /> },
  { id: 'research', label: 'Web Research', icon: <Search size={16} /> },

  { id: 'phone', label: 'Android ADB', icon: <Phone size={16} />, section: 'COMMUNICATION' },
  { id: 'calls', label: 'Phone Calls', icon: <PhoneCall size={16} /> },
  { id: 'messages', label: 'SMS Messages', icon: <MessageSquare size={16} /> },
  { id: 'contacts', label: 'Contacts Resolver', icon: <Users size={16} /> },

  { id: 'cybersecurity', label: 'Cyber Defense', icon: <Shield size={16} />, section: 'SECURITY & OPS' },
  { id: 'vulnerability-scanner', label: 'Vuln Scanner', icon: <Scan size={16} /> },
  { id: 'threat-intel', label: 'Threat Intel', icon: <Zap size={16} /> },
  { id: 'incidents', label: 'Incident Reports', icon: <AlertCircle size={16} /> },
  { id: 'network', label: 'Network Monitor', icon: <Network size={16} /> },

  { id: 'files', label: 'Filesystem Ops', icon: <Folder size={16} />, section: 'SYSTEM CONTROL' },
  { id: 'apps', label: 'App Automation', icon: <LayoutGrid size={16} /> },
  { id: 'powershell', label: 'Safe PowerShell', icon: <Terminal size={16} /> },
  { id: 'memory', label: 'SQLite Memory', icon: <Brain size={16} /> },
  { id: 'logs', label: 'Audit Logs', icon: <FileText size={16} /> },

  { id: 'settings', label: 'System Settings', icon: <Settings size={16} />, section: 'CONFIG' },
  { id: 'plugins', label: 'Plugins Hub', icon: <Puzzle size={16} /> }
]

export function Sidebar() {
  const { currentPage, setCurrentPage } = useUIStore()

  return (
    <nav className="sidebar">
      {NAV_ITEMS.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.section && <div className="sidebar-section">{item.section}</div>}
          <button
            className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </nav>
  )
}