import { create } from 'zustand'
import { ChatMessage, OrbState } from '../../shared/types'

interface ChatState {
  messages: ChatMessage[]
  orbState: OrbState
  isStreaming: boolean
  currentResponse: string
  activeMessageId: string | null
  
  setOrbState: (state: OrbState) => void
  addMessage: (message: ChatMessage) => void
  updateStreamingChunk: (id: string, chunk: string) => void
  finalizeMessage: (id: string) => void
  setErrorMessage: (id: string, error: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: 'ULTRON Command Center online. All security protocols and systems operational. How may I assist you, Sukesh?',
      timestamp: Date.now()
    }
  ],
  orbState: 'IDLE',
  isStreaming: false,
  currentResponse: '',
  activeMessageId: null,

  setOrbState: (orbState) => set({ orbState }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      activeMessageId: message.role === 'assistant' ? message.id : state.activeMessageId,
      isStreaming: message.streaming || state.isStreaming
    })),

  updateStreamingChunk: (id, chunk) =>
    set((state) => {
      let found = false
      const messages = state.messages.map((msg) => {
        if (msg.id === id || (msg.streaming && msg.role === 'assistant')) {
          found = true
          return { ...msg, content: msg.content + chunk }
        }
        return msg
      })

      if (!found) {
        return {
          messages: [
            ...state.messages,
            {
              id,
              role: 'assistant' as const,
              content: chunk,
              timestamp: Date.now(),
              streaming: true
            }
          ],
          isStreaming: true,
          activeMessageId: id
        }
      }

      return { messages, isStreaming: true, activeMessageId: id }
    }),

  finalizeMessage: (id) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id || (msg.streaming && msg.role === 'assistant')
          ? { ...msg, streaming: false }
          : msg
      ),
      isStreaming: false,
      activeMessageId: null,
      orbState: 'IDLE'
    })),

  setErrorMessage: (id, error) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id || (msg.streaming && msg.role === 'assistant')
          ? {
              ...msg,
              content: msg.content
                ? `${msg.content}\n\n⚠️ ${error}`
                : `⚠️ ${error}`,
              streaming: false
            }
          : msg
      ),
      isStreaming: false,
      activeMessageId: null,
      orbState: 'ERROR'
    })),

  clearMessages: () => set({ messages: [], isStreaming: false, activeMessageId: null })
}))