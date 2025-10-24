import { NextResponse } from 'next/server'
import { ragService } from '@/lib/rag-service'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Get RAG service status
    const ragStatus = ragService.getStatus()

    // Check if embeddings file exists
    const embeddingsPath = path.join(process.cwd(), 'data', 'susan_ai_embeddings.json')
    const knowledgeBasePath = path.join(process.cwd(), 'training_data', 'susan_ai_knowledge_base.json')

    const embeddingsExists = fs.existsSync(embeddingsPath)
    const knowledgeBaseExists = fs.existsSync(knowledgeBasePath)

    // Get file stats
    let embeddingsStats = null
    let knowledgeBaseStats = null

    if (embeddingsExists) {
      const stats = fs.statSync(embeddingsPath)
      embeddingsStats = {
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        modified: stats.mtime
      }
    }

    if (knowledgeBaseExists) {
      const stats = fs.statSync(knowledgeBasePath)
      knowledgeBaseStats = {
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        modified: stats.mtime
      }
    }

    // Try to load and parse metadata from embeddings file
    let embeddingsMetadata = null
    if (embeddingsExists) {
      try {
        const rawData = fs.readFileSync(embeddingsPath, 'utf-8')
        const data = JSON.parse(rawData)
        embeddingsMetadata = data.metadata || null
      } catch (error) {
        console.error('Error reading embeddings metadata:', error)
      }
    }

    // Determine connection status
    const connected = ragStatus.loaded &&
                     ragStatus.enabled &&
                     ragStatus.totalChunks > 0 &&
                     embeddingsExists &&
                     knowledgeBaseExists

    return NextResponse.json({
      success: true,
      connected,
      timestamp: new Date().toISOString(),
      rag: {
        loaded: ragStatus.loaded,
        enabled: ragStatus.enabled,
        totalChunks: ragStatus.totalChunks,
        cacheSize: ragStatus.cacheSize,
        embeddingDimension: ragStatus.embeddingDimension
      },
      files: {
        embeddings: {
          exists: embeddingsExists,
          path: embeddingsPath,
          stats: embeddingsStats
        },
        knowledgeBase: {
          exists: knowledgeBaseExists,
          path: knowledgeBasePath,
          stats: knowledgeBaseStats
        }
      },
      metadata: embeddingsMetadata,
      environment: {
        RAG_ENABLED: process.env.RAG_ENABLED || 'true',
        RAG_TOP_K: process.env.RAG_TOP_K || '5',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
      },
      health: {
        status: connected ? 'healthy' : 'unhealthy',
        issues: [
          !ragStatus.loaded && 'RAG service not loaded',
          !ragStatus.enabled && 'RAG service disabled',
          ragStatus.totalChunks === 0 && 'No embeddings loaded',
          !embeddingsExists && 'Embeddings file missing',
          !knowledgeBaseExists && 'Knowledge base file missing'
        ].filter(Boolean)
      }
    })

  } catch (error: any) {
    console.error('[Dataset Health Check] Error:', error)
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST endpoint to reload embeddings
export async function POST() {
  try {
    console.log('[Dataset Health Check] Reloading embeddings...')
    await ragService.reload()

    const status = ragService.getStatus()

    return NextResponse.json({
      success: true,
      message: 'Embeddings reloaded successfully',
      status,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[Dataset Health Check] Reload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
