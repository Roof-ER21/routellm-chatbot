import { NextRequest, NextResponse } from 'next/server'
import { aiFailover } from '@/lib/ai-provider-failover'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const provider = (url.searchParams.get('provider') || '').toLowerCase()

  const env = {
    abacus_configured: Boolean(process.env.DEPLOYMENT_TOKEN),
    abacus_deployment: process.env.ABACUS_DEPLOYMENT_ID || 'none',
    huggingface_configured: Boolean(process.env.HUGGINGFACE_API_KEY),
    huggingface_model: process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',
    ollama_url: process.env.OLLAMA_API_URL || 'http://localhost:11434',
  }

  const messages = [{ role: 'user' as const, content: 'Quick ping test' }]

  const result: any = { env, health: aiFailover.getHealthStatus() }

  try {
    if (provider === 'huggingface' || provider === 'hf') {
      const res = await aiFailover.getResponseFrom('HuggingFace', messages)
      result.huggingface = { ok: true, model: res.model }
    } else if (provider === 'abacus' || provider === 'abacus.ai') {
      const res = await aiFailover.getResponseFrom('Abacus.AI', messages)
      result.abacus = { ok: true, model: res.model }
    } else if (provider === 'ollama') {
      const res = await aiFailover.getResponseFrom('Ollama', messages)
      result.ollama = { ok: true, model: res.model }
    }
  } catch (err: any) {
    result.error = String(err.message || err)
  }

  return NextResponse.json(result)
}

