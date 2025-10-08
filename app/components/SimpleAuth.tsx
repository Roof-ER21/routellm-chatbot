/**
 * SimpleAuth Component
 * Simple login/signup interface matching Egyptian theme
 */

'use client'

import React, { useState, useEffect } from 'react'
import { signUp, login, getRememberedPin } from '@/lib/simple-auth'

interface SimpleAuthProps {
  onAuthenticated: () => void
  isDarkMode?: boolean
}

export default function SimpleAuth({ onAuthenticated, isDarkMode = false }: SimpleAuthProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Load remembered PIN when name changes
  useEffect(() => {
    if (name.trim() && !isSignUp) {
      const rememberedPin = getRememberedPin(name)
      if (rememberedPin) {
        setCode(rememberedPin)
        setRememberMe(true)
      } else {
        setCode('')
        setRememberMe(false)
      }
    }
  }, [name, isSignUp])

  const handleCodeInput = (value: string) => {
    // Only allow digits and max 4 characters
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setCode(digits)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        const result = signUp(name, code)
        if (result.success) {
          // Auto-login after signup
          const loginResult = login(name, code, rememberMe)
          if (loginResult.success) {
            onAuthenticated()
          } else {
            setError(loginResult.error || 'Login failed after signup')
          }
        } else {
          setError(result.error || 'Sign up failed')
        }
      } else {
        const result = login(name, code, rememberMe)
        if (result.success) {
          onAuthenticated()
        } else {
          setError(result.error || 'Login failed')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const bgClass = isDarkMode
    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
    : 'bg-gradient-to-br from-red-950 via-red-900 to-black'

  const cardClass = isDarkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-black/80 border-red-900/50 backdrop-blur-sm'

  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-100'
  const mutedTextClass = isDarkMode ? 'text-gray-400' : 'text-red-200/80'

  return (
    <div className={`flex items-center justify-center min-h-screen ${bgClass}`}>
      <div className="max-w-md w-full mx-4">
        <div className={`${cardClass} p-8 rounded-2xl shadow-2xl border-2`}>
          {/* RoofER/Susan 21 Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32">
              {/* Use the app icon */}
              <img
                src="/icon-192.png"
                alt="Susan 21"
                className="w-full h-full rounded-full shadow-2xl ring-4 ring-red-600/30"
              />
            </div>
          </div>

          <h1 className={`text-3xl font-bold text-center mb-2 ${textClass}`}>
            Welcome to <span className="text-red-500">SUSAN 21</span>
          </h1>
          <p className={`text-center mb-6 ${mutedTextClass}`}>
            Precision in Every Claim
          </p>

          {/* Toggle between Login/Sign Up */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false)
                setError('')
              }}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
                !isSignUp
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-red-200/60 hover:text-red-100'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true)
                setError('')
              }}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
                isSignUp
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-red-200/60 hover:text-red-100'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className={`block text-sm font-semibold mb-2 ${textClass}`}>
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-4 transition-all ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
                    : 'bg-gray-900/50 border-red-800/50 text-white placeholder-red-300/40 focus:border-red-500 focus:ring-red-500/20'
                }`}
                required
                autoFocus
              />
            </div>

            {/* Code Input */}
            <div>
              <label htmlFor="code" className={`block text-sm font-semibold mb-2 ${textClass}`}>
                4-Digit Code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => handleCodeInput(e.target.value)}
                placeholder="####"
                maxLength={4}
                className={`w-full px-4 py-3 border-2 rounded-lg text-2xl text-center tracking-widest focus:outline-none focus:ring-4 transition-all font-mono ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
                    : 'bg-gray-900/50 border-red-800/50 text-white placeholder-red-300/40 focus:border-red-500 focus:ring-red-500/20'
                }`}
                required
              />
              <p className={`text-xs mt-1 ${mutedTextClass}`}>
                {isSignUp ? 'Create a 4-digit code to secure your account' : 'Enter your 4-digit code'}
              </p>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className={`text-sm cursor-pointer ${textClass}`}>
                Remember me on this device
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !name.trim() || code.length !== 4}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-lg font-bold text-lg hover:from-red-700 hover:via-red-800 hover:to-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>{isSignUp ? 'Create Account' : 'Enter Platform'}</span>
                  <span className="text-xl">→</span>
                </span>
              )}
            </button>
          </form>

          <div className={`text-center text-xs mt-6 ${mutedTextClass}`}>
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-red-400">🔒</span>
              <span>Your data is stored securely on your device</span>
            </div>
            {isSignUp && (
              <p className="text-red-400 font-semibold">
                Remember your code - you'll need it to access your account
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
