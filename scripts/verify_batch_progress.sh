#!/bin/bash
# Verify Batch Processing Progress
# Shows current state, database stats, and costs

set -e

echo "================================="
echo "BATCH PROCESSING PROGRESS CHECK"
echo "================================="
echo ""

# Check state file exists
STATE_FILE="/Users/a21/routellm-chatbot/scripts/.batch_progress.json"

if [ ! -f "$STATE_FILE" ]; then
    echo "❌ No progress state found. Batch processing not started yet."
    echo ""
    echo "To start processing:"
    echo "  cd /Users/a21/routellm-chatbot/scripts"
    echo "  python3 batch_embeddings_processor.py --batch-size 15"
    exit 1
fi

echo "📊 Progress State:"
echo "-----------------"
cat "$STATE_FILE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Documents Processed: {data[\"processed_documents\"]}/{data[\"total_documents\"]} ({data[\"processed_documents\"]/data[\"total_documents\"]*100:.1f}%)')
print(f'Current Batch: {data[\"current_batch\"]}/{data[\"total_batches\"]}')
print(f'Chunks Processed: {data[\"total_chunks_processed\"]:,}')
print(f'Tokens Used: {data[\"total_tokens_used\"]:,}')
print(f'Estimated Cost: \${data[\"total_cost_usd\"]:.4f}')
print(f'Failed Documents: {len(data[\"failed_documents\"])}')
print(f'Completed Batches: {len(data[\"completed_batches\"])}')
print(f'Last Updated: {data[\"last_updated\"]}')
"
echo ""

# Check database connection
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Cannot verify database."
    echo "   Set with: export DATABASE_URL='postgresql://...'"
    exit 1
fi

echo "🗄️  Database Stats:"
echo "------------------"

# Count documents
DOC_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM rag_documents;" 2>/dev/null || echo "0")
echo "Documents in DB: $DOC_COUNT"

# Count chunks
CHUNK_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM rag_chunks;" 2>/dev/null || echo "0")
echo "Chunks in DB: $CHUNK_COUNT"

# Check if embeddings exist
EMBEDDING_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM rag_chunks WHERE embedding IS NOT NULL;" 2>/dev/null || echo "0")
echo "Chunks with embeddings: $EMBEDDING_COUNT"

echo ""

# Category breakdown
echo "📁 Category Breakdown:"
echo "---------------------"
psql "$DATABASE_URL" -c "
    SELECT
        metadata->>'category' AS category,
        COUNT(*) AS chunks
    FROM rag_chunks
    GROUP BY metadata->>'category'
    ORDER BY chunks DESC;
" 2>/dev/null || echo "Could not fetch category breakdown"

echo ""

# Completion status
PROCESSED=$(cat "$STATE_FILE" | python3 -c "import sys, json; print(json.load(sys.stdin)['processed_documents'])")
TOTAL=$(cat "$STATE_FILE" | python3 -c "import sys, json; print(json.load(sys.stdin)['total_documents'])")

if [ "$PROCESSED" -eq "$TOTAL" ]; then
    echo "✅ Processing COMPLETE!"
    echo ""
    echo "Next steps:"
    echo "  1. Test vector search: psql \$DATABASE_URL < test_vector_search.sql"
    echo "  2. Integrate with RAG system"
    echo "  3. Deploy to production"
else
    REMAINING=$((TOTAL - PROCESSED))
    echo "⏳ Processing IN PROGRESS"
    echo "   Remaining: $REMAINING documents"
    echo ""
    echo "To resume processing:"
    echo "  cd /Users/a21/routellm-chatbot/scripts"
    echo "  python3 batch_embeddings_processor.py --batch-size 15"
fi

echo ""
echo "================================="
