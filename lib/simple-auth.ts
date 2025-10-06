/**
 * Simple Authentication Library
 * Uses localStorage for storing user accounts and conversation history
 */

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Conversation {
  id: string
  date: number
  messages: Message[]
  title: string
  preview: string
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

  return { success: true }
}

// Logout user
export function logout(): void {
  const data = getAuthData()
  data.currentUser = null
  data.rememberMe = false
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

// Save conversation for current user
export function saveConversation(messages: Message[]): { success: boolean; error?: string } {
  const data = getAuthData()

  if (!data.currentUser) {
    return { success: false, error: 'No user logged in' }
  }

  if (!data.users[data.currentUser]) {
    return { success: false, error: 'User not found' }
  }

  // Create conversation object
  const firstUserMessage = messages.find(m => m.role === 'user')
  const preview = firstUserMessage
    ? firstUserMessage.content.substring(0, 100)
    : 'New conversation'

  const title = firstUserMessage
    ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
    : 'New conversation'

  const conversation: Conversation = {
    id: Date.now().toString(),
    date: Date.now(),
    messages: messages.map(m => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
    })),
    title,
    preview
  }

  // Add to user's conversations (keep latest 20)
  data.users[data.currentUser].conversations = [
    conversation,
    ...data.users[data.currentUser].conversations.filter(c => c.id !== conversation.id)
  ].slice(0, 20)

  saveAuthData(data)
  return { success: true }
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

// Clear all auth data (for testing)
export function clearAllAuthData(): void {
  localStorage.removeItem(STORAGE_KEY)
}
