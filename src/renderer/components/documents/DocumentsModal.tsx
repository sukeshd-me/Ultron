// src/renderer/components/documents/DocumentsModal.tsx — V1.0.5 Document Intelligence
import React, { useEffect, useState } from 'react'
import {
  FileText,
  Upload,
  Search,
  BookOpen,
  Trash2,
  FileCode,
  File,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  X
} from 'lucide-react'
import { DocumentMeta, DocumentQueryResult } from '../../../shared/types'

interface DocumentsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DocumentsModal({ isOpen, onClose }: DocumentsModalProps) {
  const [documents, setDocuments] = useState<DocumentMeta[]>([])
  const [selectedDoc, setSelectedDoc] = useState<DocumentMeta | null>(null)
  const [filePathInput, setFilePathInput] = useState('')
  const [queryInput, setQueryInput] = useState('')
  const [queryResult, setQueryResult] = useState<DocumentQueryResult | null>(null)
  const [isIndexing, setIsIndexing] = useState(false)
  const [isQuerying, setIsQuerying] = useState(false)

  const loadDocuments = async () => {
    const ultron = (window as any).ultron
    if (ultron?.documents?.list) {
      try {
        const list = await ultron.documents.list()
        setDocuments(list || [])
        if (list && list.length > 0 && !selectedDoc) {
          setSelectedDoc(list[0])
        }
      } catch (err) {
        console.error('Failed to list documents', err)
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadDocuments()
    }
  }, [isOpen])

  const handleIndex = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filePathInput.trim()) return
    setIsIndexing(true)
    const ultron = (window as any).ultron
    if (ultron?.documents?.index) {
      try {
        const doc = await ultron.documents.index(filePathInput.trim())
        setFilePathInput('')
        loadDocuments()
        if (doc) setSelectedDoc(doc)
      } catch (err) {
        console.error('Failed to index document', err)
      } finally {
        setIsIndexing(false)
      }
    }
  }

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryInput.trim()) return
    setIsQuerying(true)
    const ultron = (window as any).ultron
    if (ultron?.documents?.query) {
      try {
        const res = await ultron.documents.query(queryInput.trim(), selectedDoc?.id)
        setQueryResult(res)
      } catch (err) {
        console.error('Failed to query document', err)
      } finally {
        setIsQuerying(false)
      }
    }
  }

  const handleDelete = async (docId: string) => {
    const ultron = (window as any).ultron
    if (ultron?.documents?.delete) {
      await ultron.documents.delete(docId)
      if (selectedDoc?.id === docId) setSelectedDoc(null)
      loadDocuments()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f1f28]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#a855f7]" />
            <div>
              <h2 className="text-base font-bold text-white">Document Intelligence</h2>
              <p className="text-xs text-gray-400">Index PDFs, Markdown, source files & query with citations</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Index New Document Bar */}
        <form onSubmit={handleIndex} className="py-3 flex items-center gap-2 border-b border-[#1f1f28]">
          <input
            type="text"
            placeholder="Enter absolute path to document (e.g. C:\Docs\specification.pdf or README.md)"
            value={filePathInput}
            onChange={(e) => setFilePathInput(e.target.value)}
            className="flex-1 bg-[#0e0e14] border border-[#1f1f28] rounded-xl px-3 py-2 text-xs text-white focus:border-[#a855f7] outline-none"
          />
          <button
            type="submit"
            disabled={isIndexing || !filePathInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#a855f7] text-white text-xs font-semibold rounded-xl hover:bg-[#b86df9] disabled:opacity-50 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            {isIndexing ? 'Indexing...' : 'Index Document'}
          </button>
        </form>

        {/* Content Split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 min-h-0">
          {/* Document Index List */}
          <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Indexed Documents</span>
            {documents.length === 0 ? (
              <div className="text-xs text-gray-500 py-8 text-center">No documents indexed yet.</div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 ${
                    selectedDoc?.id === doc.id
                      ? 'bg-[#181224] border-[#a855f7]'
                      : 'bg-[#0e0e14] border-[#1f1f28] hover:border-[#a855f7]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[180px]">{doc.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(doc.id)
                      }}
                      className="text-gray-500 hover:text-red-400 p-1"
                      title="Delete from index"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 truncate">{doc.filePath}</div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-[#1f1f28]/60">
                    <span>{doc.chunkCount} chunks</span>
                    <span>{new Date(doc.indexedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Document Query & Answers Panel */}
          <div className="md:col-span-2 flex flex-col bg-[#0d0d12] border border-[#1f1f28] rounded-xl p-4 overflow-hidden">
            {/* Query Form */}
            <form onSubmit={handleQuery} className="flex items-center gap-2 pb-3 border-b border-[#1f1f28]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={
                    selectedDoc
                      ? `Ask about "${selectedDoc.title}"...`
                      : 'Ask about any indexed document...'
                  }
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full bg-[#08080c] border border-[#1f1f28] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-[#a855f7] outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isQuerying || !queryInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40 text-xs font-semibold rounded-xl hover:bg-[#a855f7]/30 disabled:opacity-50 transition"
              >
                <Sparkles className="w-3.5 h-3.5" /> {isQuerying ? 'Analyzing...' : 'Ask'}
              </button>
            </form>

            {/* Answer Display */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4 custom-scrollbar">
              {queryResult ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-xl bg-[#13111c] border border-[#a855f7]/30">
                    <div className="text-[10px] uppercase font-bold text-[#a855f7] tracking-wider mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Grounded Model Answer
                    </div>
                    <div className="text-xs text-gray-100 leading-relaxed whitespace-pre-wrap">
                      {queryResult.answer}
                    </div>
                  </div>

                  {/* Citations */}
                  {queryResult.citations && queryResult.citations.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                        Grounded Citations
                      </span>
                      <div className="space-y-2">
                        {queryResult.citations.map((cite, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-[#08080c] border border-[#1f1f28] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px] text-[#a855f7] font-medium">
                              <span>Chunk #{cite.chunkIndex + 1}</span>
                              <span>Score: {(cite.relevance * 100).toFixed(0)}%</span>
                            </div>
                            <div className="text-gray-300 text-[11px] italic font-mono bg-black/40 p-2 rounded border border-[#1f1f28]">
                              "{cite.content}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedDoc ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white">{selectedDoc.title}</div>
                  <div className="text-xs text-gray-400 leading-relaxed font-mono bg-[#08080c] p-3 rounded-xl border border-[#1f1f28]">
                    {selectedDoc.summary || 'Document ready for questions. Type an inquiry in the search bar above.'}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-500">
                  Select or index a document to view summaries and ask grounded questions.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
