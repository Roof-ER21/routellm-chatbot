#!/usr/bin/env bash
set -euo pipefail

# Local dev helper that avoids remote AI calls
# and uses a local Postgres database by default.

PORT=${PORT:-4000}

# Disable remote AI providers for fast offline dev
export DEPLOYMENT_TOKEN=""
export EDUCATION_DEPLOYMENT_TOKEN=""
# If you want to test Hugging Face, set a real key before running
export HUGGINGFACE_API_KEY="${HUGGINGFACE_API_KEY:-}"

# Default local DB if not already provided by the shell
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:55432/s21}"

echo "Starting Next.js dev server on :$PORT"
echo "- Offline AI mode (static knowledge fallback)"
echo "- DATABASE_URL=${DATABASE_URL}"

exec node_modules/.bin/next dev -p "$PORT"

