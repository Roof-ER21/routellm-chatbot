'use client'

import { useState, useEffect, useMemo } from 'react'
import StormDataModal from '../components/StormDataModal'
import { getAllConversations, getConversationStats, getAllFlaggedConversations, clearConversationAlerts, type UserConversation, type ConversationStats } from '@/lib/simple-auth'
import { highlightSuspiciousText, getSeverityColor, formatAlertSummary } from '@/lib/threat-detection'

interface RepStat {
  name: string
  total_chats: number
  last_active: string
  total_sessions: number
  total_messages: number
}

interface ChatTranscript {
  session_id: number
  rep_name: string
  started_at: string
  messages: Array<{
    role: string
    content: string
    timestamp: string
  }>
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<RepStat[]>([])
  const [todaysChats, setTodaysChats] = useState<any[]>([])
  const [transcripts, setTranscripts] = useState<ChatTranscript[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'today' | 'transcripts' | 'database' | 'client-chats' | 'alerts'>('overview')
  const [dbLoading, setDbLoading] = useState(false)
  const [dbMessage, setDbMessage] = useState('')
  const [clientConversations, setClientConversations] = useState<UserConversation[]>([])
  const [clientStats, setClientStats] = useState<ConversationStats | null>(null)
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')

  // Check if already authenticated (session storage)
  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated')
    if (authenticated === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (passcode === '2110') {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_authenticated', 'true')
      setError('')
    } else {
      setError('Incorrect passcode. Please try again.')
      setPasscode('')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_authenticated')
    setPasscode('')
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsRes, todayRes, transcriptsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/today'),
        fetch('/api/admin/transcripts')
      ])

      const [statsData, todayData, transcriptsData] = await Promise.all([
        statsRes.json(),
        todayRes.json(),
        transcriptsRes.json()
      ])

      setStats(statsData.stats || [])
      setTodaysChats(todayData.chats || [])
      setTranscripts(transcriptsData.transcripts || [])

      // Load client-side conversations from localStorage
      loadClientConversations()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClientConversations = async () => {
    try {
      // Fetch conversations from PostgreSQL database (all devices/users)
      const response = await fetch('/api/admin/client-conversations')
      const data = await response.json()

      if (data.success && data.conversations) {
        // Transform database conversations to match expected format
        const transformedConversations = data.conversations.map((conv: any) => ({
          id: String(conv.id),
          username: conv.repName || 'Unknown',
          displayName: conv.repName || 'Unknown',
          title: conv.title,
          preview: conv.preview,
          date: conv.date,
          messages: conv.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          })),
          isFlagged: false,
          alerts: [],
          highestSeverity: undefined
        }))

        setClientConversations(transformedConversations)

        // Calculate stats from database conversations
        const stats = {
          totalUsers: data.users?.length || 0,
          totalConversations: data.totalConversations || 0,
          totalMessages: data.totalMessages || 0,
          totalAlerts: 0,
          criticalAlerts: 0,
          highAlerts: 0,
          mediumAlerts: 0,
          lowAlerts: 0,
          userStats: data.users?.map((userName: string) => {
            const userConvs = transformedConversations.filter((c: any) => c.displayName === userName)
            const totalMessages = userConvs.reduce((sum: number, c: any) => sum + c.messages.length, 0)
            const lastActive = Math.max(...userConvs.map((c: any) => c.date))

            return {
              displayName: userName,
              conversationCount: userConvs.length,
              messageCount: totalMessages,
              lastActive: lastActive
            }
          }) || []
        }

        setClientStats(stats)
      } else {
        console.error('Failed to load database conversations:', data.error)
        setClientConversations([])
        setClientStats(null)
      }
    } catch (error) {
      console.error('Error loading database conversations:', error)
      setClientConversations([])
      setClientStats(null)
    }
  }

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return clientConversations
    }

    const query = searchQuery.toLowerCase()

    return clientConversations.filter(conv => {
      // Search in user name
      if (conv.displayName.toLowerCase().includes(query)) return true

      // Search in conversation title
      if (conv.title.toLowerCase().includes(query)) return true

      // Search in preview
      if (conv.preview.toLowerCase().includes(query)) return true

      // Search in all message content
      const hasMatchInMessages = conv.messages.some(msg =>
        msg.content.toLowerCase().includes(query)
      )
      if (hasMatchInMessages) return true

      // Search in date
      const dateStr = new Date(conv.date).toLocaleDateString()
      if (dateStr.includes(query)) return true

      return false
    })
  }, [clientConversations, searchQuery])

  // Get flagged conversations with optional severity filter
  const flaggedConversations = useMemo(() => {
    const allFlagged = getAllFlaggedConversations()

    if (alertSeverityFilter === 'all') {
      return allFlagged
    }

    return allFlagged.filter(conv =>
      conv.highestSeverity === alertSeverityFilter
    )
  }, [alertSeverityFilter])

  // Handle clearing alerts
  const handleClearAlerts = (username: string, conversationId: string) => {
    const result = clearConversationAlerts(username, conversationId)
    if (result.success) {
      // Reload conversations to reflect changes
      loadClientConversations()
    }
  }

  const runMigrations = async () => {
    setDbLoading(true)
    setDbMessage('Running database migrations...')
    try {
      const response = await fetch('/api/admin/run-migrations', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setDbMessage('✅ Migrations completed successfully!')
      } else {
        setDbMessage(`❌ Migration failed: ${data.error}`)
      }
    } catch (error: any) {
      setDbMessage(`❌ Error: ${error.message}`)
    } finally {
      setDbLoading(false)
    }
  }

  const populateIntelligence = async () => {
    setDbLoading(true)
    setDbMessage('Populating insurance intelligence data...')
    try {
      const response = await fetch('/api/admin/populate-intelligence', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setDbMessage(`✅ Intelligence data populated! Updated ${data.updated} companies, ${data.errors} errors`)
      } else {
        setDbMessage(`❌ Population failed: ${data.error}`)
      }
    } catch (error: any) {
      setDbMessage(`❌ Error: ${error.message}`)
    } finally {
      setDbLoading(false)
    }
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Login Card */}
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔒</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                SUSAN<span className="text-red-600">AI-21</span>
              </h1>
              <p className="text-gray-400 text-sm">Admin Dashboard Access</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handlePasscodeSubmit} className="space-y-6">
              <div>
                <label htmlFor="passcode" className="block text-sm font-semibold text-gray-300 mb-2">
                  Enter Passcode
                </label>
                <input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-600 focus:border-red-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all text-white text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3 flex items-center gap-3">
                  <span className="text-red-400 text-xl">⚠️</span>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>🔓</span>
                <span>Unlock Dashboard</span>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-xs">
                Powered by <span className="font-semibold text-gray-400">Susan AI</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#1a1a1a] text-white shadow-xl border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                <span className="text-2xl">👁️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  SUSAN<span className="text-red-600">AI-21</span> Admin
                </h1>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Analytics Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StormDataModal repName="Admin" />
              <button
                onClick={loadClientConversations}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium text-sm"
                title="Refresh all conversations from PostgreSQL database"
              >
                Refresh Database Chats
              </button>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
              >
                <span>🔒</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs - Simplified */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('client-chats')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'client-chats'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            💬 All Conversations (Database)
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
              activeTab === 'alerts'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🚨 Flagged Chats
            {clientStats && (clientStats.criticalAlerts > 0 || clientStats.highAlerts > 0) && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {clientStats.criticalAlerts + clientStats.highAlerts}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'today'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📅 Today's Activity
          </button>
          <button
            onClick={() => setActiveTab('transcripts')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'transcripts'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            💬 Transcripts
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'database'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🗄️ Database
          </button>
        </div>

        {/* Overview Tab - Statistics Only */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>

            {/* Single Statistics Dashboard */}
            {clientStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="text-3xl font-bold mb-2">{clientStats.totalUsers}</div>
                  <div className="text-blue-100 text-sm uppercase tracking-wide">Total Users</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="text-3xl font-bold mb-2">{clientStats.totalConversations}</div>
                  <div className="text-green-100 text-sm uppercase tracking-wide">Conversations</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="text-3xl font-bold mb-2">{clientStats.totalMessages}</div>
                  <div className="text-purple-100 text-sm uppercase tracking-wide">Total Messages</div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
                  <div className="text-3xl font-bold mb-2">{clientStats.totalAlerts}</div>
                  <div className="text-red-100 text-sm uppercase tracking-wide">Threat Alerts</div>
                </div>
              </div>
            )}

            {/* User Activity Summary */}
            {clientStats && clientStats.userStats.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">User Activity Summary</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">User</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Conversations</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Messages</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clientStats.userStats.map((user, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">{user.displayName}</td>
                        <td className="px-6 py-4 text-center text-gray-700">{user.conversationCount}</td>
                        <td className="px-6 py-4 text-center text-gray-700">{user.messageCount}</td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          {new Date(user.lastActive).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Today's Activity Tab */}
        {activeTab === 'today' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Activity</h2>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">Rep Name</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Sessions</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Messages</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">First Chat</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Last Chat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todaysChats.map((chat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{chat.rep_name}</td>
                      <td className="px-6 py-4 text-center text-gray-700">{chat.session_count || 0}</td>
                      <td className="px-6 py-4 text-center text-gray-700">{chat.message_count || 0}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        {chat.first_message ? new Date(chat.first_message).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        {chat.last_message ? new Date(chat.last_message).toLocaleTimeString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {todaysChats.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No activity today
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transcripts Tab */}
        {activeTab === 'transcripts' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Chat Transcripts</h2>
            <div className="space-y-6">
              {transcripts.map((transcript) => (
                <div key={transcript.session_id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{transcript.rep_name}</h3>
                      <p className="text-sm text-gray-500">
                        Session started: {new Date(transcript.started_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                      {transcript.messages.length} messages
                    </span>
                  </div>
                  <div className="space-y-4">
                    {transcript.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'bg-red-50 border-l-4 border-red-500'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-gray-600 uppercase">
                            {msg.role === 'user' ? `👤 ${transcript.rep_name}` : '👁️ SusanAI-21'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {transcripts.length === 0 && (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-500">
                  No transcripts available for today
                </div>
              )}
            </div>
          </div>
        )}

        {/* Database Utilities */}
        {activeTab === 'database' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Management</h2>
            <div className="space-y-6">
              {/* Run Migrations */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">1. Run Database Migrations</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Adds new fields to insurance_companies table: app_name, client_login_url, best_call_times,
                  responsiveness_score, and intelligence fields.
                </p>
                <button
                  onClick={runMigrations}
                  disabled={dbLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-all"
                >
                  {dbLoading ? 'Running...' : '▶️ Run Migrations'}
                </button>
              </div>

              {/* Populate Intelligence */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">2. Populate Insurance Intelligence</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Updates all insurance companies with digital platform info (apps, websites, login URLs)
                  and strategic intelligence (best call times, workarounds, responsiveness scores).
                </p>
                <button
                  onClick={populateIntelligence}
                  disabled={dbLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-all"
                >
                  {dbLoading ? 'Populating...' : '▶️ Populate Intelligence Data'}
                </button>
              </div>

              {/* Status Message */}
              {dbMessage && (
                <div className={`p-4 rounded-lg ${
                  dbMessage.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' :
                  dbMessage.includes('❌') ? 'bg-red-50 border border-red-200 text-red-800' :
                  'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <p className="font-semibold">{dbMessage}</p>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">📋 Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>First, click "Run Migrations" to add new database fields</li>
                  <li>Then, click "Populate Intelligence Data" to fill in the research data for all 64 insurance companies</li>
                  <li>Check the status messages to verify successful completion</li>
                </ol>
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-xs text-gray-600">
                    <strong>Note:</strong> These operations are safe to run multiple times. The migration uses "ALTER TABLE IF NOT EXISTS"
                    and the population uses UPDATE statements, so re-running won't cause duplicates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Conversations Tab - Database View */}
        {activeTab === 'client-chats' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">All Conversations (from PostgreSQL Database)</h2>
            <p className="text-sm text-gray-600 mb-4">
              💾 Showing conversations from all devices (phone, iPad, computer) and all users stored in the database
            </p>

            {/* Single Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by user name, conversation content, dates, or message text..."
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {searchQuery && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Found <span className="font-bold text-red-600">{filteredConversations.length}</span> result{filteredConversations.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>

            {/* Single Consolidated Conversations List */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Conversations ({filteredConversations.length})</h3>
                  <p className="text-sm text-gray-600 mt-1">Click on a conversation to expand and view full transcript</p>
                </div>
                {clientStats && clientStats.totalAlerts > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg">
                    <span className="text-red-800 font-semibold text-sm">
                      {clientStats.totalAlerts} Alert{clientStats.totalAlerts > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div key={conversation.id} className="hover:bg-gray-50 transition-colors">
                    <div
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => setExpandedConversation(
                        expandedConversation === conversation.id ? null : conversation.id
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                              {conversation.displayName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(conversation.date).toLocaleString()}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {conversation.messages.length} messages
                            </span>
                            {conversation.isFlagged && conversation.alerts && conversation.alerts.length > 0 && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                getSeverityColor(conversation.highestSeverity || 'low').badge
                              } text-white`}>
                                🚨 {conversation.alerts.length} Alert{conversation.alerts.length > 1 ? 's' : ''} ({conversation.highestSeverity?.toUpperCase()})
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-semibold text-gray-900 mb-1">{conversation.title}</div>
                          <div className="text-sm text-gray-600">{conversation.preview}</div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 ml-4">
                          {expandedConversation === conversation.id ? '▼' : '▶'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Conversation View */}
                    {expandedConversation === conversation.id && (
                      <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                        {/* Alert Details Section */}
                        {conversation.alerts && conversation.alerts.length > 0 && (
                          <div className="mt-4 mb-6 p-4 bg-white border-2 border-red-500 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                🚨 Threat Alerts Detected
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm('Are you sure you want to clear all alerts from this conversation?')) {
                                    handleClearAlerts(conversation.username, conversation.id)
                                  }
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded transition-colors"
                              >
                                Clear Alerts
                              </button>
                            </div>
                            <div className="space-y-2">
                              {conversation.alerts.map((alert, alertIdx) => {
                                const colors = getSeverityColor(alert.severity)
                                return (
                                  <div key={alertIdx} className={`p-3 rounded-lg border-l-4 ${colors.bg} ${colors.border}`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={`text-sm font-bold ${colors.text}`}>
                                        {alert.severity.toUpperCase()} - {alert.category}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(alert.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                      <strong>Pattern:</strong> {alert.pattern}
                                    </div>
                                    <div className="text-sm text-gray-700 mt-1">
                                      <strong>Matched text:</strong> <span className="font-mono bg-yellow-200 px-1">"{alert.highlightedText}"</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      Risk Score: {alert.riskScore}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 space-y-4">
                          {conversation.messages.map((msg, idx) => {
                            // Check if this message has alerts
                            const messageAlerts = conversation.alerts?.filter(alert => alert.messageIndex === idx) || []
                            const hasSuspiciousContent = messageAlerts.length > 0 && msg.role === 'user'

                            return (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg ${
                                hasSuspiciousContent
                                  ? 'bg-red-50 border-l-4 border-red-500'
                                  : msg.role === 'user'
                                  ? 'bg-blue-50 border-l-4 border-blue-500'
                                  : 'bg-amber-50 border-l-4 border-amber-500'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                                  {msg.role === 'user' ? `👤 ${conversation.displayName}` : '🤖 SusanAI-21'}
                                  {hasSuspiciousContent && (
                                    <span className="text-red-600 font-bold">⚠️ SUSPICIOUS</span>
                                  )}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              </div>

                              {hasSuspiciousContent ? (
                                <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                                  {highlightSuspiciousText(
                                    msg.content,
                                    messageAlerts.map(a => ({
                                      pattern: a.pattern,
                                      category: a.category,
                                      severity: a.severity,
                                      matchedText: a.highlightedText,
                                      position: {
                                        start: msg.content.toLowerCase().indexOf(a.highlightedText.toLowerCase()),
                                        end: msg.content.toLowerCase().indexOf(a.highlightedText.toLowerCase()) + a.highlightedText.length
                                      }
                                    }))
                                  ).map((segment, segIdx) => (
                                    <span
                                      key={segIdx}
                                      className={segment.isSuspicious ? `${getSeverityColor(segment.severity!).bg} font-bold px-1 rounded` : ''}
                                      title={segment.isSuspicious ? `Pattern: ${segment.pattern}` : undefined}
                                    >
                                      {segment.text}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                              )}
                            </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">💬</div>
                    <p className="text-lg font-semibold mb-2">
                      {searchQuery ? 'No conversations match your search' : 'No conversations found'}
                    </p>
                    <p className="text-sm">
                      {searchQuery
                        ? 'Try a different search term or clear the search to see all conversations'
                        : 'Client-side conversations will appear here once users start chatting'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Flagged Conversations Tab - Simplified */}
        {activeTab === 'alerts' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              🚨 Flagged Conversations
              {clientStats && clientStats.totalAlerts > 0 && (
                <span className="text-lg font-normal text-gray-600">
                  ({clientStats.totalAlerts} alert{clientStats.totalAlerts > 1 ? 's' : ''} across {flaggedConversations.length} conversation{flaggedConversations.length > 1 ? 's' : ''})
                </span>
              )}
            </h2>

            {/* Single Severity Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Severity:</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setAlertSeverityFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    alertSeverityFilter === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({getAllFlaggedConversations().length})
                </button>
                <button
                  onClick={() => setAlertSeverityFilter('critical')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    alertSeverityFilter === 'critical'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  Critical ({getAllFlaggedConversations().filter(c => c.highestSeverity === 'critical').length})
                </button>
                <button
                  onClick={() => setAlertSeverityFilter('high')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    alertSeverityFilter === 'high'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                >
                  High ({getAllFlaggedConversations().filter(c => c.highestSeverity === 'high').length})
                </button>
                <button
                  onClick={() => setAlertSeverityFilter('medium')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    alertSeverityFilter === 'medium'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  Medium ({getAllFlaggedConversations().filter(c => c.highestSeverity === 'medium').length})
                </button>
                <button
                  onClick={() => setAlertSeverityFilter('low')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    alertSeverityFilter === 'low'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Low ({getAllFlaggedConversations().filter(c => c.highestSeverity === 'low').length})
                </button>
              </div>
            </div>

            {/* Flagged Conversations List */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Flagged Conversations ({flaggedConversations.length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Conversations with detected suspicious patterns, sorted by severity
                </p>
              </div>

              <div className="divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
                {flaggedConversations.map((conversation) => {
                  const severityColors = getSeverityColor(conversation.highestSeverity || 'low')

                  return (
                    <div
                      key={conversation.id}
                      className={`hover:bg-gray-50 transition-colors border-l-8 ${severityColors.border}`}
                    >
                      <div
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => setExpandedConversation(
                          expandedConversation === conversation.id ? null : conversation.id
                        )}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${severityColors.badge} text-white`}>
                                🚨 {conversation.highestSeverity?.toUpperCase()}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                                {conversation.displayName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(conversation.date).toLocaleString()}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {conversation.alerts?.length || 0} alert{(conversation.alerts?.length || 0) > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mb-1">{conversation.title}</div>
                            <div className="text-sm text-gray-600 mb-2">{conversation.preview}</div>

                            {/* Alert Categories Summary */}
                            {conversation.alerts && conversation.alerts.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {Array.from(new Set(conversation.alerts.map(a => a.category))).map(category => (
                                  <span key={category} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {category}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Clear all alerts from this conversation?')) {
                                  handleClearAlerts(conversation.username, conversation.id)
                                }
                              }}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded transition-colors"
                            >
                              Clear
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              {expandedConversation === conversation.id ? '▼' : '▶'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Alert Details */}
                      {expandedConversation === conversation.id && (
                        <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                          {/* Detailed Alerts */}
                          <div className="mt-4 mb-6 space-y-3">
                            <h4 className="text-md font-bold text-gray-900 mb-3">Alert Details:</h4>
                            {conversation.alerts?.map((alert, alertIdx) => {
                              const colors = getSeverityColor(alert.severity)
                              return (
                                <div key={alertIdx} className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold ${colors.text}`}>
                                      {alert.severity.toUpperCase()} - {alert.category}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(alert.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="text-gray-700">
                                      <strong>Pattern Matched:</strong> {alert.pattern}
                                    </div>
                                    <div className="text-gray-700">
                                      <strong>Suspicious Text:</strong>{' '}
                                      <span className="font-mono bg-yellow-200 px-2 py-1 rounded">
                                        "{alert.highlightedText}"
                                      </span>
                                    </div>
                                    <div className="text-gray-600 text-xs">
                                      <strong>Risk Score:</strong> {alert.riskScore}/100 | <strong>Message Index:</strong> {alert.messageIndex}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Conversation Messages */}
                          <div>
                            <h4 className="text-md font-bold text-gray-900 mb-3">Full Conversation:</h4>
                            <div className="space-y-3">
                              {conversation.messages.map((msg, idx) => {
                                const messageAlerts = conversation.alerts?.filter(alert => alert.messageIndex === idx) || []
                                const hasSuspiciousContent = messageAlerts.length > 0 && msg.role === 'user'

                                return (
                                  <div
                                    key={idx}
                                    className={`p-4 rounded-lg ${
                                      hasSuspiciousContent
                                        ? 'bg-red-100 border-2 border-red-500'
                                        : msg.role === 'user'
                                        ? 'bg-blue-50 border-l-4 border-blue-500'
                                        : 'bg-amber-50 border-l-4 border-amber-500'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                                        {msg.role === 'user' ? `👤 ${conversation.displayName}` : '🤖 SusanAI-21'}
                                        {hasSuspiciousContent && (
                                          <span className="text-red-600 font-bold">⚠️ SUSPICIOUS PATTERN DETECTED</span>
                                        )}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                      </span>
                                    </div>

                                    {hasSuspiciousContent ? (
                                      <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                                        {highlightSuspiciousText(
                                          msg.content,
                                          messageAlerts.map(a => ({
                                            pattern: a.pattern,
                                            category: a.category,
                                            severity: a.severity,
                                            matchedText: a.highlightedText,
                                            position: {
                                              start: msg.content.toLowerCase().indexOf(a.highlightedText.toLowerCase()),
                                              end: msg.content.toLowerCase().indexOf(a.highlightedText.toLowerCase()) + a.highlightedText.length
                                            }
                                          }))
                                        ).map((segment, segIdx) => (
                                          <span
                                            key={segIdx}
                                            className={segment.isSuspicious ? `bg-yellow-300 font-bold px-1 rounded border-2 border-red-500` : ''}
                                            title={segment.isSuspicious ? `🚨 ${segment.severity?.toUpperCase()}: ${segment.pattern}` : undefined}
                                          >
                                            {segment.text}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                                        {msg.content}
                                      </p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {flaggedConversations.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">✅</div>
                    <p className="text-lg font-semibold mb-2">No threat alerts detected</p>
                    <p className="text-sm">
                      {alertSeverityFilter === 'all'
                        ? 'All conversations are clean with no suspicious patterns'
                        : `No alerts with ${alertSeverityFilter} severity level`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Detection Info Panel */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-3">🛡️ Threat Detection Information</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Active Monitoring:</strong> This system continuously analyzes user messages for 150+ suspicious patterns across 5 categories.
                </p>
                <p>
                  <strong>Categories Monitored:</strong> Business Planning, Data & Client Theft, Financial Fraud, Exit Planning, and General Suspicious Behaviors
                </p>
                <p>
                  <strong>Privacy Notice:</strong> Detection is silent to users. Only administrators can see alerts.
                </p>
                <p>
                  <strong>Severity Levels:</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><span className="font-bold text-red-600">CRITICAL (90-100):</span> Immediate investigation, restrict access, legal review</li>
                  <li><span className="font-bold text-orange-600">HIGH (70-89):</span> Close monitoring, manager notification, access review</li>
                  <li><span className="font-bold text-yellow-600">MEDIUM (40-69):</span> Document and monitor, periodic review</li>
                  <li><span className="font-bold text-gray-600">LOW (0-39):</span> Normal monitoring, no special action</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
