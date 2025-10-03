'use client'

import { useState, useEffect } from 'react'
import StormDataModal from '../components/StormDataModal'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'today' | 'transcripts'>('overview')

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
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
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
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 All-Time Stats
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
            💬 Chat Transcripts
          </button>
        </div>

        {/* All-Time Stats */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All-Time Statistics</h2>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">Rep Name</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Total Chats</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Sessions</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Messages</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.map((rep, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{rep.name}</td>
                      <td className="px-6 py-4 text-center text-gray-700">{rep.total_chats}</td>
                      <td className="px-6 py-4 text-center text-gray-700">{rep.total_sessions}</td>
                      <td className="px-6 py-4 text-center text-gray-700">{rep.total_messages}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        {new Date(rep.last_active).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No data available yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today's Activity */}
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

        {/* Transcripts */}
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
      </div>
    </div>
  )
}
