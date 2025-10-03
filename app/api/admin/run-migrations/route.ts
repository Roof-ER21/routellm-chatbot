/**
 * Admin API: Run Database Migrations
 * POST /api/admin/run-migrations
 *
 * Runs SQL migrations to add intelligence fields to insurance companies table
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/railway-db';

export async function POST(request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      console.log('🚀 Starting database migrations...');

      // Migration 1: Add digital platform and intelligence fields
      console.log('📋 Running migration 1: Add fields...');
      await client.query('BEGIN');

      await client.query(`
        -- Add Digital Platform Fields
        ALTER TABLE insurance_companies
        ADD COLUMN IF NOT EXISTS app_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS app_store_url TEXT,
        ADD COLUMN IF NOT EXISTS client_login_url TEXT,
        ADD COLUMN IF NOT EXISTS guest_login_url TEXT,
        ADD COLUMN IF NOT EXISTS portal_notes TEXT;

        -- Add Intelligence Fields (from deep dive research)
        ALTER TABLE insurance_companies
        ADD COLUMN IF NOT EXISTS best_call_times VARCHAR(255),
        ADD COLUMN IF NOT EXISTS current_delays TEXT,
        ADD COLUMN IF NOT EXISTS proven_workarounds TEXT,
        ADD COLUMN IF NOT EXISTS regional_intel TEXT,
        ADD COLUMN IF NOT EXISTS social_escalation VARCHAR(255),
        ADD COLUMN IF NOT EXISTS complaints_pattern TEXT,
        ADD COLUMN IF NOT EXISTS alternative_channels TEXT,
        ADD COLUMN IF NOT EXISTS executive_escalation TEXT;

        -- Add Rating/Performance Fields
        ALTER TABLE insurance_companies
        ADD COLUMN IF NOT EXISTS naic_complaint_index DECIMAL(5,2),
        ADD COLUMN IF NOT EXISTS bbb_rating VARCHAR(10),
        ADD COLUMN IF NOT EXISTS avg_hold_time_minutes INTEGER,
        ADD COLUMN IF NOT EXISTS responsiveness_score INTEGER;

        -- Add Metadata
        ALTER TABLE insurance_companies
        ADD COLUMN IF NOT EXISTS last_intelligence_update TIMESTAMP DEFAULT NOW();
      `);

      await client.query('COMMIT');
      console.log('✅ Migration 1 completed');

      // Migration 2: Create indexes
      console.log('📋 Running migration 2: Create indexes...');
      await client.query('BEGIN');

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_insurance_app_name ON insurance_companies(app_name) WHERE app_name IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_insurance_responsiveness ON insurance_companies(responsiveness_score DESC NULLS LAST);
        CREATE INDEX IF NOT EXISTS idx_insurance_naic ON insurance_companies(naic_complaint_index ASC NULLS LAST);
        CREATE INDEX IF NOT EXISTS idx_insurance_hold_time ON insurance_companies(avg_hold_time_minutes ASC NULLS LAST);
      `);

      await client.query('COMMIT');
      console.log('✅ Migration 2 completed');

      return NextResponse.json({
        success: true,
        message: 'Database migrations completed successfully',
        migrations: [
          'Added digital platform fields (app_name, client_login_url, guest_login_url, portal_notes)',
          'Added intelligence fields (best_call_times, current_delays, proven_workarounds, etc.)',
          'Added rating fields (naic_complaint_index, bbb_rating, avg_hold_time_minutes, responsiveness_score)',
          'Created performance indexes',
        ],
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Migration failed',
          details: error.message,
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
