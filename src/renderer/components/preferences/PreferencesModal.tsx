// src/renderer/components/preferences/PreferencesModal.tsx — V1.0.5 Personal Preference Engine
import React, { useEffect, useState } from 'react'
import { Sliders, Check, RotateCcw, X, Plus, Trash2, Key } from 'lucide-react'
import { UserPreference } from '../../../shared/types'

interface PreferencesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreference[]>([])
  const [loading, setLoading] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newCategory, setNewCategory] = useState('general')

  const loadPreferences = async () => {
    setLoading(true)
    const ultron = (window as any).ultron
    if (ultron?.preferences?.getAll) {
      try {
        const list = await ultron.preferences.getAll()
        setPreferences(list || [])
      } catch (err) {
        console.error('Failed to load preferences', err)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadPreferences()
    }
  }, [isOpen])

  const handleSet = async (key: string, value: any, category: string = 'general') => {
    const ultron = (window as any).ultron
    if (ultron?.preferences?.set) {
      await ultron.preferences.set(key, value, category)
      loadPreferences()
    }
  }

  const handleDelete = async (key: string) => {
    const ultron = (window as any).ultron
    if (ultron?.preferences?.delete) {
      await ultron.preferences.delete(key)
      loadPreferences()
    }
  }

  const handleReset = async () => {
    const ultron = (window as any).ultron
    if (ultron?.preferences?.reset) {
      await ultron.preferences.reset()
      loadPreferences()
    }
  }

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey.trim()) return
    let parsedVal: any = newValue
    try {
      parsedVal = JSON.parse(newValue)
    } catch {
      parsedVal = newValue
    }
    await handleSet(newKey.trim(), parsedVal, newCategory)
    setNewKey('')
    setNewValue('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f1f28]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[#00d4ff]" />
            <div>
              <h2 className="text-base font-bold text-white">Personal Preferences</h2>
              <p className="text-xs text-gray-400">Manage long-term agent behaviors, styles and defaults</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 hover:text-white bg-[#14141c] border border-[#1f1f28] rounded-lg transition"
              title="Reset all preferences to defaults"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 custom-scrollbar">
          {/* Preset Core Preferences */}
          <div className="space-y-3">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Core Preferences</span>

            <div className="space-y-2">
              {/* Preferred Model */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#121218] border border-[#1f1f28]">
                <div>
                  <div className="text-xs font-semibold text-white">Preferred Model</div>
                  <div className="text-[11px] text-gray-400">Default model used for general conversations</div>
                </div>
                <select
                  value={preferences.find((p) => p.key === 'preferred_model')?.value || 'google/gemini-3.8-flash'}
                  onChange={(e) => handleSet('preferred_model', e.target.value, 'model')}
                  className="bg-[#0a0a0e] text-xs text-[#00d4ff] border border-[#1f1f28] rounded-lg px-2.5 py-1.5 focus:border-[#00d4ff] outline-none"
                >
                  <option value="google/gemini-3.8-flash">google/gemini-3.8-flash (Fast)</option>
                  <option value="meta/llama-3.3-70b-instruct">meta/llama-3.3-70b-instruct (Power)</option>
                  <option value="meta/llama-3.2-11b-vision-instruct">meta/llama-3.2-11b-vision (Vision)</option>
                  <option value="deepseek-ai/deepseek-r1">deepseek-ai/deepseek-r1 (Reasoning)</option>
                </select>
              </div>

              {/* Response Style */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#121218] border border-[#1f1f28]">
                <div>
                  <div className="text-xs font-semibold text-white">Response Style</div>
                  <div className="text-[11px] text-gray-400">How ULTRON structures answers</div>
                </div>
                <select
                  value={preferences.find((p) => p.key === 'response_style')?.value || 'concise'}
                  onChange={(e) => handleSet('response_style', e.target.value, 'interaction')}
                  className="bg-[#0a0a0e] text-xs text-[#00d4ff] border border-[#1f1f28] rounded-lg px-2.5 py-1.5 focus:border-[#00d4ff] outline-none"
                >
                  <option value="concise">Concise & Direct (Default)</option>
                  <option value="detailed">Comprehensive & Detailed</option>
                  <option value="technical">Technical & Code-First</option>
                </select>
              </div>

              {/* Action Verification */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#121218] border border-[#1f1f28]">
                <div>
                  <div className="text-xs font-semibold text-white">Multi-Model Verification</div>
                  <div className="text-[11px] text-gray-400">Cross-verify complex coding/reasoning with a second model</div>
                </div>
                <button
                  onClick={() => {
                    const current = preferences.find((p) => p.key === 'multi_model_verification')?.value === true
                    handleSet('multi_model_verification', !current, 'verification')
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    preferences.find((p) => p.key === 'multi_model_verification')?.value === true
                      ? 'bg-[#00d4ff]'
                      : 'bg-[#1f1f28]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      preferences.find((p) => p.key === 'multi_model_verification')?.value === true
                        ? 'translate-x-5'
                        : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Stored Preferences Table */}
          <div className="space-y-3">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Active Records</span>
            <div className="space-y-1.5">
              {preferences.map((p) => (
                <div
                  key={p.id || p.key}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d0d12] border border-[#1f1f28] text-xs"
                >
                  <div>
                    <span className="font-mono text-[#00d4ff]">{p.key}</span>
                    <span className="text-gray-500 mx-2">=</span>
                    <span className="text-white font-medium">{JSON.stringify(p.value)}</span>
                    <span className="ml-2 text-[10px] text-gray-500">({p.category})</span>
                  </div>
                  <button
                    onClick={() => handleDelete(p.key)}
                    className="text-gray-500 hover:text-red-400 transition p-1"
                    title="Delete preference"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Custom Preference */}
          <form onSubmit={handleAddCustom} className="p-3 rounded-xl bg-[#0d0d12] border border-[#1f1f28] space-y-2">
            <span className="text-xs font-semibold text-gray-300">Add Preference Key</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Key (e.g. preferred_editor)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="bg-[#050508] border border-[#1f1f28] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00d4ff] outline-none"
              />
              <input
                type="text"
                placeholder="Value (e.g. VS Code)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="bg-[#050508] border border-[#1f1f28] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00d4ff] outline-none"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 rounded-lg py-1.5 text-xs font-semibold hover:bg-[#00d4ff]/30 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
