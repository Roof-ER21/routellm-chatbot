#!/usr/bin/env bash
set -euo pipefail

# Initialize local Postgres database with project schema and seed data.
# Assumes a local container running on 127.0.0.1:55432 with user/password postgres.

PGHOST=${PGHOST:-127.0.0.1}
PGPORT=${PGPORT:-55432}
PGUSER=${PGUSER:-postgres}
PGPASSWORD=${PGPASSWORD:-postgres}
PGDATABASE=${PGDATABASE:-s21}

export PGPASSWORD

command -v psql >/dev/null 2>&1 || { echo "psql is required. Install Postgres client tools." >&2; exit 1; }

cd "$(dirname "$0")/.."

echo "Initializing database at ${PGHOST}:${PGPORT}/${PGDATABASE}"

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f db/schema.sql
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f db/insurance_companies.sql
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f db/seed_insurance_companies.sql
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f db/migrations/001_add_digital_and_intelligence_fields.sql
# This file updates rows and may fail if some companies are absent — ignore errors
psql -v ON_ERROR_STOP=0 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f db/migrations/002_populate_intelligence_data.sql || true

echo "Database initialization complete."

