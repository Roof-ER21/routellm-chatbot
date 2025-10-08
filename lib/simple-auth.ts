/**
 * Simple Authentication Library
 * Uses localStorage for storing user accounts and conversation history
 */

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ThreatAlert {
  pattern: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  timestamp: number
  messageIndex: number
  highlightedText: string
  riskScore: number
}

export interface Conversation {
  id: string
  date: number
  messages: Message[]
  title: string
  preview: string
  alerts?: ThreatAlert[]
  isFlagged?: boolean
  highestSeverity?: 'critical' | 'high' | 'medium' | 'low'
}

export interface User {
  code: string
  createdAt: number
  conversations: Conversation[]
}

export interface AuthData {
  users: Record<string, User>
  currentUser: string | null
  rememberMe: boolean
}

const STORAGE_KEY = 'susan21_simple_auth'

// Get auth data from localStorage
function getAuthData(): AuthData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading auth data:', error)
  }

  return {
    users: {},
    currentUser: null,
    rememberMe: false
  }
}

// Save auth data to localStorage
function saveAuthData(data: AuthData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving auth data:', error)
  }
}

// Sign up a new user
export function signUp(name: string, code: string): { success: boolean; error?: string } {
  if (!name || !code) {
    return { success: false, error: 'Name and code are required' }
  }

  if (code.length !== 4 || !/^\d{4}$/.test(code)) {
    return { success: false, error: 'Code must be exactly 4 digits' }
  }

  const data = getAuthData()
  const username = name.toLowerCase().trim()

  if (data.users[username]) {
    return { success: false, error: 'User already exists' }
  }

  data.users[username] = {
    code,
    createdAt: Date.now(),
    conversations: []
  }

  saveAuthData(data)
  return { success: true }
}

// Login user
export function login(name: string, code: string, rememberMe: boolean = false): { success: boolean; error?: string } {
  if (!name || !code) {
    return { success: false, error: 'Name and code are required' }
  }

  const data = getAuthData()
  const username = name.toLowerCase().trim()

  if (!data.users[username]) {
    return { success: false, error: 'User not found' }
  }

  if (data.users[username].code !== code) {
    return { success: false, error: 'Invalid code' }
  }

  data.currentUser = username
  data.rememberMe = rememberMe
  saveAuthData(data)

  // Save PIN to localStorage if rememberMe is true
  if (rememberMe) {
    try {
      localStorage.setItem(`susan_${username}_pin_remembered`, code)
    } catch (error) {
      console.error('Error saving remembered PIN:', error)
    }
  } else {
    // Clear saved PIN if user unchecks remember me
    try {
      localStorage.removeItem(`susan_${username}_pin_remembered`)
    } catch (error) {
      console.error('Error removing remembered PIN:', error)
    }
  }

  return { success: true }
}

// Logout user
// By default, preserves the rememberMe setting so user doesn't need to re-check on next login
// Pass clearRememberMe=true to fully clear the remember setting and saved PIN
export function logout(clearRememberMe: boolean = false): void {
  const data = getAuthData()
  const currentUser = data.currentUser

  data.currentUser = null
  if (clearRememberMe) {
    data.rememberMe = false
    // Clear saved PIN from localStorage when explicitly logging out
    if (currentUser) {
      try {
        localStorage.removeItem(`susan_${currentUser}_pin_remembered`)
      } catch (error) {
        console.error('Error removing remembered PIN:', error)
      }
    }
  }
  saveAuthData(data)
}

// Get current logged-in user
export function getCurrentUser(): string | null {
  const data = getAuthData()
  return data.currentUser
}

// Check if remember me is enabled
export function isRemembered(): boolean {
  const data = getAuthData()
  return data.rememberMe && data.currentUser !== null
}

// Get remembered PIN for a user (if exists)
export function getRememberedPin(name: string): string | null {
  const username = name.toLowerCase().trim()
  try {
    return localStorage.getItem(`susan_${username}_pin_remembered`)
  } catch (error) {
    console.error('Error retrieving remembered PIN:', error)
    return null
  }
}

