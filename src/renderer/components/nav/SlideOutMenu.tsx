import React from 'react'
import {
  Plus,
  MessageSquare,
  Bot,
  Wrench,
  Terminal,
  Folder,
  Brain,
  Cpu,
  Smartphone,
  Activity,
  Settings,
  X,
  ShieldCheck
} from 'lucide-react'
import { NavPage } from '../../../shared/types'
import { useUIStore } from '../../stores/uiStore'
import { useChatStore } from '../../stores/chatStore'

interface SlideOutMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
  onOpenMemory: () => void
  onOpenPhone: () => void
}

export function SlideOutMenu({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenMemory,
  onOpenPhone
}: SlideOutMenuProps) {
  const { currentPage, setCurrentPage } = useUIStore()
  const clearMessages = useChatStore((s) => s.clearMessages)
  const addMessage = useChatStore((s) => s.addMessage)

  const handleNewChat = () => {
    clearMessages()
    addMessage({
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: 'New session initiated. ULTRON Neural Core ready. How may I assist you today, Sukesh?',
      timestamp: Date.now()
    })
    setCurrentPage('home')
    onClose()
  }

  const handleSelectNav = (page: NavPage) => {
    if (page === 'settings') {
      onOpenSettings()
    } else if (page === 'memory') {
      onOpenMemory()
    } else if (page === 'phone' || page === 'calls' || page === 'messages') {
      onOpenPhone()
    } else {
      setCurrentPage(page)
    }
    onClose()
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`slide-menu-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Slide-out drawer */}
      <aside className={`slide-menu-drawer ${isOpen ? 'open' : ''}`}>
        <div className="slide-menu-header">
          <div className="slide-menu-title-wrap">
            <span className="slide-menu-tag">NAVIGATION</span>
            <h3 className="slide-menu-title">MENU</h3>
          </div>
          <button
            className="slide-menu-close-btn"
            onClick={onClose}
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Section 1: MENU */}
        <div className="slide-menu-section">
          <div className="slide-menu-section-title">MENU</div>

          <button className="slide-menu-item new-chat-btn" onClick={handleNewChat}>
            <span className="slide-menu-item-icon">
              <Plus size={16} />
            </span>
            <span className="slide-menu-item-label">New Chat</span>
          </button>

          <button
            className={`slide-menu-item ${currentPage === 'home' || currentPage === 'ai' ? 'active' : ''}`}
            onClick={() => handleSelectNav('home')}
          >
            <span className="slide-menu-item-icon">
              <MessageSquare size={16} />
            </span>
            <span className="slide-menu-item-label">Chats</span>
          </button>

          <button
            className={`slide-menu-item ${currentPage === 'ai' ? 'active' : ''}`}
            onClick={() => handleSelectNav('ai')}
          >
            <span className="slide-menu-item-icon">
              <Bot size={16} />
            </span>
            <span className="slide-menu-item-label">Agents</span>
          </button>

          <button
            className={`slide-menu-item ${currentPage === 'apps' ? 'active' : ''}`}
            onClick={() => handleSelectNav('apps')}
          >
            <span className="slide-menu-item-icon">
              <Wrench size={16} />
            </span>
            <span className="slide-menu-item-label">Tools</span>
          </button>

          <button
            className={`slide-menu-item ${currentPage === 'powershell' ? 'active' : ''}`}
            onClick={() => handleSelectNav('powershell')}
          >
            <span className="slide-menu-item-icon">
              <Terminal size={16} />
            </span>
            <span className="slide-menu-item-label">Terminal</span>
          </button>

          <button
            className={`slide-menu-item ${currentPage === 'files' ? 'active' : ''}`}
            onClick={() => handleSelectNav('files')}
          >
            <span className="slide-menu-item-icon">
              <Folder size={16} />
            </span>
            <span className="slide-menu-item-label">Files</span>
          </button>
        </div>

        {/* Section 2: FEATURES */}
        <div className="slide-menu-section">
          <div className="slide-menu-section-title">FEATURES</div>

          <button
            className={`slide-menu-item ${currentPage === 'memory' ? 'active' : ''}`}
            onClick={() => handleSelectNav('memory')}
          >
            <span className="slide-menu-item-icon">
              <Brain size={16} />
            </span>
            <span className="slide-menu-item-label">Memory</span>
          </button>

          <button
            className={`slide-menu-item ${currentPage === 'threat-intel' ? 'active' : ''}`}
            onClick={() => handleSelectNav('threat-intel')}
          >
            <span className="slide-menu-item-icon">
              <Cpu size={16} />
            </span>
            <span className="slide-menu-item-label">Automation</span>
          </button>

          <button
            className={`slide-menu-item ${currentPage === 'phone' ? 'active' : ''}`}
            onClick={() => handleSelectNav('phone')}
          >
            <span className="slide-menu-item-icon">
              <Smartphone size={16} />
            </span>
            <span className="slide-menu-item-label">Phone Control</span>
          </button>

          <button
            className={`slide-menu-item ${currentPage === 'cybersecurity' ? 'active' : ''}`}
            onClick={() => handleSelectNav('cybersecurity')}
          >
            <span className="slide-menu-item-icon">
              <Activity size={16} />
            </span>
            <span className="slide-menu-item-label">System Monitor</span>
          </button>
        </div>

        {/* Section 3: SETTINGS */}
        <div className="slide-menu-section">
          <div className="slide-menu-section-title">SETTINGS</div>

          <button
            className={`slide-menu-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => handleSelectNav('settings')}
          >
            <span className="slide-menu-item-icon">
              <Settings size={16} />
            </span>
            <span className="slide-menu-item-label">Settings</span>
          </button>
        </div>

        {/* Bottom Core Status Badge */}
        <div className="slide-menu-footer">
          <div className="core-status-pill">
            <span className="pulse-indicator-green" />
            <div className="core-status-text">
              <span className="core-status-primary">ULTRON CORE</span>
              <span className="core-status-tag">ACTIVE</span>
            </div>
          </div>
          <div className="zero-trust-label">
            <ShieldCheck size={12} color="#00e676" />
            <span>Zero-Trust Mode <strong>ENFORCED</strong></span>
          </div>
        </div>
      </aside>
    </>
  )
}
