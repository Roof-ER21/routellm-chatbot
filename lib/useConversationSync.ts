/**
 * React Hook for Conversation Sync
 *
 * Provides easy-to-use functions for syncing conversations
 * to both localStorage and PostgreSQL
 */

import { useState, useEffect, useCallback } from 'react'
import { SyncClient, ConversationData } from './sync-types'

interface UseSyncOptions {
  autoSync?: boolean // Auto-sync on save (default: true)
  syncInterval?: number // Auto-sync interval in ms (default: 60000 = 1 minute)
  onSyncSuccess?: () => void
  onSyncError?: (error: any) => void
}

export function useConversationSync(options: UseSyncOptions = {}) {
  const {
    autoSync = true,
    syncInterval = 60000,
    onSyncSuccess,
    onSyncError
  } = options

  const [syncClient] = useState(() => new SyncClient())
  const [userId, setUserId] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncQueue, setSyncQueue] = useState<ConversationData[]>([])

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('sync_user_id')
    if (storedUserId) {
      const id = parseInt(storedUserId, 10)
      setUserId(id)
      syncClient.setUserId(id)
      setIsLoggedIn(true)
    }

    // Load sync queue
    const storedQueue = localStorage.getItem('sync_queue')
    if (storedQueue) {
      setSyncQueue(JSON.parse(storedQueue))
    }
  }, [syncClient])

  // Process sync queue periodically
  useEffect(() => {
    if (!autoSync || !isLoggedIn || syncQueue.length === 0) return

    const interval = setInterval(async () => {
      await processSyncQueue()
    }, syncInterval)

    return () => clearInterval(interval)
  }, [autoSync, isLoggedIn, syncQueue.length, syncInterval])

  // Process queue when online
  useEffect(() => {
    const handleOnline = () => {
      if (isLoggedIn && syncQueue.length > 0) {
        processSyncQueue()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [isLoggedIn, syncQueue.length])

  /**
   * Signup a new user
   */
  const signup = useCallback(async (name: string, code: string, displayName: string) => {
    try {
      const result = await syncClient.signup(name, code, displayName)

      if (result.success && result.userId) {
        setUserId(result.userId)
        syncClient.setUserId(result.userId)
        setIsLoggedIn(true)
        localStorage.setItem('sync_user_id', result.userId.toString())
        localStorage.setItem('sync_user_name', name)
        localStorage.setItem('sync_display_name', result.displayName || displayName)
      }

      return result
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [syncClient])

  /**
   * Login an existing user
   */
  const login = useCallback(async (name: string, code: string) => {
    try {
      const result = await syncClient.login(name, code)

      if (result.success && result.userId) {
        setUserId(result.userId)
        syncClient.setUserId(result.userId)
        setIsLoggedIn(true)
        localStorage.setItem('sync_user_id', result.userId.toString())
        localStorage.setItem('sync_user_name', name)
        localStorage.setItem('sync_display_name', result.displayName || name)
      }

      return result
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [syncClient])

  /**
   * Logout current user
   */
  const logout = useCallback(() => {
    setUserId(null)
    setIsLoggedIn(false)
    localStorage.removeItem('sync_user_id')
    localStorage.removeItem('sync_user_name')
    localStorage.removeItem('sync_display_name')
  }, [])

  /**
   * Save conversation to localStorage
   */
  const saveLocally = useCallback((conversation: ConversationData) => {
    const conversations = JSON.parse(localStorage.getItem('conversations') || '[]')
    const index = conversations.findIndex((c: any) => c.id === conversation.id)

    if (index >= 0) {
      conversations[index] = conversation
    } else {
      conversations.push(conversation)
    }

    localStorage.setItem('conversations', JSON.stringify(conversations))
  }, [])

  /**
   * Sync conversation to server
   */
  const syncToServer = useCallback(async (conversation: ConversationData): Promise<boolean> => {
    if (!isLoggedIn) {
      console.warn('Not logged in, skipping server sync')
      return false
    }

    try {
      setIsSyncing(true)
      const result = await syncClient.syncConversation(conversation)

      if (result.success) {
        setLastSyncTime(new Date())
        // Remove from queue if it was there
        setSyncQueue(prev => prev.filter(c => c.id !== conversation.id))
        localStorage.setItem('sync_queue', JSON.stringify(syncQueue.filter(c => c.id !== conversation.id)))
        onSyncSuccess?.()
        return true
      } else {
        throw new Error(result.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync error:', error)
      // Add to queue for retry
      addToQueue(conversation)
      onSyncError?.(error)
      return false
    } finally {
      setIsSyncing(false)
    }
  }, [isLoggedIn, syncClient, syncQueue, onSyncSuccess, onSyncError])

  /**
   * Save conversation (localStorage + server sync)
   */
  const saveConversation = useCallback(async (conversation: ConversationData) => {
    // Always save locally first
    saveLocally(conversation)

    // Sync to server if logged in and auto-sync enabled
    if (isLoggedIn && autoSync) {
      await syncToServer(conversation)
    } else if (isLoggedIn) {
      // Add to queue for manual sync
      addToQueue(conversation)
    }
  }, [saveLocally, syncToServer, isLoggedIn, autoSync])

  /**
   * Add conversation to sync queue
   */
  const addToQueue = useCallback((conversation: ConversationData) => {
    setSyncQueue(prev => {
      const index = prev.findIndex(c => c.id === conversation.id)
      const newQueue = [...prev]

      if (index >= 0) {
        newQueue[index] = conversation
      } else {
        newQueue.push(conversation)
      }

      localStorage.setItem('sync_queue', JSON.stringify(newQueue))
      return newQueue
    })
  }, [])

  /**
   * Process sync queue
   */
  const processSyncQueue = useCallback(async () => {
    if (!isLoggedIn || syncQueue.length === 0) return

    setIsSyncing(true)

    for (const conversation of syncQueue) {
      try {
        const result = await syncClient.syncConversation(conversation)
        if (result.success) {
          // Remove from queue
          setSyncQueue(prev => {
            const newQueue = prev.filter(c => c.id !== conversation.id)
            localStorage.setItem('sync_queue', JSON.stringify(newQueue))
            return newQueue
          })
        } else {
          // Stop processing on first failure
          break
        }
      } catch (error) {
        console.error('Queue processing error:', error)
        break
      }
    }

    setIsSyncing(false)
    if (syncQueue.length === 0) {
      setLastSyncTime(new Date())
      onSyncSuccess?.()
    }
  }, [isLoggedIn, syncQueue, syncClient, onSyncSuccess])

  /**
   * Get all conversations from server
   */
  const getServerConversations = useCallback(async () => {
    if (!isLoggedIn) {
      throw new Error('Not logged in')
    }

    return await syncClient.getConversations()
  }, [isLoggedIn, syncClient])

  /**
   * Get all conversations from localStorage
   */
  const getLocalConversations = useCallback((): ConversationData[] => {
    return JSON.parse(localStorage.getItem('conversations') || '[]')
  }, [])

  /**
   * Sync all local conversations to server
   */
  const syncAllToServer = useCallback(async () => {
    const localConversations = getLocalConversations()

    for (const conversation of localConversations) {
      await syncToServer(conversation)
    }
  }, [getLocalConversations, syncToServer])

  return {
    // State
    isLoggedIn,
    userId,
    isSyncing,
    lastSyncTime,
    queueLength: syncQueue.length,

    // Auth functions
    signup,
    login,
    logout,

    // Sync functions
    saveConversation,
    saveLocally,
    syncToServer,
    processSyncQueue,
    syncAllToServer,

    // Get functions
    getServerConversations,
    getLocalConversations,

    // Sync client for advanced usage
    syncClient
  }
}

/**
 * Example usage:
 *
 * function MyComponent() {
 *   const {
 *     isLoggedIn,
 *     isSyncing,
 *     queueLength,
 *     signup,
 *     login,
 *     saveConversation,
 *     getServerConversations
 *   } = useConversationSync({
 *     autoSync: true,
 *     syncInterval: 60000,
 *     onSyncSuccess: () => console.log('Synced!'),
 *     onSyncError: (error) => console.error('Sync failed:', error)
 *   })
 *
 *   const handleSignup = async () => {
 *     const result = await signup('john_doe', 'secret123', 'John Doe')
 *     if (result.success) {
 *       console.log('Signed up!')
 *     }
 *   }
 *
 *   const handleSaveConversation = async (conversation) => {
 *     await saveConversation(conversation)
 *   }
 *
 *   return (
 *     <div>
 *       {isLoggedIn ? (
 *         <div>
 *           <p>Logged in! {isSyncing ? 'Syncing...' : 'Idle'}</p>
 *           <p>Queue: {queueLength} items</p>
 *         </div>
 *       ) : (
 *         <button onClick={handleSignup}>Sign Up</button>
 *       )}
 *     </div>
 *   )
 * }
 */