// Save conversation for current user
// conversationId: optional, if provided updates existing, otherwise creates new
export function saveConversation(messages: Message[], conversationId?: string): { success: boolean; error?: string; conversationId?: string } {
  const data = getAuthData()

  if (!data.currentUser) {
    return { success: false, error: 'No user logged in' }
  }

  if (!data.users[data.currentUser]) {
    return { success: false, error: 'User not found' }
  }

  // Create conversation object
  const firstUserMessage = messages.find(m => m.role === 'user')
  const title = firstUserMessage
    ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
    : 'New conversation'

  const preview = firstUserMessage
    ? firstUserMessage.content.substring(0, 100) + (firstUserMessage.content.length > 100 ? '...' : '')
    : 'New conversation'

  // Use existing ID if provided, otherwise create new
  const id = conversationId || Date.now().toString()

  const conversation: Conversation = {
    id,
    date: Date.now(),
    messages: messages.map(m => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
    })),
    title,
    preview
  }

  // Update existing or add new conversation
  const existingIndex = data.users[data.currentUser].conversations.findIndex(c => c.id === id)
  if (existingIndex !== -1) {
    // Update existing conversation
    data.users[data.currentUser].conversations[existingIndex] = conversation
  } else {
    // Add new conversation (keep latest 20)
    data.users[data.currentUser].conversations = [
      conversation,
      ...data.users[data.currentUser].conversations
    ].slice(0, 20)
  }

  saveAuthData(data)
  return { success: true, conversationId: id }
}

// Get all conversations for current user
export function getConversations(): Conversation[] {
  const data = getAuthData()

  if (!data.currentUser || !data.users[data.currentUser]) {
    return []
  }

  return data.users[data.currentUser].conversations
}

// Get a specific conversation by ID
export function getConversation(conversationId: string): Conversation | null {
  const data = getAuthData()

  if (!data.currentUser || !data.users[data.currentUser]) {
    return null
  }

  return data.users[data.currentUser].conversations.find(c => c.id === conversationId) || null
}

// Delete a conversation
export function deleteConversation(conversationId: string): { success: boolean; error?: string } {
  const data = getAuthData()

  if (!data.currentUser || !data.users[data.currentUser]) {
    return { success: false, error: 'No user logged in' }
  }

  data.users[data.currentUser].conversations = data.users[data.currentUser].conversations.filter(
    c => c.id !== conversationId
  )

  saveAuthData(data)
  return { success: true }
}

// Get user display name (original case)
export function getUserDisplayName(): string | null {
  const data = getAuthData()

  if (!data.currentUser) {
    return null
  }

  // Return the current user key, but we should store the original case
  // For now, capitalize first letter of each word
  return data.currentUser
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Get current conversation (most recent)
export function getCurrentConversation(): Conversation | null {
  const data = getAuthData()

  if (!data.currentUser || !data.users[data.currentUser]) {
    return null
  }

  const conversations = data.users[data.currentUser].conversations
  if (conversations.length === 0) {
    return null
  }

  // Return the most recent conversation (first in array)
  return conversations[0]
}

// Cleanup conversations older than 60 days
export function cleanupOldConversations(): { success: boolean; deleted: number } {
  const data = getAuthData()

  if (!data.currentUser || !data.users[data.currentUser]) {
    return { success: false, deleted: 0 }
  }

  const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000)
  const initialCount = data.users[data.currentUser].conversations.length

  // Filter out conversations older than 60 days
  data.users[data.currentUser].conversations = data.users[data.currentUser].conversations.filter(
    c => c.date >= sixtyDaysAgo
  )

  const deletedCount = initialCount - data.users[data.currentUser].conversations.length

  if (deletedCount > 0) {
    saveAuthData(data)
  }

  return { success: true, deleted: deletedCount }
}

