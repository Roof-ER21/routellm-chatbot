/**
 * Example Integration - Conversation Sync in Susan AI Chatbot
 *
 * This file shows how to integrate the conversation sync system
 * into your existing React chatbot components.
 *
 * Copy the relevant parts to your actual components.
 */

'use client'

import { useState, useEffect } from 'react'
import { useConversationSync } from '@/lib/useConversationSync'
import type { ConversationData, MessageData } from '@/lib/sync-types'

// ============================================================================
// Example 1: Login/Signup Component
// ============================================================================

export function SyncLoginComponent() {
  const { isLoggedIn, signup, login, logout } = useConversationSync()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSignupMode, setIsSignupMode] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isSignupMode) {
      const result = await signup(name, code, displayName)
      if (!result.success) {
        setError(result.error || 'Signup failed')
      }
    } else {
      const result = await login(name, code)
      if (!result.success) {
        setError(result.error || 'Login failed')
      }
    }
  }

  if (isLoggedIn) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-800">✓ Logged in and syncing</p>
        <button
          onClick={logout}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white border rounded">
      <h3 className="text-lg font-bold mb-4">
        {isSignupMode ? 'Create Account' : 'Login'} to Sync Conversations
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Passcode</label>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        {isSignupMode && (
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
        )}

        {error && (
          <div className="p-2 bg-red-50 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isSignupMode ? 'Sign Up' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => setIsSignupMode(!isSignupMode)}
          className="w-full px-4 py-2 text-blue-500 hover:underline"
        >
          {isSignupMode ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </button>
      </form>
    </div>
  )
}

// ============================================================================
// Example 2: Chatbot with Sync Integration
// ============================================================================

export function ChatbotWithSync() {
  const {
    isLoggedIn,
    isSyncing,
    lastSyncTime,
    queueLength,
    saveConversation
  } = useConversationSync({
    autoSync: true,
    syncInterval: 60000, // Sync every minute
    onSyncSuccess: () => console.log('Synced successfully!'),
    onSyncError: (error) => console.error('Sync failed:', error)
  })

  const [currentConversation, setCurrentConversation] = useState<ConversationData>({
    id: `conv-${Date.now()}`,
    title: 'New Conversation',
    preview: '',
    messages: [],
    alerts: []
  })

  const [inputMessage, setInputMessage] = useState('')

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // Create new message
    const newMessage: MessageData = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    // Update conversation
    const updatedConversation: ConversationData = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      preview: currentConversation.messages.length === 0 ? inputMessage.substring(0, 200) : currentConversation.preview,
      title: currentConversation.messages.length === 0 ? inputMessage.substring(0, 50) : currentConversation.title
    }

    setCurrentConversation(updatedConversation)
    setInputMessage('')

    // Save and sync (automatically if logged in)
    await saveConversation(updatedConversation)

    // Simulate assistant response
    setTimeout(async () => {
      const assistantMessage: MessageData = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'This is a simulated response from Susan AI...',
        timestamp: new Date().toISOString()
      }

      const withResponse: ConversationData = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage]
      }

      setCurrentConversation(withResponse)
      await saveConversation(withResponse)
    }, 1000)
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Sync Status Bar */}
      <div className="mb-4 p-3 bg-gray-50 border rounded flex justify-between items-center">
        <div>
          {isLoggedIn ? (
            <span className="text-green-600 font-medium">✓ Sync Enabled</span>
          ) : (
            <span className="text-yellow-600 font-medium">⚠ Local Only (Login to Sync)</span>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {isSyncing && <span className="animate-pulse">Syncing...</span>}
          {!isSyncing && lastSyncTime && (
            <span>Last sync: {new Date(lastSyncTime).toLocaleTimeString()}</span>
          )}
          {queueLength > 0 && (
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              {queueLength} pending
            </span>
          )}
        </div>
      </div>

      {/* Login Component */}
      {!isLoggedIn && (
        <div className="mb-4">
          <SyncLoginComponent />
        </div>
      )}

      {/* Chat Interface */}
      <div className="border rounded-lg overflow-hidden">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 bg-white">
          {currentConversation.messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              Start a conversation...
            </div>
          ) : (
            currentConversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-100 ml-12'
                    : 'bg-gray-100 mr-12'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {msg.role === 'user' ? 'You' : 'Susan AI'}
                </div>
                <div className="text-gray-800">{msg.content}</div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={handleSendMessage}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Example 3: Admin Dashboard Component
// ============================================================================

export function AdminDashboard() {
  const { syncClient } = useConversationSync()
  const [stats, setStats] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [adminPasscode, setAdminPasscode] = useState('2110')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadStats = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await syncClient.getSystemStats(adminPasscode)
      if (result.success) {
        setStats(result.stats)
      } else {
        setError(result.error || 'Failed to load stats')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async (filters?: { flagged?: boolean; severity?: string }) => {
    setLoading(true)
    setError('')

    try {
      const result = await syncClient.getAllConversations(adminPasscode, filters)
      if (result.success) {
        setConversations(result.conversations || [])
      } else {
        setError(result.error || 'Failed to load conversations')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    loadConversations()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Passcode Input */}
      <div className="mb-6 p-4 bg-gray-50 border rounded">
        <label className="block text-sm font-medium mb-2">Admin Passcode</label>
        <input
          type="password"
          value={adminPasscode}
          onChange={(e) => setAdminPasscode(e.target.value)}
          className="px-3 py-2 border rounded"
          placeholder="Enter admin passcode"
        />
        <button
          onClick={() => {
            loadStats()
            loadConversations()
          }}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Total Conversations" value={stats.totalConversations} />
          <StatCard label="Total Messages" value={stats.totalMessages} />
          <StatCard label="Critical Alerts" value={stats.criticalAlerts} color="red" />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => loadConversations()}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          All Conversations
        </button>
        <button
          onClick={() => loadConversations({ flagged: true })}
          className="px-4 py-2 bg-yellow-200 rounded hover:bg-yellow-300"
        >
          Flagged Only
        </button>
        <button
          onClick={() => loadConversations({ severity: 'critical' })}
          className="px-4 py-2 bg-red-200 rounded hover:bg-red-300"
        >
          Critical Only
        </button>
      </div>

      {/* Conversations List */}
      <div className="bg-white border rounded">
        <div className="p-4 border-b bg-gray-50 font-medium">
          Conversations ({conversations.length})
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No conversations found</div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{conv.title}</div>
                    <div className="text-sm text-gray-600">{conv.display_name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {conv.message_count} messages • {conv.alert_count} alerts
                      {parseInt(conv.flagged_alert_count) > 0 && (
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                          {conv.flagged_alert_count} flagged
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(conv.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'blue' }: { label: string; value: number; color?: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    green: 'bg-green-50 border-green-200 text-green-800'
  }

  return (
    <div className={`p-4 border rounded ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  )
}

// ============================================================================
// Example 4: How to Add Alerts
// ============================================================================

export function exampleWithAlerts() {
  const { saveConversation } = useConversationSync()

  // Create a conversation with alerts
  const conversationWithAlerts: ConversationData = {
    id: `conv-${Date.now()}`,
    title: 'High Value Claim',
    preview: 'Customer requesting $50,000 for property damage',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'I need to file a claim for $50,000 in property damage',
        timestamp: new Date().toISOString()
      }
    ],
    alerts: [
      {
        id: 'alert-1',
        type: 'high_value_claim',
        severity: 'critical',
        title: 'High Value Claim Detected',
        message: 'Claim amount exceeds $10,000 - requires manager approval',
        timestamp: new Date().toISOString(),
        flagged: true
      },
      {
        id: 'alert-2',
        type: 'property_damage',
        severity: 'warning',
        title: 'Property Damage Type',
        message: 'Property damage claims require photo documentation',
        timestamp: new Date().toISOString(),
        flagged: false
      }
    ]
  }

  // Save with alerts
  saveConversation(conversationWithAlerts)
}
