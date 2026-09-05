// src/main/services/document.service.ts — Document Intelligence for ULTRON V1.0.5
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { memoryDatabase } from '../database/memory.db'
import { modelService } from './model.service'
import { DocumentMeta, DocumentChunk, DocumentQueryResult } from '../../shared/types'

export class DocumentService {
  /**
   * Index a local document (PDF, TXT, MD, source code)
   */
  async indexDocument(filePath: string): Promise<DocumentMeta> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    const stat = fs.statSync(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const fileName = path.basename(filePath)

    let fileType: DocumentMeta['fileType'] = 'unknown'
    if (ext === '.pdf') fileType = 'pdf'
    else if (ext === '.txt') fileType = 'txt'
    else if (ext === '.md') fileType = 'md'
    else if (['.ts', '.js', '.py', '.json', '.html', '.css', '.c', '.cpp', '.rs', '.go'].includes(ext)) fileType = 'code'

    const docId = uuidv4()
    let rawText = ''
    let pageCount = 1

    if (fileType === 'pdf') {
      // Local robust text extraction from PDF stream objects without binary dependency
      const buffer = fs.readFileSync(filePath)
      const pdfString = buffer.toString('binary')
      
      // Match text in /BT ... /ET blocks or plain readable strings
      const matches = pdfString.match(/\(([^\)]+)\)\s*Tj/g) || []
      const extractedWords: string[] = []
      for (const m of matches) {
        const textMatch = m.match(/\(([^\)]+)\)/)
        if (textMatch && textMatch[1]) {
          extractedWords.push(textMatch[1])
        }
      }
      
      rawText = extractedWords.length > 0 
        ? extractedWords.join(' ') 
        : pdfString.replace(/[^a-zA-Z0-9.,;:?!@#%&*\-_\s]/g, ' ').replace(/\s+/g, ' ').trim()

      const pagesMatch = pdfString.match(/\/Type\s*\/Page[^s]/g)
      pageCount = pagesMatch ? pagesMatch.length : 1
    } else {
      rawText = fs.readFileSync(filePath, 'utf8')
    }

    // Chunking (~1000 characters with 150 char overlap)
    const chunks: DocumentChunk[] = []
    const chunkSize = 1000
    const overlap = 150
    let start = 0
    let chunkIndex = 0

    while (start < rawText.length) {
      const end = Math.min(start + chunkSize, rawText.length)
      const chunkText = rawText.slice(start, end).trim()
      if (chunkText.length > 20) {
        chunks.push({
          id: uuidv4(),
          docId,
          fileName,
          pageNumber: Math.floor(start / (rawText.length / Math.max(pageCount, 1))) + 1,
          sectionTitle: `Section ${chunkIndex + 1}`,
          chunkIndex,
          text: chunkText,
          tokenCount: Math.ceil(chunkText.length / 4)
        })
        chunkIndex++
      }
      start += chunkSize - overlap
      if (start >= rawText.length) break
    }

    const docMeta: DocumentMeta = {
      id: docId,
      path: filePath,
      fileName,
      fileType,
      sizeBytes: stat.size,
      pageCount,
      indexedAt: Date.now(),
      summary: `Document "${fileName}" containing ${chunks.length} chunks indexed.`,
      topics: [fileType, ext.replace('.', '')]
    }

    memoryDatabase.saveDocumentMeta(docMeta)
    memoryDatabase.saveDocumentChunks(chunks)

    return docMeta
  }

  /**
   * Search and answer questions over indexed documents with cited references
   */
  async queryDocuments(query: string, docId?: string): Promise<DocumentQueryResult> {
    const startMs = performance.now()
    const chunks = memoryDatabase.queryDocumentChunks(query, docId, 5)

    if (chunks.length === 0) {
      return {
        answer: 'No relevant information found in the indexed documents.',
        confidence: 0.1,
        citations: [],
        queryDurationMs: parseFloat((performance.now() - startMs).toFixed(2))
      }
    }

    const contextSnippet = chunks.map((c, i) => 
      `[Source ${i + 1}: ${c.fileName} Page ${c.pageNumber || 1}]
${c.text}`
    ).join('\n\n')

    const prompt = `You are ULTRON Document Intelligence. Answer the user's question using ONLY the provided document sources.
Always cite the source document and page number when stating facts.
If the information is not contained in the sources, say you cannot find it in the document.

DOCUMENT SOURCES:
${contextSnippet}

USER QUESTION:
${query}`

    try {
      const completion = await modelService.generateCompletion(prompt, { temperature: 0.2, maxTokens: 800 })
      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))

      return {
        answer: completion || 'Document analysis completed.',
        confidence: 0.95,
        citations: chunks.map(c => ({
          docId: c.docId,
          fileName: c.fileName,
          pageNumber: c.pageNumber,
          sectionTitle: c.sectionTitle,
          snippet: c.text.slice(0, 160) + '...'
        })),
        queryDurationMs: durationMs
      }
    } catch (err: any) {
      return {
        answer: `Document analysis encountered an error: ${err.message}`,
        confidence: 0.2,
        citations: [],
        queryDurationMs: parseFloat((performance.now() - startMs).toFixed(2))
      }
    }
  }

  listDocuments(): DocumentMeta[] {
    return memoryDatabase.listDocumentMetas()
  }

  deleteDocument(docId: string): boolean {
    return memoryDatabase.deleteDocument(docId)
  }
}

export const documentService = new DocumentService()