// Clear all auth data (for testing)
export function clearAllAuthData(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// Admin-only: Get all users with their data
export function getAllUsers(): Array<{ username: string; user: User }> {
  const data = getAuthData()
  return Object.entries(data.users).map(([username, user]) => ({
    username,
    user
  }))
}

// Admin-only: Get all conversations from all users
export interface UserConversation extends Conversation {
  username: string
  displayName: string
}

export function getAllConversations(): UserConversation[] {
  const data = getAuthData()
  const allConversations: UserConversation[] = []

  Object.entries(data.users).forEach(([username, user]) => {
    const displayName = username
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    user.conversations.forEach(conversation => {
      allConversations.push({
        ...conversation,
        username,
        displayName
      })
    })
  })

  // Sort by date descending (newest first)
  allConversations.sort((a, b) => b.date - a.date)

  return allConversations
}

// Admin-only: Get conversation statistics
export interface ConversationStats {
  totalUsers: number
  totalConversations: number
  totalMessages: number
  totalAlerts: number
  criticalAlerts: number
  highAlerts: number
  userStats: Array<{
    username: string
    displayName: string
    conversationCount: number
    messageCount: number
    lastActive: number
    alertCount: number
  }>
}

export function getConversationStats(): ConversationStats {
  const data = getAuthData()
  const users = Object.entries(data.users)

  let totalAlerts = 0
  let criticalAlerts = 0
  let highAlerts = 0

  const userStats = users.map(([username, user]) => {
    const displayName = username
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    const messageCount = user.conversations.reduce(
      (sum, conv) => sum + conv.messages.length,
      0
    )

    const alertCount = user.conversations.reduce(
      (sum, conv) => sum + (conv.alerts?.length || 0),
      0
    )

    // Count severity levels
    user.conversations.forEach(conv => {
      if (conv.alerts) {
        conv.alerts.forEach(alert => {
          totalAlerts++
          if (alert.severity === 'critical') criticalAlerts++
          if (alert.severity === 'high') highAlerts++
        })
      }
    })

    const lastActive = user.conversations.length > 0
      ? Math.max(...user.conversations.map(c => c.date))
      : user.createdAt

    return {
      username,
      displayName,
      conversationCount: user.conversations.length,
      messageCount,
      lastActive,
      alertCount
    }
  })

  const totalConversations = userStats.reduce((sum, u) => sum + u.conversationCount, 0)
  const totalMessages = userStats.reduce((sum, u) => sum + u.messageCount, 0)

  return {
    totalUsers: users.length,
    totalConversations,
    totalMessages,
    totalAlerts,
    criticalAlerts,
    highAlerts,
    userStats: userStats.sort((a, b) => b.lastActive - a.lastActive)
  }
}

// Add alert to a conversation
export function addAlertToConversation(
  conversationId: string,
  alert: ThreatAlert
): { success: boolean; error?: string } {
  const data = getAuthData()

  if (!data.currentUser || !data.users[data.currentUser]) {
    return { success: false, error: 'No user logged in' }
  }

  const conversation = data.users[data.currentUser].conversations.find(c => c.id === conversationId)

  if (!conversation) {
    return { success: false, error: 'Conversation not found' }
  }

  // Initialize alerts array if it doesn't exist
  if (!conversation.alerts) {
    conversation.alerts = []
  }

  // Add the alert
  conversation.alerts.push(alert)

  // Mark conversation as flagged
  conversation.isFlagged = true

  // Update highest severity
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
  const currentHighest = conversation.highestSeverity || 'low'

  if (severityOrder[alert.severity] > severityOrder[currentHighest]) {
    conversation.highestSeverity = alert.severity
  }

  saveAuthData(data)
  return { success: true }
}

// Get all flagged conversations across all users (admin only)
export function getAllFlaggedConversations(): UserConversation[] {
  const data = getAuthData()
  const flaggedConversations: UserConversation[] = []

  Object.entries(data.users).forEach(([username, user]) => {
    const displayName = username
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    user.conversations.forEach(conversation => {
      if (conversation.isFlagged && conversation.alerts && conversation.alerts.length > 0) {
        flaggedConversations.push({
          ...conversation,
          username,
          displayName
        })
      }
    })
  })

  // Sort by severity (critical first) then by date
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
  flaggedConversations.sort((a, b) => {
    const aSeverity = a.highestSeverity || 'low'
    const bSeverity = b.highestSeverity || 'low'

    if (severityOrder[aSeverity] !== severityOrder[bSeverity]) {
      return severityOrder[bSeverity] - severityOrder[aSeverity]
    }

    return b.date - a.date
  })

  return flaggedConversations
}

// Clear alerts from a conversation (admin action)
export function clearConversationAlerts(
  username: string,
  conversationId: string
): { success: boolean; error?: string } {
  const data = getAuthData()

  if (!data.users[username]) {
    return { success: false, error: 'User not found' }
  }

  const conversation = data.users[username].conversations.find(c => c.id === conversationId)

  if (!conversation) {
    return { success: false, error: 'Conversation not found' }
  }

  conversation.alerts = []
  conversation.isFlagged = false
  conversation.highestSeverity = undefined

  saveAuthData(data)
  return { success: true }
}
