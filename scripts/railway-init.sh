#!/bin/bash

# Railway Initialization Script
# This runs automatically on Railway deployment to set up RAG database

set -e

echo "🚀 Railway Initialization"
echo "========================="

# Check if database is already initialized
if node -e "
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  client.connect()
    .then(() => client.query(\"SELECT 1 FROM pg_extension WHERE extname = 'vector'\"))
    .then(result => {
      if (result.rows.length > 0) {
        console.log('Database already initialized');
        process.exit(0);
      }
      process.exit(1);
    })
    .catch(err => {
      console.log('Database not initialized');
      process.exit(1);
    });
" 2>/dev/null; then
  echo "✓ Database already initialized"
  echo "✓ Skipping RAG setup"
else
  echo "📊 First-time setup detected"
  echo "📊 Initializing RAG database..."

  # Run database initialization
  if node ./scripts/init-rag-database.js; then
    echo "✓ Database initialized successfully"
  else
    echo "⚠️  Database initialization failed (non-critical)"
    echo "    Run manually: railway run npm run db:init:rag"
  fi
fi

echo ""
echo "🚀 Starting application..."
