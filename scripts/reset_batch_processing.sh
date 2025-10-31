#!/bin/bash
# Reset Batch Processing State and Database
# USE WITH CAUTION: This will delete all embeddings and progress

set -e

echo "================================="
echo "RESET BATCH PROCESSING"
echo "================================="
echo ""
echo "⚠️  WARNING: This will:"
echo "  - Delete all embeddings from database"
echo "  - Delete all documents from database"
echo "  - Reset progress state"
echo ""

read -p "Are you sure? Type 'yes' to continue: " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Reset cancelled."
    exit 0
fi

echo ""
echo "🔄 Resetting..."

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set."
    exit 1
fi

# Clear database
echo "1. Clearing database tables..."
psql "$DATABASE_URL" << EOF
TRUNCATE rag_chunks CASCADE;
TRUNCATE rag_documents CASCADE;
EOF

echo "✅ Database cleared"

# Reset state file
STATE_FILE="/Users/a21/routellm-chatbot/scripts/.batch_progress.json"
if [ -f "$STATE_FILE" ]; then
    echo "2. Removing progress state file..."
    rm "$STATE_FILE"
    echo "✅ State file removed"
else
    echo "2. No state file found (already clean)"
fi

# Clear log file
LOG_FILE="/Users/a21/routellm-chatbot/scripts/batch_embeddings.log"
if [ -f "$LOG_FILE" ]; then
    echo "3. Clearing log file..."
    > "$LOG_FILE"
    echo "✅ Log file cleared"
else
    echo "3. No log file found"
fi

echo ""
echo "✅ Reset complete!"
echo ""
echo "To start fresh processing:"
echo "  cd /Users/a21/routellm-chatbot/scripts"
echo "  python3 batch_embeddings_processor.py --batch-size 15 --reset-state"
echo ""
