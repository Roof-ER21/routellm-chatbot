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
  const [activeTab, setActiveTab] = useState<'overview' | 'today' | 'transcripts' | 'database' | 'client-chats' | 'alerts' | 'master-transcript'>('overview')
  const [dbLoading, setDbLoading] = useState(false)
  const [dbMessage, setDbMessage] = useState('')
  const [clientConversations, setClientConversations] = useState<UserConversation[]>([])
  const [clientStats, setClientStats] = useState<ConversationStats | null>(null)
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)

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

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) {
      return
    }

    const intervalId = setInterval(() => {
      console.log('[Admin] Auto-refreshing conversations...')
      loadClientConversations()
      setLastRefreshTime(new Date())
    }, 30000) // 30 seconds

    return () => clearInterval(intervalId)
  }, [autoRefresh, isAuthenticated])

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
      // Fetch conversations from PostgreSQL database ONLY (all devices/users)
      const response = await fetch('/api/admin/client-conversations')

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

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
          isFlagged: conv.isFlagged || false,
          alerts: conv.alerts || [],
          highestSeverity: conv.highestSeverity
        }))

        setClientConversations(transformedConversations)

        // Calculate stats from database conversations
        const stats = {
          totalUsers: data.users?.length || 0,
          totalConversations: data.totalConversations || 0,
          totalMessages: data.totalMessages || 0,
          totalAlerts: data.totalAlerts || 0,
          criticalAlerts: data.criticalAlerts || 0,
          highAlerts: data.highAlerts || 0,
          mediumAlerts: data.mediumAlerts || 0,
          lowAlerts: data.lowAlerts || 0,
          userStats: data.users?.map((userName: string) => {
            const userConvs = transformedConversations.filter((c: any) => c.displayName === userName)
            const totalMessages = userConvs.reduce((sum: number, c: any) => sum + c.messages.length, 0)
            const lastActive = Math.max(...userConvs.map((c: any) => c.date))
            const alertCount = userConvs.reduce((sum: number, c: any) => sum + (c.alerts?.length || 0), 0)

            return {
              displayName: userName,
              conversationCount: userConvs.length,
              messageCount: totalMessages,
              lastActive: lastActive,
              alertCount
            }
          }) || []
        }

        setClientStats(stats)
        setIsUsingFallback(false)
        setLastRefreshTime(new Date())
      } else {
        throw new Error(data.error || 'Unknown error from API')
      }
    } catch (error: any) {
      console.error('Error loading database conversations:', error)
      setClientConversations([])
      setClientStats(null)
      setIsUsingFallback(false)
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

  // Get flagged conversations with optional severity filter (from database)
  const flaggedConversations = useMemo(() => {
    const allFlagged = clientConversations.filter(conv => conv.isFlagged && conv.alerts && conv.alerts.length > 0)

    if (alertSeverityFilter === 'all') {
      return allFlagged
    }

    return allFlagged.filter(conv =>
      conv.highestSeverity === alertSeverityFilter
    )
  }, [clientConversations, alertSeverityFilter])

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">👁️</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600 text-sm mb-4">Fetching data from database...</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
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

              {/* Auto-refresh toggle */}
              <div className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-red-600 bg-gray-600 border-gray-500 rounded focus:ring-red-500 focus:ring-2"
                  />
                  <span className="text-white text-sm font-medium">Auto-refresh (30s)</span>
                </label>
              </div>

              {/* Last refresh time indicator */}
              {lastRefreshTime && (
                <div className="text-xs text-gray-300 bg-gray-700 px-3 py-2 rounded-lg">
                  Last refresh: {lastRefreshTime.toLocaleTimeString()}
                </div>
              )}

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
        {/* Main Action Buttons - Clean 4-Button Layout */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Admin Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab('client-chats')}
              className={`px-6 py-4 rounded-lg font-bold transition-all text-center ${
                activeTab === 'client-chats'
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-200'
              }`}
            >
              <div className="text-3xl mb-2">👥</div>
              <div>All Users</div>
              <div className="text-xs mt-1 opacity-75">View all conversations</div>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-4 rounded-lg font-bold transition-all text-center relative ${
                activeTab === 'alerts'
                  ? 'bg-red-600 text-white shadow-lg transform scale-105'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border-2 border-red-200'
              }`}
            >
              <div className="text-3xl mb-2">🚨</div>
              <div>Flagged</div>
              <div className="text-xs mt-1 opacity-75">Threat alerts</div>
              {clientStats && (clientStats.criticalAlerts > 0 || clientStats.highAlerts > 0) && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white">
                  {clientStats.criticalAlerts + clientStats.highAlerts}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('master-transcript')}
              className={`px-6 py-4 rounded-lg font-bold transition-all text-center ${
                activeTab === 'master-transcript'
                  ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-2 border-purple-200'
              }`}
            >
              <div className="text-3xl mb-2">📜</div>
              <div>Transcript</div>
              <div className="text-xs mt-1 opacity-75">Master timeline</div>
            </button>

            <button
              onClick={async () => {
                setDbLoading(true)
                setDbMessage('Pulling data from database...')
                try {
                  const response = await fetch('/api/admin/client-conversations')
                  const data = await response.json()
                  if (data.success) {
                    await loadClientConversations()
                    setDbMessage(`✅ Data pulled successfully! ${data.totalConversations} conversations, ${data.totalMessages} messages`)
                    setTimeout(() => setDbMessage(''), 5000)
                  } else {
                    setDbMessage(`❌ Pull failed: ${data.error}`)
                  }
                } catch (error: any) {
                  setDbMessage(`❌ Error: ${error.message}`)
                } finally {
                  setDbLoading(false)
                }
              }}
              disabled={dbLoading}
              className={`px-6 py-4 rounded-lg font-bold transition-all text-center ${
                dbLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-200 hover:shadow-lg'
              }`}
            >
              <div className="text-3xl mb-2">📥</div>
              <div>{dbLoading ? 'Pulling...' : 'Pull Data'}</div>
              <div className="text-xs mt-1 opacity-75">Sync from database</div>
            </button>
          </div>

          {/* Status Message */}
          {dbMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              dbMessage.includes('✅') ? 'bg-green-100 text-green-800' :
              dbMessage.includes('❌') ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {dbMessage}
            </div>
          )}
        </div>

        {/* Secondary Navigation Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'overview'
                ? 'bg-gray-800 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'today'
                ? 'bg-gray-800 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📅 Today
          </button>
          <button
            onClick={() => setActiveTab('transcripts')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'transcripts'
                ? 'bg-gray-800 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            💬 Session Logs
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'database'
                ? 'bg-gray-800 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
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
            {clientStats ? (
              clientStats.totalConversations > 0 ? (
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
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center mb-8">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">No Data Available Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    The system is ready, but no conversations have been loaded. Click the <strong>"Pull Data"</strong> button above to sync from the database.
                  </p>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-800 rounded-lg font-semibold">
                    <span>💡</span>
                    <span>Tip: Use the Database tab to check connection status</span>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-8 text-center mb-8">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-yellow-900 mb-2">Loading Statistics...</h3>
                <p className="text-yellow-800 text-sm">Please wait while we fetch data from the database</p>
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
              {/* Initialize Database */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">0. Initialize Database Tables</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Creates the required tables (reps, chat_sessions, chat_messages) if they don't exist.
                  Run this first if you're seeing database errors.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setDbLoading(true)
                      setDbMessage('Initializing database tables...')
                      try {
                        const response = await fetch('/api/admin/init-db', { method: 'POST' })
                        const data = await response.json()
                        if (data.success) {
                          setDbMessage(`✅ Database initialized! Found ${data.messageCount} messages`)
                        } else {
                          setDbMessage(`❌ Initialization failed: ${data.error}`)
                        }
                      } catch (error: any) {
                        setDbMessage(`❌ Error: ${error.message}`)
                      } finally {
                        setDbLoading(false)
                      }
                    }}
                    disabled={dbLoading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-all"
                  >
                    {dbLoading ? 'Initializing...' : '▶️ Initialize Tables'}
                  </button>
                  <button
                    onClick={async () => {
                      setDbLoading(true)
                      setDbMessage('Checking database status...')
                      try {
                        const response = await fetch('/api/admin/init-db')
                        const data = await response.json()
                        if (data.success) {
                          setDbMessage(`✅ Database connected! Messages: ${data.stats.messages}, Sessions: ${data.stats.sessions}, Reps: ${data.stats.reps}`)
                        } else {
                          setDbMessage(`❌ Database check failed: ${data.error}${data.hasUrl ? '' : ' (DATABASE_URL not set)'}`)
                        }
                      } catch (error: any) {
                        setDbMessage(`❌ Error: ${error.message}`)
                      } finally {
                        setDbLoading(false)
                      }
                    }}
                    disabled={dbLoading}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-all"
                  >
                    {dbLoading ? 'Checking...' : '🔍 Check Status'}
                  </button>
                  <button
                    onClick={async () => {
                      setDbLoading(true)
                      setDbMessage('Migrating localStorage conversations to database...')
                      try {
                        // Get all conversations from localStorage
                        const conversations = getAllConversations()

                        if (conversations.length === 0) {
                          setDbMessage('⚠️ No conversations found in localStorage to migrate')
                          return
                        }

                        // Send to migration API
                        const response = await fetch('/api/admin/migrate-localstorage', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ conversations })
                        })

                        const data = await response.json()
                        if (data.success) {
                          setDbMessage(`✅ ${data.message}`)
                        } else {
                          setDbMessage(`❌ Migration failed: ${data.error}`)
                        }
                      } catch (error: any) {
                        setDbMessage(`❌ Error: ${error.message}`)
                      } finally {
                        setDbLoading(false)
                      }
                    }}
                    disabled={dbLoading}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-all"
                  >
                    {dbLoading ? 'Migrating...' : '📤 Migrate Old Chats'}
                  </button>
                </div>

                {/* Migration Warning */}
                <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-800">
                        <strong>⚠️ One-time migration only.</strong> After migration, chats automatically sync to database. Run migration on each device (computer, phone, iPad) to transfer old chats. Future chats don't need migration - they save directly to the database.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
                  <li><strong>First time setup:</strong> Click "Initialize Tables" to create required database tables</li>
                  <li>Use "Check Status" to verify database connection and see current record counts</li>
                  <li><strong>One-time migration:</strong> Click "Migrate Old Chats" to copy existing localStorage conversations to the database. Run this once on each device (computer, phone, iPad) to preserve historical chats.</li>
                  <li><strong>Automatic sync:</strong> After migration, all new chats automatically save to the database. No further migration needed!</li>
                  <li>Click "Run Migrations" to add new database fields (for insurance_companies table)</li>
                  <li>Click "Populate Intelligence Data" to fill in research data for all 64 insurance companies</li>
                  <li>Check the status messages after each operation to verify successful completion</li>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              All Conversations {isUsingFallback ? '(LocalStorage Fallback)' : '(from PostgreSQL Database)'}
            </h2>
            {isUsingFallback ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Warning:</strong> Could not connect to PostgreSQL database. Showing conversations from this computer's localStorage only. Check browser console for details.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-4">
                💾 Showing conversations from all devices (phone, iPad, computer) and all users stored in the database
              </p>
            )}

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
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-xl font-bold mb-3 text-gray-700">
                      {searchQuery ? 'No conversations match your search' : 'No conversations found'}
                    </p>
                    <p className="text-sm mb-6 text-gray-600 max-w-md mx-auto">
                      {searchQuery
                        ? 'Try a different search term or clear the search to see all conversations'
                        : 'No conversations found in the database. This could mean:'
                      }
                    </p>
                    {!searchQuery && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 max-w-lg mx-auto text-left">
                        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                          <span>💡</span>
                          <span>Next Steps:</span>
                        </h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                          <li>Click the <strong>"Pull Data"</strong> button above to sync conversations from the database</li>
                          <li>If this is a new installation, ensure users have started chatting with Susan AI</li>
                          <li>Check that the database connection is configured properly in the Database tab</li>
                          <li>Verify that localStorage conversations were migrated using the "Migrate Old Chats" button in the Database tab</li>
                        </ol>
                        <div className="mt-4 pt-4 border-t border-blue-300">
                          <p className="text-xs text-blue-700">
                            <strong>Note:</strong> Conversations are automatically saved to the database as users chat. The Pull Data button fetches all conversations from all devices.
                          </p>
                        </div>
                      </div>
                    )}
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
                  All ({clientConversations.filter(c => c.isFlagged && c.alerts && c.alerts.length > 0).length})
                </button>
                <button
                  onClick={() => setAlertSeverityFilter('critical')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    alertSeverityFilter === 'critical'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  Critical ({clientConversations.filter(c => c.highestSeverity === 'critical').length})
                </button>
                <button
                  onClick={() => setAlertSeverityFilter('high')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    alertSeverityFilter === 'high'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                >
                  High ({clientConversations.filter(c => c.highestSeverity === 'high').length})
                </button>
                <button
                  onClick={() => setAlertSeverityFilter('medium')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    alertSeverityFilter === 'medium'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  Medium ({clientConversations.filter(c => c.highestSeverity === 'medium').length})
                </button>
                <button
                  onClick={() => setAlertSeverityFilter('low')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    alertSeverityFilter === 'low'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Low ({clientConversations.filter(c => c.highestSeverity === 'low').length})
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

        {/* Master Transcript View - All messages chronologically */}
        {activeTab === 'master-transcript' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Master Transcript - All Messages</h2>
            <p className="text-sm text-gray-600 mb-6">
              Chronological view of all messages across all users and conversations. Color-coded by user.
            </p>

            {/* Export Button */}
            <div className="mb-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total messages: <span className="font-bold text-gray-900">{clientConversations.reduce((sum, conv) => sum + conv.messages.length, 0)}</span>
              </div>
              <button
                onClick={() => {
                  // Create master transcript text
                  const allMessages: Array<{ timestamp: Date; repName: string; role: string; content: string }> = []

                  clientConversations.forEach(conv => {
                    conv.messages.forEach(msg => {
                      allMessages.push({
                        timestamp: msg.timestamp,
                        repName: conv.displayName,
                        role: msg.role,
                        content: msg.content
                      })
                    })
                  })

                  // Sort chronologically
                  allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                  // Format as text
                  const transcriptText = allMessages.map(msg => {
                    const time = new Date(msg.timestamp).toLocaleString()
                    const speaker = msg.role === 'user' ? msg.repName : 'SusanAI-21'
                    return `[${time}] ${speaker}: ${msg.content}`
                  }).join('\n\n')

                  // Download as text file
                  const blob = new Blob([transcriptText], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `master_transcript_${new Date().toISOString().split('T')[0]}.txt`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
              >
                <span>📥</span>
                <span>Export as TXT</span>
              </button>
            </div>

            {/* Master Timeline */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-[800px] overflow-y-auto">
                {(() => {
                  // Collect all messages with metadata
                  const allMessages: Array<{ timestamp: Date; repName: string; role: string; content: string; conversationId: string }> = []

                  clientConversations.forEach(conv => {
                    conv.messages.forEach(msg => {
                      allMessages.push({
                        timestamp: msg.timestamp,
                        repName: conv.displayName,
                        role: msg.role,
                        content: msg.content,
                        conversationId: conv.id
                      })
                    })
                  })

                  // Sort chronologically (oldest first)
                  allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                  // Color palette for different users
                  const userColors: Record<string, string> = {}
                  const colors = [
                    'bg-blue-100 border-blue-400',
                    'bg-green-100 border-green-400',
                    'bg-amber-100 border-amber-400',
                    'bg-purple-100 border-purple-400',
                    'bg-pink-100 border-pink-400',
                    'bg-indigo-100 border-indigo-400',
                    'bg-teal-100 border-teal-400',
                    'bg-orange-100 border-orange-400'
                  ]

                  let colorIndex = 0
                  const getColorForUser = (repName: string) => {
                    if (!userColors[repName]) {
                      userColors[repName] = colors[colorIndex % colors.length]
                      colorIndex++
                    }
                    return userColors[repName]
                  }

                  return (
                    <div className="divide-y divide-gray-200">
                      {allMessages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <div className="text-4xl mb-4">📜</div>
                          <p className="text-lg font-semibold mb-2">No messages found</p>
                          <p className="text-sm">Click "Pull Data" to sync from database</p>
                        </div>
                      ) : (
                        allMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              msg.role === 'user' ? 'border-l-4 ' + getColorForUser(msg.repName) : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Timestamp */}
                              <div className="text-xs text-gray-500 font-mono whitespace-nowrap pt-1">
                                {new Date(msg.timestamp).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </div>

                              {/* Speaker & Message */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-sm font-bold ${
                                    msg.role === 'user' ? 'text-gray-900' : 'text-red-700'
                                  }`}>
                                    {msg.role === 'user' ? `👤 ${msg.repName}` : '🤖 SusanAI-21'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Legend</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-gray-50 border-l-4 border-gray-400"></div>
                    <span className="text-gray-700">AI Response (SusanAI-21)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-400"></div>
                    <span className="text-gray-700">User messages (color-coded by user)</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  <p><strong>Tip:</strong> Use the export button to download the complete transcript as a text file for analysis or record-keeping.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
