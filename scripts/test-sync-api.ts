/**
 * Test Script for Conversation Sync API
 *
 * Run with: node --loader ts-node/esm scripts/test-sync-api.ts
 * Or add to package.json: "test:sync": "tsx scripts/test-sync-api.ts"
 */

import { ensureSyncTablesExist } from '../lib/sync-db'

const API_BASE = process.env.API_BASE || 'http://localhost:4000'
const ADMIN_PASSCODE = '2110'

interface TestResult {
  name: string
  success: boolean
  error?: string
  data?: any
}

const results: TestResult[] = []

function log(message: string, level: 'info' | 'success' | 'error' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m'    // Red
  }
  const reset = '\x1b[0m'
  console.log(`${colors[level]}${message}${reset}`)
}

async function testEndpoint(name: string, fn: () => Promise<any>): Promise<void> {
  try {
    log(`\nTesting: ${name}`, 'info')
    const result = await fn()
    results.push({ name, success: true, data: result })
    log(`✓ ${name} - PASSED`, 'success')
  } catch (error: any) {
    results.push({ name, success: false, error: error.message })
    log(`✗ ${name} - FAILED: ${error.message}`, 'error')
  }
}

async function main() {
  log('\n='.repeat(60), 'info')
  log('Conversation Sync API Test Suite', 'info')
  log('='.repeat(60), 'info')

  // Test 1: Ensure tables exist
  await testEndpoint('Database Setup', async () => {
    await ensureSyncTablesExist()
    return { tablesCreated: true }
  })

  // Test 2: Signup
  let userId: number | undefined
  await testEndpoint('POST /api/sync/signup', async () => {
    const response = await fetch(`${API_BASE}/api/sync/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `test_user_${Date.now()}`,
        code: 'test123',
        displayName: 'Test User'
      })
    })

    const data = await response.json()
    if (!data.success) throw new Error(data.error)

    userId = data.userId
    return data
  })

  // Test 3: Signup duplicate (should fail)
  await testEndpoint('POST /api/sync/signup (duplicate - should fail)', async () => {
    const response = await fetch(`${API_BASE}/api/sync/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'test_user_duplicate',
        code: 'test123',
        displayName: 'Test User'
      })
    })

    const data1 = await response.json()

    // Try again with same name
    const response2 = await fetch(`${API_BASE}/api/sync/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'test_user_duplicate',
        code: 'test456',
        displayName: 'Different User'
      })
    })

    const data2 = await response2.json()
    if (data2.success) throw new Error('Should have failed for duplicate user')

    return { firstSignup: data1, duplicateAttempt: data2 }
  })

  // Test 4: Login with valid credentials
  await testEndpoint('POST /api/sync/login (valid)', async () => {
    const response = await fetch(`${API_BASE}/api/sync/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'test_user_duplicate',
        code: 'test123'
      })
    })

    const data = await response.json()
    if (!data.success) throw new Error(data.error)

    return data
  })

  // Test 5: Login with invalid credentials (should fail)
  await testEndpoint('POST /api/sync/login (invalid - should fail)', async () => {
    const response = await fetch(`${API_BASE}/api/sync/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'test_user_duplicate',
        code: 'wrong_code'
      })
    })

    const data = await response.json()
    if (data.success) throw new Error('Should have failed with invalid credentials')

    return data
  })

  // Test 6: Sync a conversation
  let conversationId: string | undefined
  if (userId) {
    await testEndpoint('POST /api/sync/conversation', async () => {
      conversationId = `test-conv-${Date.now()}`

      const response = await fetch(`${API_BASE}/api/sync/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          conversation: {
            id: conversationId,
            title: 'Test Conversation',
            preview: 'This is a test conversation',
            createdAt: new Date().toISOString(),
            messages: [
              {
                id: 'msg-1',
                role: 'user',
                content: 'Hello, I need help with a claim',
                timestamp: new Date().toISOString()
              },
              {
                id: 'msg-2',
                role: 'assistant',
                content: 'I would be happy to help you with your claim.',
                timestamp: new Date().toISOString()
              }
            ],
            alerts: [
              {
                id: 'alert-1',
                type: 'test_alert',
                severity: 'warning',
                title: 'Test Alert',
                message: 'This is a test alert',
                timestamp: new Date().toISOString(),
                flagged: true
              }
            ]
          }
        })
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      return data
    })
  }

  // Test 7: Get user conversations
  if (userId) {
    await testEndpoint('GET /api/sync/conversations', async () => {
      const response = await fetch(`${API_BASE}/api/sync/conversations?userId=${userId}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)
      if (data.count === 0) throw new Error('Expected at least one conversation')

      return data
    })
  }

  // Test 8: Admin - Get all conversations
  await testEndpoint('GET /api/admin/all-conversations', async () => {
    const response = await fetch(`${API_BASE}/api/admin/all-conversations?passcode=${ADMIN_PASSCODE}`)
    const data = await response.json()

    if (!data.success) throw new Error(data.error)

    return {
      conversationCount: data.count,
      stats: data.stats
    }
  })

  // Test 9: Admin - Get all conversations (filtered by flagged)
  await testEndpoint('GET /api/admin/all-conversations?flagged=true', async () => {
    const response = await fetch(`${API_BASE}/api/admin/all-conversations?passcode=${ADMIN_PASSCODE}&flagged=true`)
    const data = await response.json()

    if (!data.success) throw new Error(data.error)

    return {
      flaggedCount: data.count
    }
  })

  // Test 10: Admin - Get specific conversation
  if (conversationId) {
    await testEndpoint('GET /api/admin/all-conversations?conversationId=xxx', async () => {
      const response = await fetch(`${API_BASE}/api/admin/all-conversations?passcode=${ADMIN_PASSCODE}&conversationId=${conversationId}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)
      if (!data.conversation) throw new Error('Conversation not found')

      return {
        conversationId: data.conversation.id,
        messageCount: data.conversation.messages.length,
        alertCount: data.conversation.alerts.length
      }
    })
  }

  // Test 11: Admin - Get system stats
  await testEndpoint('GET /api/admin/sync-stats', async () => {
    const response = await fetch(`${API_BASE}/api/admin/sync-stats?passcode=${ADMIN_PASSCODE}`)
    const data = await response.json()

    if (!data.success) throw new Error(data.error)

    return data.stats
  })

  // Test 12: Admin - Unauthorized access (should fail)
  await testEndpoint('Admin endpoint without passcode (should fail)', async () => {
    const response = await fetch(`${API_BASE}/api/admin/sync-stats`)
    const data = await response.json()

    if (data.success) throw new Error('Should have failed without passcode')

    return data
  })

  // Print summary
  log('\n' + '='.repeat(60), 'info')
  log('Test Summary', 'info')
  log('='.repeat(60), 'info')

  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  log(`\nTotal Tests: ${results.length}`, 'info')
  log(`Passed: ${passed}`, 'success')
  log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success')

  if (failed > 0) {
    log('\nFailed Tests:', 'error')
    results.filter(r => !r.success).forEach(r => {
      log(`  - ${r.name}: ${r.error}`, 'error')
    })
  }

  log('\n' + '='.repeat(60) + '\n', 'info')

  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
main().catch(error => {
  log(`\nFatal error: ${error.message}`, 'error')
  process.exit(1)
})
