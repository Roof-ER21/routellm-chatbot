/**
 * TypeScript Types for Conversation Sync System
 *
 * Use these types in your client-side code for type safety
 */

// API Request/Response Types

export interface SignupRequest {
  name: string
  code: string
  displayName: string
}

export interface SignupResponse {
  success: boolean
  userId?: number
  displayName?: string
  error?: string
}

export interface LoginRequest {
  name: string
  code: string
}

export interface LoginResponse {
  success: boolean
  userId?: number
  displayName?: string
  lastActive?: string
  error?: string
}

export interface SyncConversationRequest {
  userId: number
  conversation: ConversationData
}

export interface SyncConversationResponse {
  success: boolean
  conversationId?: string
  messageCount?: number
  alertCount?: number
  error?: string
}

export interface GetConversationsResponse {
  success: boolean
  conversations?: ConversationSummary[]
  count?: number
  error?: string
}

export interface AdminAllConversationsResponse {
  success: boolean
  conversations?: AdminConversationSummary[]
  stats?: AdminStats
  count?: number
  error?: string
}

export interface AdminSyncStatsResponse {
  success: boolean
  stats?: SystemStats
  userStats?: UserStats[]
  error?: string
}

// Data Types

export interface ConversationData {
  id: string
  title: string
  preview: string
  createdAt?: string
  messages: MessageData[]
  alerts?: AlertData[]
}

export interface MessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AlertData {
  id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  timestamp: string
  flagged?: boolean
}

export interface ConversationSummary {
  id: string
  user_id: number
  title: string
  preview: string
  created_at: string
  updated_at: string
  message_count: number
  alert_count: number
}

export interface AdminConversationSummary extends ConversationSummary {
  display_name: string
  user_name: string
  flagged_alert_count: number
  critical_alert_count: number
}

export interface AdminStats {
  totalConversations: number
  totalMessages: number
  totalAlerts: number
  flaggedConversations: number
  criticalAlertConversations: number
}

export interface SystemStats {
  totalUsers: number
  totalConversations: number
  totalMessages: number
  totalAlerts: number
  criticalAlerts: number
  highAlerts: number
  flaggedAlerts: number
}

export interface UserStats {
  userId: number
  name: string
  displayName: string
  lastActive: string
  conversationCount: number
  messageCount: number
  alertCount: number
  criticalAlertCount: number
}

// Client-side helper class

export class SyncClient {
  private baseUrl: string
  private userId: number | null = null

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  setUserId(userId: number) {
    this.userId = userId
  }

  async signup(name: string, code: string, displayName: string): Promise<SignupResponse> {
    const response = await fetch(`${this.baseUrl}/api/sync/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code, displayName })
    })
    return response.json()
  }

  async login(name: string, code: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/api/sync/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code })
    })
    const result = await response.json()
    if (result.success && result.userId) {
      this.userId = result.userId
    }
    return result
  }

  async syncConversation(conversation: ConversationData): Promise<SyncConversationResponse> {
    if (!this.userId) {
      throw new Error('User not logged in. Call login() first.')
    }

    const response = await fetch(`${this.baseUrl}/api/sync/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.userId, conversation })
    })
    return response.json()
  }

  async getConversations(): Promise<GetConversationsResponse> {
    if (!this.userId) {
      throw new Error('User not logged in. Call login() first.')
    }

    const response = await fetch(`${this.baseUrl}/api/sync/conversations?userId=${this.userId}`)
    return response.json()
  }

  async getAllConversations(adminPasscode: string, filters?: { flagged?: boolean; severity?: string }): Promise<AdminAllConversationsResponse> {
    let url = `${this.baseUrl}/api/admin/all-conversations?passcode=${adminPasscode}`
    if (filters?.flagged) url += '&flagged=true'
    if (filters?.severity) url += `&severity=${filters.severity}`

    const response = await fetch(url)
    return response.json()
  }

  async getSystemStats(adminPasscode: string): Promise<AdminSyncStatsResponse> {
    const response = await fetch(`${this.baseUrl}/api/admin/sync-stats?passcode=${adminPasscode}`)
    return response.json()
  }
}
