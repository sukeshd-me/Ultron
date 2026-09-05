// src/renderer/components/developer/DeveloperModal.tsx — Developer Mode Inspector
import React, { useState, useEffect } from 'react'
import {
  Code2,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  Layers,
  FileCode,
  RotateCw,
  X
} from 'lucide-react'

interface DeveloperModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeveloperModal({ isOpen, onClose }: DeveloperModalProps) {
  const [activeTab, setActiveTab] = useState<'project' | 'typescript' | 'git'>('project')
  const [projectInfo, setProjectInfo] = useState<any>(null)
  const [tsResult, setTsResult] = useState<{
    clean: boolean
    errors: string[]
    count: number
  } | null>(null)
  const [tsRunning, setTsRunning] = useState(false)
  const [gitInfo, setGitInfo] = useState<{
    branch: string
    status: string
    recentCommits: string[]
  } | null>(null)
  const [gitLoading, setGitLoading] = useState(false)

  const ultron = (window as any).ultron

  useEffect(() => {
    if (!isOpen) return

    // Load initial project info
    if (ultron?.developer?.inspectProject) {
      ultron.developer
        .inspectProject()
        .then((res: any) => setProjectInfo(res))
        .catch((e: any) => console.warn('[Developer] Inspect error:', e))
    }

    // Load Git status
    loadGitStatus()
  }, [isOpen])

  const loadGitStatus = async () => {
    if (!ultron?.developer?.gitStatus) return
    setGitLoading(true)
    try {
      const res = await ultron.developer.gitStatus()
      setGitInfo(res)
    } catch (e) {
      console.warn('[Developer] Git error:', e)
    } finally {
      setGitLoading(false)
    }
  }

