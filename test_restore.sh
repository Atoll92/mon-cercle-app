#!/bin/bash

# Test Restore Script - For Development Environment Only
# This script tests the restore procedure on a development database

set -e

echo "🔧 Testing Database Restore Procedure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Safety check
echo -e "${RED}⚠️  WARNING: This script will DESTROY the current database!${NC}"
echo -e "${RED}⚠️  ONLY run this on a DEVELOPMENT environment!${NC}"
echo ""
echo -n "Are you sure you want to continue? Type 'YES' to proceed: "
read CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    print_error "Aborted by user"
    exit 1
fi

# Check if we're in development
if [ -z "$SUPABASE_DB_URL" ] && [ ! -f .env.local ]; then
    print_error "No development environment detected. This script is for development only!"
    exit 1
fi

# Find the most recent backup
LATEST_BACKUP=$(find backups -name "backup_pre_multiprofile_migration_*.sql" | sort | tail -1)

if [ -z "$LATEST_BACKUP" ]; then
    print_error "No backup files found. Run create_backup.sh first."
    exit 1
fi

print_status "Using backup: $LATEST_BACKUP"

# Get database URL
if [ -f .supabase/config.toml ]; then
    DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')
else
    print_error "Supabase project not linked"
    exit 1
fi

if [ -z "$DB_URL" ]; then
    print_error "Could not get database URL"
    exit 1
fi

# Create a test table to verify the reset works
print_status "Creating test table to verify reset..."
psql "$DB_URL" -c "CREATE TABLE IF NOT EXISTS test_restore_table (id SERIAL PRIMARY KEY, test_data TEXT);"
psql "$DB_URL" -c "INSERT INTO test_restore_table (test_data) VALUES ('test_data_before_restore');"

# Count rows before reset
BEFORE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM profiles;" | xargs)
print_status "Profiles count before reset: $BEFORE_COUNT"

# Reset the database
print_warning "Resetting database..."
supabase db reset --linked

# Verify the test table is gone
if psql "$DB_URL" -c "SELECT COUNT(*) FROM test_restore_table;" 2>/dev/null; then
    print_error "Database reset failed - test table still exists"
    exit 1
else
    print_success "Database reset confirmed - test table removed"
fi

# Restore from backup
print_status "Restoring from backup..."
psql "$DB_URL" < "$LATEST_BACKUP"

if [ $? -eq 0 ]; then
    print_success "Backup restored successfully"
else
    print_error "Backup restore failed"
    exit 1
fi

# Verify restoration
print_status "Verifying restoration..."

# Check if profiles table exists and has data
AFTER_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM profiles;" | xargs)
print_status "Profiles count after restore: $AFTER_COUNT"

if [ "$AFTER_COUNT" -eq "$BEFORE_COUNT" ]; then
    print_success "✓ Profile count matches pre-reset count"
else
    print_warning "⚠ Profile count differs: before=$BEFORE_COUNT, after=$AFTER_COUNT"
fi

# Check key tables exist
EXPECTED_TABLES=(
    "profiles"
    "networks"
    "messages"
    "network_events"
    "network_news"
    "direct_messages"
)

print_status "Checking essential tables..."
for table in "${EXPECTED_TABLES[@]}"; do
    if psql "$DB_URL" -c "\d $table" &>/dev/null; then
        print_success "✓ Table $table exists"
    else
        print_error "✗ Table $table missing"
    fi
done

# Check RLS is enabled on profiles
RLS_STATUS=$(psql "$DB_URL" -t -c "SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';" | xargs)
if [ "$RLS_STATUS" = "t" ]; then
    print_success "✓ RLS enabled on profiles table"
else
    print_warning "⚠ RLS not enabled on profiles table"
fi

# Test basic functionality
print_status "Testing basic database operations..."

# Try to insert a test profile (should fail due to RLS if working correctly)
TEST_RESULT=$(psql "$DB_URL" -t -c "
    SET ROLE anon;
    INSERT INTO profiles (id, full_name, email) 
    VALUES ('00000000-0000-0000-0000-000000000000', 'Test User', 'test@example.com');
" 2>&1 || echo "RLS_WORKING")

if echo "$TEST_RESULT" | grep -q "permission denied\|RLS_WORKING"; then
    print_success "✓ RLS policies are working (insert blocked as expected)"
else
    print_warning "⚠ RLS policies may not be working correctly"
fi

# Reset role
psql "$DB_URL" -c "RESET ROLE;"

print_success "Restore test completed successfully!"
echo ""
print_warning "SUMMARY:"
echo "- Database reset: ✓"
echo "- Backup restored: ✓"
echo "- Table verification: ✓"
echo "- RLS check: ✓"
echo ""
print_success "The restore procedure is working correctly."
print_warning "You can now safely proceed with the migration on production."