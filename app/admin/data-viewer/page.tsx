'use client'

import { useState, useEffect } from 'react'

// Native implementation - no external dependencies needed
function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`
  return `${Math.floor(seconds / 2592000)} months ago`
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ConversationData {
  id: string
  user: string
  started_at: string
  message_count: number
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
}

interface EmailData {
  id: number
  user: string
  template: string
  to_email: string
  subject: string
  body: string
  generated_at: string
  delivery_status: string
}

interface FeedbackData {
  id: number
  user: string
  feedback_type: string
  question: string
  susan_response: string
  user_correction: string
  severity: 'low' | 'medium' | 'high'
  status: 'new' | 'reviewed' | 'fixed'
  timestamp: string
}

interface UserActivity {
  user: string
  total_sessions: number
  total_messages: number
  total_emails: number
  most_used_template: string
  error_rate: number
  last_active: string
}

interface SystemLog {
  id: number
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
  metadata?: any
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DataViewer() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'conversations' | 'emails' | 'feedback' | 'users' | 'logs' | 'rag'>('conversations')
  const [loading, setLoading] = useState(false)

  // Data states
  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [emails, setEmails] = useState<EmailData[]>([])
  const [feedback, setFeedback] = useState<FeedbackData[]>([])
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [ragStatus, setRagStatus] = useState<any>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  })
  const [userFilter, setUserFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  // Check authentication
  useEffect(() => {
    const authenticated = sessionStorage.getItem('data_viewer_authenticated')
    if (authenticated === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData()
    }
  }, [isAuthenticated, activeTab])

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passcode === '2110') {
      setIsAuthenticated(true)
      sessionStorage.setItem('data_viewer_authenticated', 'true')
      setError('')
    } else {
      setError('Incorrect passcode. Please try again.')
      setPasscode('')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('data_viewer_authenticated')
    setPasscode('')
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Load data based on active tab
      switch (activeTab) {
        case 'conversations':
          await loadConversations()
          break
        case 'emails':
          await loadEmails()
          break
        case 'feedback':
          await loadFeedback()
          break
        case 'users':
          await loadUserActivity()
          break
        case 'logs':
          await loadSystemLogs()
          break
        case 'rag':
          await loadRAGStatus()
          break
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/admin/export-data?type=conversations')
      const data = await response.json()
      if (data.success) {
        setConversations(data.data)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadEmails = async () => {
    try {
      const response = await fetch('/api/admin/export-data?type=emails')
      const data = await response.json()
      if (data.success) {
        setEmails(data.data)
      }
    } catch (error) {
      console.error('Error loading emails:', error)
    }
  }

  const loadFeedback = async () => {
    try {
      const response = await fetch('/api/admin/export-data?type=feedback')
      const data = await response.json()
      if (data.success) {
        setFeedback(data.data || [])
      }
    } catch (error) {
      console.error('Error loading feedback:', error)
    }
  }

  const loadUserActivity = async () => {
    try {
      const response = await fetch('/api/admin/export-data?type=user_activity')
      const data = await response.json()
      if (data.success) {
        setUserActivity(data.data)
      }
    } catch (error) {
      console.error('Error loading user activity:', error)
    }
  }

  const loadSystemLogs = async () => {
    try {
      const response = await fetch('/api/admin/export-data?type=logs')
      const data = await response.json()
      if (data.success) {
        setSystemLogs(data.data || [])
      }
    } catch (error) {
      console.error('Error loading system logs:', error)
    }
  }

  const loadRAGStatus = async () => {
    try {
      const response = await fetch('/api/health/dataset')
      const data = await response.json()
      setRagStatus(data)
    } catch (error) {
      console.error('Error loading RAG status:', error)
    }
  }

  // ============================================================================
  // EXPORT FUNCTIONS
  // ============================================================================

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
          return `"${stringValue.replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ============================================================================
  // LOGIN SCREEN
  // ============================================================================

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📊</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Data Viewer Access
              </h1>
              <p className="text-gray-400 text-sm">Administrative Dashboard</p>
            </div>

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
                  className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-600 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white text-center text-2xl tracking-widest"
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
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>🔓</span>
                <span>Unlock Data Viewer</span>
              </button>
            </form>

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

  // ============================================================================
  // MAIN DASHBOARD
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#1a1a1a] text-white shadow-xl border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Data Viewer
                </h1>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Comprehensive Data Analytics</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadAllData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
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
        {/* Navigation Tabs */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'conversations'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            💬 Conversations
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'emails'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📧 Emails Generated
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'feedback'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            💭 Feedback & Corrections
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            👥 User Activity
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            📋 System Logs
          </button>
          <button
            onClick={() => setActiveTab('rag')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'rag'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            🧠 RAG System
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Filters & Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Filter</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Users</option>
                {/* Dynamically populate based on data */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items Per Page</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const currentData =
                      activeTab === 'conversations' ? conversations :
                      activeTab === 'emails' ? emails :
                      activeTab === 'feedback' ? feedback :
                      activeTab === 'users' ? userActivity :
                      systemLogs
                    exportToCSV(currentData, activeTab)
                  }}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                >
                  CSV
                </button>
                <button
                  onClick={() => {
                    const currentData =
                      activeTab === 'conversations' ? conversations :
                      activeTab === 'emails' ? emails :
                      activeTab === 'feedback' ? feedback :
                      activeTab === 'users' ? userActivity :
                      systemLogs
                    exportToJSON(currentData, activeTab)
                  }}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                >
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversations Tab */}
            {activeTab === 'conversations' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">All Conversations</h3>
                    <p className="text-sm text-gray-600 mt-1">{conversations.length} total conversations</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Messages</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {conversations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            No conversations found
                          </td>
                        </tr>
                      ) : (
                        conversations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((conv) => (
                          <tr key={conv.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{conv.user}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(conv.started_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 text-center">{conv.message_count}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {conv.messages[0]?.content.substring(0, 50)}...
                            </td>
                            <td className="px-6 py-4 text-sm text-center">
                              <button className="text-blue-600 hover:text-blue-800 font-medium">View</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Emails Tab */}
            {activeTab === 'emails' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Generated Emails</h3>
                    <p className="text-sm text-gray-600 mt-1">{emails.length} total emails</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {emails.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No emails found
                          </td>
                        </tr>
                      ) : (
                        emails.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((email) => (
                          <tr key={email.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{email.user}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{email.template}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{email.to_email}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{email.subject}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                email.delivery_status === 'sent'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {email.delivery_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(email.generated_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">User Feedback & Corrections</h3>
                    <p className="text-sm text-gray-600 mt-1">{feedback.length} feedback items</p>
                  </div>
                </div>
                <div className="p-6">
                  {feedback.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No feedback items yet. This feature will track when users report incorrect responses.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedback.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{item.user}</span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.severity === 'high' ? 'bg-red-100 text-red-800' :
                                item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {item.severity}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                item.status === 'reviewed' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong className="text-gray-700">Question:</strong>
                              <p className="text-gray-600 mt-1">{item.question}</p>
                            </div>
                            <div>
                              <strong className="text-gray-700">Susan's Response:</strong>
                              <p className="text-gray-600 mt-1">{item.susan_response}</p>
                            </div>
                            <div>
                              <strong className="text-gray-700">User Correction:</strong>
                              <p className="text-gray-600 mt-1">{item.user_correction}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Activity Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">User Activity Summary</h3>
                    <p className="text-sm text-gray-600 mt-1">{userActivity.length} users</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sessions</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Messages</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Emails</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Most Used Template</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {userActivity.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No user activity data
                          </td>
                        </tr>
                      ) : (
                        userActivity.map((user, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.user}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 text-center">{user.total_sessions}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 text-center">{user.total_messages}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 text-center">{user.total_emails}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{user.most_used_template}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(user.last_active).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* System Logs Tab */}
            {activeTab === 'logs' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">System Logs</h3>
                    <p className="text-sm text-gray-600 mt-1">{systemLogs.length} log entries</p>
                  </div>
                </div>
                <div className="p-6">
                  {systemLogs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No system logs available
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {systemLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log) => (
                        <div
                          key={log.id}
                          className={`p-3 rounded border-l-4 ${
                            log.level === 'error' ? 'bg-red-50 border-red-500' :
                            log.level === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                            'bg-blue-50 border-blue-500'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold uppercase ${
                                log.level === 'error' ? 'text-red-700' :
                                log.level === 'warning' ? 'text-yellow-700' :
                                'text-blue-700'
                              }`}>
                                {log.level}
                              </span>
                              <span className="text-sm text-gray-700">{log.message}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RAG System Tab */}
            {activeTab === 'rag' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">RAG System Status</h3>
                  <p className="text-sm text-gray-600 mt-1">Dataset connection and knowledge base information</p>
                </div>
                <div className="p-6">
                  {ragStatus ? (
                    <div className="space-y-6">
                      {/* Connection Status */}
                      <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-4xl">{ragStatus.connected ? '✅' : '❌'}</div>
                        <div>
                          <h4 className="text-lg font-bold text-green-900">
                            {ragStatus.connected ? 'Dataset Connected' : 'Dataset Disconnected'}
                          </h4>
                          <p className="text-sm text-green-700">
                            Susan {ragStatus.connected ? 'has full access' : 'does not have access'} to the knowledge base
                          </p>
                        </div>
                      </div>

                      {/* RAG Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-900">{ragStatus.totalChunks || 0}</div>
                          <div className="text-sm text-blue-700">Embedding Chunks</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-purple-900">{ragStatus.embeddingDimension || 0}</div>
                          <div className="text-sm text-purple-700">Embedding Dimension</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-green-900">{ragStatus.sources || 0}</div>
                          <div className="text-sm text-green-700">Source Documents</div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-amber-900">{ragStatus.cacheSize || 0}</div>
                          <div className="text-sm text-amber-700">Cache Size</div>
                        </div>
                      </div>

                      {/* System Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-bold text-gray-900 mb-3">System Information</h4>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="font-semibold text-gray-700">Status:</dt>
                            <dd className="text-gray-600">{ragStatus.loaded ? 'Loaded' : 'Not Loaded'}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-gray-700">Enabled:</dt>
                            <dd className="text-gray-600">{ragStatus.enabled ? 'Yes' : 'No'}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-gray-700">Embeddings Path:</dt>
                            <dd className="text-gray-600 text-xs font-mono">{ragStatus.embeddingsPath || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-gray-700">Knowledge Base Path:</dt>
                            <dd className="text-gray-600 text-xs font-mono">{ragStatus.knowledgeBasePath || 'N/A'}</dd>
                          </div>
                        </dl>
                      </div>

                      {/* Health Check Button */}
                      <button
                        onClick={loadRAGStatus}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <span>🔄</span>
                        <span>Refresh RAG Status</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Loading RAG system status...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pagination */}
            {(conversations.length > 0 || emails.length > 0 || feedback.length > 0) && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage,
                    activeTab === 'conversations' ? conversations.length :
                    activeTab === 'emails' ? emails.length :
                    activeTab === 'feedback' ? feedback.length :
                    activeTab === 'users' ? userActivity.length :
                    systemLogs.length
                  )} of {
                    activeTab === 'conversations' ? conversations.length :
                    activeTab === 'emails' ? emails.length :
                    activeTab === 'feedback' ? feedback.length :
                    activeTab === 'users' ? userActivity.length :
                    systemLogs.length
                  } entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-lg font-medium text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage * itemsPerPage >= (
                      activeTab === 'conversations' ? conversations.length :
                      activeTab === 'emails' ? emails.length :
                      activeTab === 'feedback' ? feedback.length :
                      activeTab === 'users' ? userActivity.length :
                      systemLogs.length
                    )}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-lg font-medium text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