  const runTypescriptCheck = async () => {
    if (!ultron?.developer?.checkTypescript) return
    setTsRunning(true)
    try {
      const res = await ultron.developer.checkTypescript()
      setTsResult(res)
    } catch (e: any) {
      setTsResult({ clean: false, errors: [e.message || 'Check failed'], count: 1 })
    } finally {
      setTsRunning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="flyout-overlay" onClick={onClose}>
      <div
        className="developer-modal-dialog glass-panel custom-scrollbar animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="developer-modal-header">
          <div className="dev-header-left">
            <div className="dev-icon-badge">
              <Code2 size={18} color="#00d4ff" />
            </div>
            <div>
              <span className="flyout-tag">INTERNAL CODEBASE DIAGNOSTICS</span>
              <h3 className="developer-modal-title">DEVELOPER MODE</h3>
            </div>
          </div>
          <button className="flyout-close-btn" onClick={onClose} title="Close Developer Mode">
            <X size={16} />
          </button>
        </div>

        {/* Developer Mode Tabs */}
        <div className="dev-tabs-bar">
          <button
            className={`dev-tab-btn ${activeTab === 'project' ? 'active' : ''}`}
            onClick={() => setActiveTab('project')}
          >
            <Layers size={14} />
            <span>Architecture & Files</span>
          </button>
          <button
            className={`dev-tab-btn ${activeTab === 'typescript' ? 'active' : ''}`}
            onClick={() => setActiveTab('typescript')}
          >
            <FileCode size={14} />
            <span>TypeScript Verification</span>
          </button>
          <button
            className={`dev-tab-btn ${activeTab === 'git' ? 'active' : ''}`}
            onClick={() => setActiveTab('git')}
          >
            <GitBranch size={14} />
            <span>Git Awareness</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="developer-modal-body custom-scrollbar">
          {/* Architecture & Files */}
          {activeTab === 'project' && (
            <div className="dev-project-view">
              <div className="dev-metrics-grid">
                <div className="dev-metric-tile">
                  <span className="dev-metric-label">VERSION</span>
                  <span className="dev-metric-value highlight">
                    {projectInfo?.version || '1.0.3'}
                  </span>
                </div>
                <div className="dev-metric-tile">
                  <span className="dev-metric-label">FILES COUNT</span>
                  <span className="dev-metric-value">
                    {projectInfo?.totalFiles ?? '—'}
                  </span>
                </div>
                <div className="dev-metric-tile">
                  <span className="dev-metric-label">FRAMEWORK</span>
                  <span className="dev-metric-value">Electron + React</span>
                </div>
                <div className="dev-metric-tile">
                  <span className="dev-metric-label">SAFETY LAYER</span>
                  <span className="dev-metric-value text-emerald-400">Enforced</span>
                </div>
              </div>

              <div className="dev-section-title">PROJECT OVERVIEW</div>
              <div className="dev-code-block">
                {projectInfo ? (
                  <pre>{JSON.stringify(projectInfo, null, 2)}</pre>
                ) : (
                  <div className="dev-loading-row">
                    <RotateCw size={14} className="thinking-spin" />
                    <span>Analyzing project structure...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TypeScript Verification */}
          {activeTab === 'typescript' && (
            <div className="dev-ts-view">
              <div className="dev-action-banner">
                <div>
                  <h4 className="dev-banner-title">Authentic TypeScript Check</h4>
                  <p className="dev-banner-sub">
                    Executes `npx tsc --noEmit` against actual source files. Zero fabricated errors.
                  </p>
                </div>
                <button
                  type="button"
                  className="dev-run-btn"
                  onClick={runTypescriptCheck}
                  disabled={tsRunning}
                >
                  {tsRunning ? (
                    <>
                      <RotateCw size={14} className="thinking-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} fill="currentColor" />
                      <span>Run Verification</span>
                    </>
                  )}
                </button>
              </div>

              {tsResult && (
                <div
                  className={`dev-ts-result-box ${tsResult.clean ? 'clean' : 'errors'}`}
                >
                  <div className="dev-ts-result-header">
                    {tsResult.clean ? (
                      <>
                        <CheckCircle2 size={18} color="#00e676" />
                        <span className="text-emerald-400 font-semibold">
                          TypeScript check passed clean (0 errors)
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={18} color="#ff5252" />
                        <span className="text-rose-400 font-semibold">
                          Found {tsResult.count} TypeScript error{tsResult.count > 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>

                  {tsResult.errors.length > 0 && (
                    <div className="dev-error-list custom-scrollbar">
                      {tsResult.errors.map((err, i) => (
                        <div key={i} className="dev-error-item">
                          <code>{err}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Git Awareness */}
          {activeTab === 'git' && (
            <div className="dev-git-view">
              <div className="dev-action-banner">
                <div>
                  <h4 className="dev-banner-title">Git Repository Status</h4>
                  <p className="dev-banner-sub">
                    Read-only status inspection. Automatic remote publishing or git push is prohibited.
                  </p>
                </div>
                <button
                  type="button"
                  className="dev-refresh-btn"
                  onClick={loadGitStatus}
                  disabled={gitLoading}
                >
                  <RotateCw size={14} className={gitLoading ? 'thinking-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {gitInfo ? (
                <div className="dev-git-details">
                  <div className="dev-git-branch-row">
                    <span className="dev-git-label">CURRENT BRANCH:</span>
                    <span className="dev-git-branch-badge">{gitInfo.branch || 'main'}</span>
                  </div>

                  <div className="dev-section-title">WORKING TREE STATUS</div>
                  <pre className="dev-git-output">{gitInfo.status}</pre>

                  {gitInfo.recentCommits && gitInfo.recentCommits.length > 0 && (
                    <>
                      <div className="dev-section-title">RECENT COMMITS</div>
                      <div className="dev-commit-list">
                        {gitInfo.recentCommits.map((c, i) => (
                          <div key={i} className="dev-commit-item">
                            <span className="dev-commit-dot" />
                            <span className="dev-commit-text">{c}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="dev-loading-row">
                  <RotateCw size={14} className="thinking-spin" />
                  <span>Reading repository state...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
