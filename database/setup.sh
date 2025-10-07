#!/bin/bash

# ============================================================================
# Susan AI Roofing Assistant - Database Setup Script
# Automates PostgreSQL schema deployment to Railway or local environment
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if DATABASE_URL is set
check_database_url() {
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL environment variable is not set"
        echo ""
        print_info "Set DATABASE_URL in one of these ways:"
        echo "  1. Export in terminal: export DATABASE_URL='postgresql://user:pass@host:port/db'"
        echo "  2. Load from .env: source .env"
        echo "  3. Railway: railway run ./database/setup.sh"
        echo ""
        exit 1
    fi
    print_success "DATABASE_URL found"
}

# Check PostgreSQL connection
check_connection() {
    print_info "Testing database connection..."
    if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
        print_success "Database connection successful"
        psql "$DATABASE_URL" -c "SELECT version();" | head -n 3
    else
        print_error "Failed to connect to database"
        exit 1
    fi
}

# Check PostgreSQL version
check_pg_version() {
    print_info "Checking PostgreSQL version..."
    version=$(psql "$DATABASE_URL" -tAc "SHOW server_version;")
    major_version=$(echo "$version" | cut -d'.' -f1)

    if [ "$major_version" -ge 12 ]; then
        print_success "PostgreSQL version: $version (Compatible)"
    else
        print_warning "PostgreSQL version: $version (Recommended: 12+)"
    fi
}

# Backup existing database
backup_database() {
    if [ "$1" = "skip" ]; then
        print_info "Skipping backup"
        return
    fi

    print_info "Creating database backup..."
    backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"

    if pg_dump "$DATABASE_URL" > "$SCRIPT_DIR/$backup_file" 2>/dev/null; then
        print_success "Backup created: $backup_file"
    else
        print_warning "Backup failed or database is empty"
    fi
}

# Run schema
deploy_schema() {
    print_info "Deploying database schema..."

    if psql "$DATABASE_URL" -f "$SCRIPT_DIR/schema.sql" > /tmp/schema_output.log 2>&1; then
        print_success "Schema deployed successfully"
    else
        print_error "Schema deployment failed"
        cat /tmp/schema_output.log
        exit 1
    fi
}

# Load sample data
load_sample_data() {
    if [ "$1" = "skip" ]; then
        print_info "Skipping sample data"
        return
    fi

    print_info "Loading sample data..."

    if psql "$DATABASE_URL" -f "$SCRIPT_DIR/sample_data.sql" > /tmp/sample_output.log 2>&1; then
        print_success "Sample data loaded"
    else
        print_error "Sample data loading failed"
        cat /tmp/sample_output.log
        exit 1
    fi
}

# Verify installation
verify_installation() {
    print_info "Verifying installation..."

    # Check tables
    table_count=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
    print_success "Tables created: $table_count"

    # Check indexes
    index_count=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';")
    print_success "Indexes created: $index_count"

    # Check views
    view_count=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM information_schema.views WHERE table_schema = 'public';")
    print_success "Views created: $view_count"

    # Check triggers
    trigger_count=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM information_schema.triggers WHERE trigger_schema = 'public';")
    print_success "Triggers created: $trigger_count"

    # Check functions
    function_count=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace;")
    print_success "Functions created: $function_count"
}

# Show database stats
show_stats() {
    print_info "Database statistics:"
    echo ""
    psql "$DATABASE_URL" -c "
        SELECT
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    "
}

# Main setup function
main() {
    print_header "Susan AI Roofing Assistant - Database Setup"

    # Parse arguments
    SKIP_BACKUP=false
    SKIP_SAMPLE=false
    FORCE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-sample)
                SKIP_SAMPLE=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-backup    Skip database backup"
                echo "  --skip-sample    Skip loading sample data"
                echo "  --force          Force deployment without confirmation"
                echo "  --help           Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                                    # Full setup with backup and sample data"
                echo "  $0 --skip-sample                      # Setup without sample data"
                echo "  $0 --skip-backup --skip-sample        # Fresh schema only"
                echo "  railway run ./database/setup.sh       # Deploy to Railway"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Pre-flight checks
    check_database_url
    check_connection
    check_pg_version

    # Confirmation
    if [ "$FORCE" = false ]; then
        echo ""
        print_warning "This will deploy the database schema to:"
        psql "$DATABASE_URL" -c "SELECT current_database();"
        echo ""
        read -p "Continue? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Setup cancelled"
            exit 0
        fi
    fi

    # Backup
    if [ "$SKIP_BACKUP" = true ]; then
        backup_database skip
    else
        backup_database
    fi

    # Deploy schema
    deploy_schema

    # Load sample data
    if [ "$SKIP_SAMPLE" = true ]; then
        load_sample_data skip
    else
        load_sample_data
    fi

    # Verify
    verify_installation

    # Stats
    echo ""
    show_stats

    # Success
    print_header "Setup Complete!"
    print_success "Database is ready for use"
    echo ""
    print_info "Next steps:"
    echo "  1. Update your application's DATABASE_URL"
    echo "  2. Test the connection with your app"
    echo "  3. Review the documentation in database/README.md"
    echo "  4. Check common queries in database/common_queries.sql"
    echo ""
}

# Run main function
main "$@"
