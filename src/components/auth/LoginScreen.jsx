import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'reset'
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setMessage('Check your email for the password reset link.')
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
            <Zap className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Personal OS</h1>
          <p className="text-gray-500 text-sm mt-1">Your life, systematized.</p>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-200 mb-5">
            {mode === 'login' && 'Sign in to your dashboard'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'reset' && 'Reset your password'}
          </h2>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-sm text-green-300">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending…'}
                </span>
              ) : (
                mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'
              )}
            </button>
          </form>

          <div className="mt-4 space-y-1">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors block w-full text-center"
                >
                  Don't have an account? <span className="text-brand-400">Sign up</span>
                </button>
                <button
                  onClick={() => { setMode('reset'); setError(null); setMessage(null) }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors block w-full text-center"
                >
                  Forgot password?
                </button>
              </>
            )}
            {(mode === 'signup' || mode === 'reset') && (
              <button
                onClick={() => { setMode('login'); setError(null); setMessage(null) }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors block w-full text-center"
              >
                Back to <span className="text-brand-400">sign in</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          Personal OS · Built for clarity & momentum
        </p>
      </div>
    </div>
  )
}
