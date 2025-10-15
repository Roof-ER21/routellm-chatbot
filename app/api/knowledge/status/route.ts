import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const kbPath = path.join(process.cwd(), 'public', 'offline-kb.json')
    const insPath = path.join(process.cwd(), 'public', 'offline-insurance.json')
    const kbRaw = fs.existsSync(kbPath) ? fs.readFileSync(kbPath, 'utf-8') : '{}'
    const insRaw = fs.existsSync(insPath) ? fs.readFileSync(insPath, 'utf-8') : '[]'
    const kb = JSON.parse(kbRaw)
    const companies = JSON.parse(insRaw)
    return NextResponse.json({
      success: true,
      kbEntries: Array.isArray(kb.entries) ? kb.entries.length : 0,
      builtAt: kb.builtAt || null,
      companies: Array.isArray(companies) ? companies.length : 0,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

