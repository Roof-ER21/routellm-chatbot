import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const q = (url.searchParams.get('q') || '').toLowerCase().trim()
    if (!q) return NextResponse.json({ success: true, results: [] })

    const kbPath = path.join(process.cwd(), 'public', 'offline-kb.json')
    const kbRaw = fs.existsSync(kbPath) ? fs.readFileSync(kbPath, 'utf-8') : '{}'
    const kb = JSON.parse(kbRaw)
    const entries: Array<{ keywords?: string[]; answer: string }> = Array.isArray(kb.entries) ? kb.entries : []

    const tokens = q.split(/[^a-z0-9]+/).filter(Boolean)
    const scored = entries.map(e => {
      const ans = String(e.answer || '')
      const ansLC = ans.toLowerCase()
      const kws = (e.keywords || []).map(x => String(x).toLowerCase())
      let score = 0
      for (const kw of kws) if (q.includes(kw)) score += 3
      for (const t of tokens) if (t.length > 2 && ansLC.includes(t)) score += 1
      return { score, answer: ans };
    }).filter(x => x.score >= 3)

    scored.sort((a,b) => b.score - a.score)
    return NextResponse.json({ success: true, results: scored.slice(0, 10) })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

