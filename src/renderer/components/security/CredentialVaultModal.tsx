import React, { useState, useEffect } from 'react'
import { CredentialItem } from '../../../shared/types'

interface CredentialVaultModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CredentialVaultModal: React.FC<CredentialVaultModalProps> = ({ isOpen, onClose }) => {
  const [credentials, setCredentials] = useState<CredentialItem[]>([])
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, string>>({})
  const [newKey, setNewKey] = useState('')
  const [newService, setNewService] = useState('NVIDIA')

  const loadCredentials = async () => {
    setLoading(true)
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.credentialsVault?.list) {
        const list = await bridge.credentialsVault.list()
        setCredentials(list || [])
      }
    } catch (err) {
      console.warn('Failed to load vault credentials:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCredentials()
    }
  }, [isOpen])

  const handleTest = async (id: string) => {
    try {
      setTestResults(prev => ({ ...prev, [id]: 'Testing...' }))
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.credentialsVault?.test) {
        const res = await bridge.credentialsVault.test(id)
        setTestResults(prev => ({
          ...prev,
          [id]: res.success ? `Verified (${res.latencyMs}ms)` : `Failed: ${res.message}`
        }))
      }
    } catch (err: any) {
      setTestResults(prev => ({ ...prev, [id]: 'Error' }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey.trim()) return
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.credentialsVault?.save) {
        await bridge.credentialsVault.save({
          id: 'nvidia-api-key',
          name: 'NVIDIA API Foundation',
          service: 'NVIDIA Cloud Inference',
          secretValue: newKey
        })
        setNewKey('')
        loadCredentials()
      }
    } catch (err) {
      console.warn('Failed to save credential:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🔐</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Secure Credential Vault</h2>
              <p className="text-[11px] text-gray-400">Windows DPAPI hardware encrypted token & key isolation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Security Banner */}
          <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3 text-cyan-200 text-xs">
            <span className="text-lg">🛡️</span>
            <div>
              <span className="font-semibold">Zero Plaintext Guarantee:</span> Secrets stored in the DPAPI vault are never written to SQLite tables, prompt templates, logs, or chat transcripts. Values are masked as <code className="bg-black/60 px-1 py-0.5 rounded">••••••••••••••••</code>.
            </div>
          </div>

          {/* Credentials List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono text-gray-400 uppercase">Configured Secrets</h3>
            {credentials.map((cred) => (
              <div key={cred.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{cred.name}</span>
                    <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                      DPAPI SECURED
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{cred.service} • Key: ••••••••••••••••</div>
                </div>

                <div className="flex items-center gap-3">
                  {testResults[cred.id] && (
                    <span className="text-xs font-mono text-cyan-400">{testResults[cred.id]}</span>
                  )}
                  <button
                    onClick={() => handleTest(cred.id)}
                    className="bg-white/10 hover:bg-white/20 text-xs text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Update / Add Secret */}
          <form onSubmit={handleSave} className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-mono text-gray-400 uppercase">Update NVIDIA API Key</h3>
            <div className="flex gap-3">
              <input
                type="password"
                placeholder="Enter new NVIDIA API token (nvapi-...)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                Save to Vault
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
