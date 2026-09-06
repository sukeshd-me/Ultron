import React, { useState, useEffect } from 'react'
import { RepositoryMap, CodeImpactAnalysis, GitRepoStatus } from '../../../shared/types'

interface RepoGitModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'map' | 'git' | 'impact'

export const RepoGitModal: React.FC<RepoGitModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('map')
  const [repoMap, setRepoMap] = useState<RepositoryMap | null>(null)
  const [gitStatus, setGitStatus] = useState<GitRepoStatus | null>(null)
  const [gitDiff, setGitDiff] = useState<string>('')
  const [proposedChange, setProposedChange] = useState('')
  const [impactAnalysis, setImpactAnalysis] = useState<CodeImpactAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [repoQuery, setRepoQuery] = useState('')
  const [queryResult, setQueryResult] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      if ((window as any).ultron?.repoIntelligence) {
        const map = await (window as any).ultron.repoIntelligence.getRepoMap()
        setRepoMap(map)
      }
      if ((window as any).ultron?.gitIntelligence) {
        const status = await (window as any).ultron.gitIntelligence.getStatus()
        setGitStatus(status)
        const diff = await (window as any).ultron.gitIntelligence.getDiff()
        setGitDiff(diff)
      }
    } catch (err) {
      console.error('Failed to load repo/git data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const handleImpactAnalyze = async () => {
    if (!proposedChange.trim()) return
    setLoading(true)
    try {
      if ((window as any).ultron?.codeImpact) {
        const res = await (window as any).ultron.codeImpact.analyzeImpact(proposedChange)
        setImpactAnalysis(res)
      }
    } catch (err) {
      console.error('Failed to analyze code impact:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRepoQuery = async () => {
    if (!repoQuery.trim()) return
    setLoading(true)
    try {
      if ((window as any).ultron?.repoIntelligence) {
        const res = await (window as any).ultron.repoIntelligence.query(repoQuery)
        setQueryResult(res)
      }
    } catch (err) {
      console.error('Failed to query repo intelligence:', err)
      setQueryResult('Query failed: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl h-[85vh] bg-[#090a0f] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌿</span>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-white uppercase font-mono">
                Repository & Git Intelligence 2.0
              </h2>
              <p className="text-[11px] text-gray-400">
                Deep repository architecture mapping, Git status auditing, and pre-flight code impact analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('map')}
            className={`py-3 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'map'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>🗺️</span> Repo Architecture Map
          </button>
          <button
            onClick={() => setActiveTab('git')}
            className={`py-3 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'git'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>🌿</span> Git Status & Diffs
            {gitStatus?.changedFiles?.length ? (
              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.2 rounded">
                {gitStatus.changedFiles.length}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('impact')}
            className={`py-3 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'impact'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>⚡</span> Code Change Impact Analysis
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: REPOSITORY ARCHITECTURE MAP */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              {/* Query Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder='Ask: "Where is authentication implemented?" or "What handles Android communication?"...'
                  value={repoQuery}
                  onChange={(e) => setRepoQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRepoQuery()}
                  className="flex-1 bg-[#12141c] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                />
                <button
                  onClick={handleRepoQuery}
                  disabled={loading}
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all"
                >
                  Ask Repo ↵
                </button>
              </div>

              {queryResult && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 font-mono leading-relaxed flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div className="flex-1 whitespace-pre-wrap">{queryResult}</div>
                </div>
              )}

              {/* Repo Architecture Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <span>🏗️</span> Architecture & Services
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {repoMap?.services?.length ? (
                      <ul className="space-y-1 list-disc list-inside font-mono">
                        {repoMap.services.map((s, i) => (
                          <li key={i} className="text-gray-300">{s}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 font-mono">Core Services: Central Agent, Model Router, Memory DB, Risk Engine, Verification</div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <span>🧩</span> Components & UI Layer
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {repoMap?.components?.length ? (
                      <ul className="space-y-1 list-disc list-inside font-mono">
                        {repoMap.components.map((c, i) => (
                          <li key={i} className="text-gray-300">{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 font-mono">UltronCore 3D, Command Palette, Command Bar, Chat View, SlideOut Menu</div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <span>🚀</span> Entry Points & Build Config
                  </div>
                  <div className="text-[11px] text-gray-300 font-mono space-y-1">
                    <div>Main: src/main/index.ts</div>
                    <div>Preload: src/preload/index.ts</div>
                    <div>Renderer: src/renderer/main.tsx</div>
                    <div>Electron Builder: electron-builder.yml</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <span>🧪</span> Verification & Tests
                  </div>
                  <div className="text-[11px] text-gray-300 font-mono space-y-1">
                    <div>TypeScript: Strict typechecking via tsc</div>
                    <div>Verification Engine: Step outcome confirmation</div>
                    <div>Safety Boundaries: Read-only audits & sandboxed execution</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GIT STATUS & DIFFS */}
          {activeTab === 'git' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Current Branch</span>
                    <div className="text-sm font-bold text-cyan-300 font-mono">
                      {gitStatus?.branch || 'main'}
                    </div>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Working Tree State</span>
                    <div className="text-sm font-semibold text-white font-mono">
                      {gitStatus?.isClean ? 'Clean' : 'Modified (Uncommitted Changes)'}
                    </div>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Changed Files</span>
                    <div className="text-sm font-semibold text-yellow-400 font-mono">
                      {gitStatus?.changedFiles?.length || 0}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-gray-500">
                  ⚠️ Safety Rule: Push & publish are strictly manual.
                </div>
              </div>

              {/* Changed Files List */}
              {gitStatus?.changedFiles && gitStatus.changedFiles.length > 0 && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-white font-mono uppercase">Uncommitted Changes</div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {gitStatus.changedFiles.map((file, idx) => (
                      <div key={idx} className="text-xs font-mono text-gray-300 flex items-center gap-2">
                        <span className="text-yellow-400">M</span>
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Git Diff Output */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="text-xs font-bold text-gray-400 font-mono uppercase">Recent Working Tree Diff</div>
                <pre className="text-[11px] font-mono text-gray-300 bg-black/60 p-3 rounded-lg overflow-x-auto max-h-60 leading-relaxed">
                  {gitDiff || 'No uncommitted changes in current working tree.'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: CODE CHANGE IMPACT ANALYSIS */}
          {activeTab === 'impact' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="text-xs font-bold text-white font-mono uppercase">
                  Predict Pre-Flight Impact of Code Changes
                </div>
                <p className="text-[11px] text-gray-400">
                  Enter a proposed modification (e.g., "Change the model routing system") to audit affected modules, dependencies, tests, and risks.
                </p>
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder='e.g., "Change the model routing system" or "Upgrade database schema"...'
                    value={proposedChange}
                    onChange={(e) => setProposedChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleImpactAnalyze()}
                    className="flex-1 bg-[#12141c] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                  />
                  <button
                    onClick={handleImpactAnalyze}
                    disabled={loading}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all"
                  >
                    Analyze Impact ⚡
                  </button>
                </div>
              </div>

              {impactAnalysis && (
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-cyan-300 font-mono">
                      IMPACT PREVIEW: {impactAnalysis.proposedChange}
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded font-bold ${
                        impactAnalysis.riskLevel === 'HIGH'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : impactAnalysis.riskLevel === 'MEDIUM'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}
                    >
                      Risk: {impactAnalysis.riskLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                      <div className="text-gray-500 uppercase text-[10px]">Affected Files</div>
                      <ul className="list-disc list-inside text-gray-300 text-[11px]">
                        {impactAnalysis.affectedFiles?.map((f, i) => (
                          <li key={i}>{f}</li>
                        )) || <li>None identified</li>}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                      <div className="text-gray-500 uppercase text-[10px]">Affected Modules</div>
                      <ul className="list-disc list-inside text-gray-300 text-[11px]">
                        {impactAnalysis.affectedModules?.map((m, i) => (
                          <li key={i}>{m}</li>
                        )) || <li>None identified</li>}
                      </ul>
                    </div>
                  </div>

                  {impactAnalysis.potentialRisks && impactAnalysis.potentialRisks.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs font-mono text-red-300 space-y-1">
                      <div className="text-red-400 uppercase text-[10px] font-bold">Potential Risks</div>
                      <ul className="list-disc list-inside text-[11px]">
                        {impactAnalysis.potentialRisks.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
