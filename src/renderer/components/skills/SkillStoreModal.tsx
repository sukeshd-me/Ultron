import React, { useState, useEffect } from 'react'
import { PluginManifest, PluginCategory } from '../../../shared/types'

interface SkillStoreModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SkillStoreModal: React.FC<SkillStoreModalProps> = ({ isOpen, onClose }) => {
  const [plugins, setPlugins] = useState<PluginManifest[]>([])
  const [category, setCategory] = useState<string>('ALL')

  const categories = ['ALL', 'Featured', 'Productivity', 'Developer', 'Research', 'Windows', 'Android', 'Utilities']

  const loadPlugins = async () => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.plugins?.list) {
        const list = await bridge.plugins.list()
        setPlugins(list || [])
      }
    } catch (err) {
      console.warn('Failed to load plugins:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadPlugins()
    }
  }, [isOpen])

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.plugins?.toggle) {
        await bridge.plugins.toggle(id, !current)
        loadPlugins()
      }
    } catch (err) {
      console.warn('Failed to toggle plugin:', err)
    }
  }

  if (!isOpen) return null

  const filtered = category === 'ALL' ? plugins : plugins.filter(p => p.category === category)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🧩</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Skill Store & Plugin Registry</h2>
              <p className="text-[11px] text-gray-400">Verified and sandboxed extensions for ULTRON</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">
            ✕
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 overflow-x-auto bg-black/40">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-xs px-3 py-1 rounded-full font-mono transition-colors ${
                category === c ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Plugin Grid */}
        <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto">
          {filtered.map((p) => (
            <div key={p.id} className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{p.name}</span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                    p.trustState === 'BUILT_IN' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {p.trustState}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">v{p.version} • by {p.publisher}</div>
                <div className="text-xs text-gray-300 mt-2">{p.description}</div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] text-gray-400 font-mono">
                  Permissions: {p.permissions.join(', ') || 'None'}
                </div>
                <button
                  onClick={() => handleToggle(p.id, p.enabled)}
                  className={`text-xs px-3 py-1 rounded font-semibold transition-colors ${
                    p.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {p.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
