// src/renderer/components/skills/SkillsModal.tsx — Modular Skills Architecture Catalog
import React, { useState, useEffect } from 'react'
import {
  Boxes,
  X,
  CheckCircle2,
  Laptop,
  Smartphone,
  Globe,
  FolderTree,
  Code2,
  Search,
  Brain,
  Eye,
  Terminal,
  Activity,
  ShieldCheck
} from 'lucide-react'
import { SkillDefinition } from '../../../shared/skills/skills.types'

interface SkillsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SKILL_ICONS: Record<string, React.ReactNode> = {
  windows: <Laptop size={18} color="#00d4ff" />,
  android: <Smartphone size={18} color="#00e676" />,
  browser: <Globe size={18} color="#3b82f6" />,
  files: <FolderTree size={18} color="#ffd600" />,
  coding: <Code2 size={18} color="#f97316" />,
  research: <Search size={18} color="#a855f7" />,
  memory: <Brain size={18} color="#ec4899" />,
  vision: <Eye size={18} color="#06b6d4" />,
  developer: <Terminal size={18} color="#10b981" />,
  system: <Activity size={18} color="#6366f1" />
}

export function SkillsModal({ isOpen, onClose }: SkillsModalProps) {
  const [skills, setSkills] = useState<SkillDefinition[]>([])
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    const ultron = (window as any).ultron
    if (ultron?.skills?.list) {
      ultron.skills
        .list()
        .then((list: SkillDefinition[]) => {
          setSkills(list || [])
          if (list && list.length > 0) setSelectedSkillId(list[0].id)
        })
        .catch((e: any) => console.warn('[Skills] List error:', e))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedSkill = skills.find((s) => s.id === selectedSkillId) || skills[0]

  return (
    <div className="flyout-overlay" onClick={onClose}>
      <div
        className="skills-modal-dialog glass-panel custom-scrollbar animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="skills-modal-header">
          <div className="skills-header-left">
            <div className="skills-icon-badge">
              <Boxes size={18} color="#00d4ff" />
            </div>
            <div>
              <span className="flyout-tag">MODULAR CAPABILITY SYSTEM</span>
              <h3 className="skills-modal-title">ULTRON SKILLS REGISTRY</h3>
            </div>
          </div>
          <button className="flyout-close-btn" onClick={onClose} title="Close Skills">
            <X size={16} />
          </button>
        </div>

        <div className="skills-modal-body">
          {/* Left Column: List of 10 Skills */}
          <div className="skills-sidebar custom-scrollbar">
            {skills.map((skill) => {
              const icon = SKILL_ICONS[skill.id] || <Boxes size={16} />
              const isSelected = skill.id === selectedSkillId

              return (
                <button
                  key={skill.id}
                  type="button"
                  className={`skill-list-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSkillId(skill.id)}
                >
                  <div className="skill-item-icon">{icon}</div>
                  <div className="skill-item-info">
                    <span className="skill-item-name">{skill.name}</span>
                    <span className="skill-item-tools-count">
                      {skill.tools.length} tool{skill.tools.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {skill.availability === 'READY' && (
                    <span className="skill-ready-dot" title="Ready" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Right Column: Selected Skill Details */}
          <div className="skills-detail-panel custom-scrollbar">
            {selectedSkill ? (
              <div className="skill-detail-card">
                <div className="skill-detail-header">
                  <div className="skill-detail-icon-wrap">
                    {SKILL_ICONS[selectedSkill.id] || <Boxes size={24} />}
                  </div>
                  <div>
                    <h4 className="skill-detail-title">{selectedSkill.name}</h4>
                    <span className="skill-id-badge">ID: {selectedSkill.id}</span>
                  </div>
                  <div className="skill-status-pill ready">
                    <CheckCircle2 size={12} />
                    <span>{selectedSkill.availability}</span>
                  </div>
                </div>

                <p className="skill-detail-desc">{selectedSkill.description}</p>

                {/* Capabilities */}
                <div className="skill-sub-section">
                  <h5 className="skill-sub-title">CORE CAPABILITIES</h5>
                  <div className="skill-caps-list">
                    {selectedSkill.capabilities.map((cap, i) => (
                      <div key={i} className="skill-cap-item">
                        <span className="skill-cap-bullet" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div className="skill-sub-section">
                  <h5 className="skill-sub-title">ATTACHED TOOLS</h5>
                  <div className="skill-tools-wrap">
                    {selectedSkill.tools.map((tool, i) => (
                      <span key={i} className="skill-tool-badge">
                        <code>{tool}</code>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Permissions */}
                <div className="skill-sub-section">
                  <h5 className="skill-sub-title">SECURITY CLEARANCE</h5>
                  <div className="skill-perms-row">
                    <ShieldCheck size={14} color="#00e676" />
                    <span>Enforces Permission Category: <strong>{selectedSkill.permissions[0]}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="skills-empty-placeholder">Select a skill to inspect capabilities</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
