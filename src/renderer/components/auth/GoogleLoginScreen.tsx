// src/renderer/components/auth/GoogleLoginScreen.tsx — Premium Pitch-Black Google Login UI
import React, { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'

export function GoogleLoginScreen({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const { status, errorMessage, signIn, clearError } = useAuthStore()
  const [isHovered, setIsHovered] = useState(false)

  const handleSignIn = async () => {
    const ok = await signIn()
    if (ok && onLoginSuccess) {
      setTimeout(() => {
        onLoginSuccess()
      }, 700)
    }
  }

  // Official Google "G" Multi-Color Vector Icon
  const GoogleGIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )

  const isLoading = status === 'AUTHENTICATING' || status === 'WAITING' || status === 'VERIFYING'

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col items-center justify-between p-8 select-none font-sans overflow-hidden">
      {/* Subtle background ambient particle aura */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[320px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-blue-500/5 rounded-full blur-2xl" />
      </div>

      {/* Top Bar: Founder & Organization badge */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 opacity-75">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d4ff]" />
          <span className="text-[11px] font-mono tracking-wider text-zinc-400 font-semibold uppercase">
            UPAI Technologies
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
          <span>Founder: Sukesh D.</span>
        </div>
      </header>

      {/* Central Card: Clean, Black, Minimal */}
      <main className="relative z-10 flex flex-col items-center justify-center max-w-sm w-full -mt-8">
        {/* Logo Glyph */}
        <div className="mb-6 flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0a0a0c] border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.08)]">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#00d4ff]" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-8 space-y-1.5">
          <h1 className="text-2xl font-bold tracking-widest text-white font-mono uppercase">
            ULTRON
          </h1>
          <p className="text-xs text-zinc-400 font-medium tracking-wide">
            Personal AI Command Center
          </p>
        </div>

        {/* Action / State Area */}
        <div className="w-full space-y-4">
          {/* SUCCESS State */}
          {status === 'SUCCESS' ? (
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#0a0a0c] border border-emerald-500/30 text-center animate-in fade-in duration-300 space-y-2">
              <CheckCircle2 size={24} className="text-emerald-400 animate-bounce" />
              <div className="text-sm font-semibold text-white">Welcome to ULTRON</div>
              <p className="text-[11px] text-zinc-400">Opening workspace...</p>
            </div>
          ) : isLoading ? (
            /* LOADING / PROGRESS States */
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#0a0a0c] border border-white/10 text-center animate-in fade-in duration-200 space-y-3">
              <Loader2 size={22} className="text-cyan-400 animate-spin" />
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-zinc-200">
                  {status === 'AUTHENTICATING' && 'Opening Google...'}
                  {status === 'WAITING' && 'Complete sign-in in your browser'}
                  {status === 'VERIFYING' && 'Verifying your account...'}
                </div>
                <p className="text-[10px] text-zinc-500">
                  {status === 'WAITING'
                    ? 'Check your system browser to select your Google Account'
                    : 'Securing session via UPAI backend'}
                </p>
              </div>
            </div>
          ) : (
            /* IDLE / ERROR / CANCELLED State: Google Button */
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSignIn}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`w-full h-11 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 text-xs font-semibold shadow-md active:scale-[0.98] ${
                  isHovered
                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] border-white'
                    : 'bg-[#0f0f12] text-zinc-200 border border-white/15 hover:border-white/30'
                }`}
                aria-label="Continue with Google"
              >
                <GoogleGIcon />
                <span>Continue with Google</span>
              </button>

              {/* Error or Cancelled Message Banner */}
              {(status === 'ERROR' || status === 'CANCELLED' || errorMessage) && (
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start gap-2.5 text-left animate-in fade-in duration-150">
                  <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[11px] leading-snug">
                    <span className="text-red-200 font-medium">
                      {errorMessage || (status === 'CANCELLED' ? 'Sign-in cancelled.' : "Google sign-in couldn't be completed.")}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearError()
                        handleSignIn()
                      }}
                      className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                    >
                      <RefreshCw size={10} />
                      <span>Try Again</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Small Security Explanatory Text */}
              <p className="text-center text-[11px] text-zinc-500 leading-normal">
                Sign in securely with your Google Account.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer: Zero-Trust Notice & Version */}
      <footer className="w-full max-w-5xl flex items-center justify-between text-[11px] text-zinc-600 font-mono z-10">
        <div className="flex items-center gap-1.5 text-zinc-500">
          <ShieldCheck size={13} className="text-emerald-500/80" />
          <span>Zero-Trust Architecture</span>
        </div>
        <div>
          <span>ULTRON v1.0.8</span>
        </div>
      </footer>
    </div>
  )
}
