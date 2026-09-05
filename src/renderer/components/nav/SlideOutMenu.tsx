// src/renderer/components/nav/SlideOutMenu.tsx — Clean 10-Item Navigation Menu
import React from 'react'
import {
  Plus,
  MessageSquare,
  Activity,
  Brain,
  Boxes,
  Code2,
  Smartphone,
  ShieldCheck,
  Settings,
  Info,
  X,
  Search,
  HeartPulse,
  ListTodo
} from 'lucide-react'
import { NavPage } from '../../../shared/types'
import { useUIStore } from '../../stores/uiStore'
import { useChatStore } from '../../stores/chatStore'

interface SlideOutMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: (section?: string) => void
  onOpenMemory: () => void
  onOpenPhone: () => void
  onOpenSkills: () => void
  onOpenDeveloper: () => void
  onOpenPermissions: () => void
  onOpenActivity?: () => void
  onOpenAbout?: () => void
  onOpenSearch?: () => void
  onOpenDiagnostics?: () => void
  onOpenTasks?: () => void
}

export function SlideOutMenu({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenMemory,
  onOpenPhone,
  onOpenSkills,
  onOpenDeveloper,
  onOpenPermissions,
  onOpenActivity,
  onOpenAbout,
  onOpenSearch,
  onOpenDiagnostics,
  onOpenTasks
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
    switch (page) {
      case 'settings':
        onOpenSettings()
        break
      case 'memory':
        onOpenMemory()
        break
      case 'phone':
        onOpenPhone()
        break
      case 'skills':
        onOpenSkills()
        break
      case 'developer':
        onOpenDeveloper()
        break
      case 'permissions':
        onOpenPermissions()
        break
      case 'activity':
        if (onOpenActivity) onOpenActivity()
        else setCurrentPage('activity')
        break
      case 'about':
        if (onOpenAbout) onOpenAbout()
        else onOpenSettings('about')
        break
      default:
        setCurrentPage(page)
        break
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
            <span className="slide-menu-tag">SYSTEM NAVIGATION</span>
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

        {/* 10 Items as specified in Requirement 31 */}
        <div className="slide-menu-section custom-scrollbar">
          {/* 1. New Chat */}
          <button className="slide-menu-item new-chat-btn" onClick={handleNewChat}>
            <span className="slide-menu-item-icon">
              <Plus size={16} />
            </span>
            <span className="slide-menu-item-label">New Chat</span>
          </button>

          {/* 2. Chats */}
          <button
            className={`slide-menu-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleSelectNav('home')}
          >
            <span className="slide-menu-item-icon">
              <MessageSquare size={16} />
            </span>
            <span className="slide-menu-item-label">Chats</span>
          </button>

          {/* 3. Activity */}
          <button
            className={`slide-menu-item ${currentPage === 'activity' ? 'active' : ''}`}
            onClick={() => handleSelectNav('activity')}
          >
            <span className="slide-menu-item-icon">
              <Activity size={16} />
            </span>
            <span className="slide-menu-item-label">Activity</span>
          </button>

          {/* 4. Memory */}
          <button
            className={`slide-menu-item ${currentPage === 'memory' ? 'active' : ''}`}
            onClick={() => handleSelectNav('memory')}
          >
            <span className="slide-menu-item-icon">
              <Brain size={16} />
            </span>
            <span className="slide-menu-item-label">Memory</span>
          </button>

          {/* 5. Skills */}
          <button
            className={`slide-menu-item ${currentPage === 'skills' ? 'active' : ''}`}
            onClick={() => handleSelectNav('skills')}
          >
            <span className="slide-menu-item-icon">
              <Boxes size={16} />
            </span>
            <span className="slide-menu-item-label">Skills</span>
          </button>

          {/* 6. Developer Mode */}
          <button
            className={`slide-menu-item ${currentPage === 'developer' ? 'active' : ''}`}
            onClick={() => handleSelectNav('developer')}
          >
            <span className="slide-menu-item-icon">
              <Code2 size={16} />
            </span>
            <span className="slide-menu-item-label">Developer Mode</span>
          </button>

          {/* 7. Phone */}
          <button
            className={`slide-menu-item ${currentPage === 'phone' ? 'active' : ''}`}
            onClick={() => handleSelectNav('phone')}
          >
            <span className="slide-menu-item-icon">
              <Smartphone size={16} />
            </span>
            <span className="slide-menu-item-label">Phone</span>
          </button>

          {/* 8. Permissions */}
          <button
            className={`slide-menu-item ${currentPage === 'permissions' ? 'active' : ''}`}
            onClick={() => handleSelectNav('permissions')}
          >
            <span className="slide-menu-item-icon">
              <ShieldCheck size={16} />
            </span>
            <span className="slide-menu-item-label">Permissions</span>
          </button>

          {/* Search */}
          {onOpenSearch && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenSearch()
              }}
            >
              <span className="slide-menu-item-icon">
                <Search size={16} />
              </span>
              <span className="slide-menu-item-label">Universal Search</span>
              <span className="text-[10px] font-mono text-cyan-400 ml-auto border border-cyan-500/30 px-1 py-0.5 rounded bg-cyan-950/20">
                Ctrl+K
              </span>
            </button>
          )}

          {/* Diagnostics */}
          {onOpenDiagnostics && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenDiagnostics()
              }}
            >
              <span className="slide-menu-item-icon">
                <HeartPulse size={16} />
              </span>
              <span className="slide-menu-item-label">Diagnostics</span>
            </button>
          )}

          {/* Background Tasks */}
          {onOpenTasks && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenTasks()
              }}
            >
              <span className="slide-menu-item-icon">
                <ListTodo size={16} />
              </span>
              <span className="slide-menu-item-label">Background Tasks</span>
            </button>
          )}

          {/* 9. Settings */}
          <button
            className={`slide-menu-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => handleSelectNav('settings')}
          >
            <span className="slide-menu-item-icon">
              <Settings size={16} />
            </span>
            <span className="slide-menu-item-label">Settings</span>
          </button>

          {/* 10. About */}
          <button
            className={`slide-menu-item ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => handleSelectNav('about')}
          >
            <span className="slide-menu-item-icon">
              <Info size={16} />
            </span>
            <span className="slide-menu-item-label">About</span>
          </button>
        </div>

        {/* Bottom Core Status Badge */}
        <div className="slide-menu-footer">
          <div className="core-status-pill">
            <span className="pulse-indicator-green" />
            <div className="core-status-text">
              <span className="core-status-primary">ULTRON CORE</span>
              <span className="core-status-tag">V1.0.4 ACTIVE</span>
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
