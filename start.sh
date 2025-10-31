#!/bin/bash
# Railway startup script
# Use Railway's PORT if set, otherwise 4000
PORT=${PORT:-4000}

echo "=== Railway Startup ==="

# Smart RAG initialization (checks if embeddings exist before generating)
node scripts/smart-rag-init.js

echo "Starting Next.js server on port $PORT..."
node_modules/.bin/next start -p $PORT
