// src/renderer/stores/authStore.ts — Global Account & Authentication State
import { create } from 'zustand'

export type AuthStateStatus =
  | 'IDLE'
  | 'AUTHENTICATING'
  | 'WAITING'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'ERROR'
  | 'CANCELLED'
  | 'OFFLINE'

export interface SanitizedUserProfile {
  authenticated: boolean
  userId: string
  email: string
  displayName: string
  avatarUrl?: string
  plan: 'FREE'
  createdAt: string
  lastLoginAt: string
}

interface AuthStore {
  status: AuthStateStatus
  user: SanitizedUserProfile | null
  isAuthenticated: boolean
  isInitializing: boolean
  isOffline: boolean
  errorMessage: string | null

  checkAuthStatus: () => Promise<void>
  signIn: () => Promise<boolean>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  status: 'IDLE',
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  isOffline: false,
  errorMessage: null,

  checkAuthStatus: async () => {
    try {
      const ultron = (window as any).ultron
      if (!ultron?.account?.getStatus) {
        set({ isInitializing: false, isAuthenticated: false })
        return
      }

      const result = await ultron.account.getStatus()
      if (result.authenticated && result.user) {
        set({
          user: result.user,
          isAuthenticated: true,
          isOffline: !!result.isOffline,
          isInitializing: false,
          status: 'IDLE'
        })
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isOffline: !!result.isOffline,
          isInitializing: false,
          status: 'IDLE'
        })
      }
    } catch (err: any) {
      set({
        user: null,
        isAuthenticated: false,
        isInitializing: false,
        status: 'IDLE',
        errorMessage: err.message
      })
    }
  },

  signIn: async () => {
    const ultron = (window as any).ultron
    if (!ultron?.account?.signIn) {
      set({ status: 'ERROR', errorMessage: 'Authentication service not available' })
      return false
    }

    try {
      // 1. Authenticating state
      set({ status: 'AUTHENTICATING', errorMessage: null })

      // Show "Opening Google..." briefly, then transition to WAITING
      setTimeout(() => {
        if (get().status === 'AUTHENTICATING') {
          set({ status: 'WAITING' })
        }
      }, 1200)

      const result = await ultron.account.signIn()

      if (result.cancelled) {
        set({ status: 'CANCELLED', errorMessage: 'Sign-in cancelled.' })
        return false
      }

      if (!result.success || !result.user) {
        set({
          status: 'ERROR',
          errorMessage: result.error || "Google sign-in couldn't be completed."
        })
        return false
      }

      // 2. Success state
      set({ status: 'VERIFYING' })
      await new Promise((r) => setTimeout(r, 600))

      set({
        status: 'SUCCESS',
        user: result.user,
        isAuthenticated: true,
        isOffline: false,
        errorMessage: null
      })

      return true
    } catch (err: any) {
      set({
        status: 'ERROR',
        errorMessage: err.message || "Google sign-in couldn't be completed."
      })
      return false
    }
  },

  signOut: async () => {
    try {
      const ultron = (window as any).ultron
      if (ultron?.account?.signOut) {
        await ultron.account.signOut()
      }
    } catch {}

    set({
      user: null,
      isAuthenticated: false,
      status: 'IDLE',
      errorMessage: null
    })
  },

  clearError: () => set({ status: 'IDLE', errorMessage: null })
}))
