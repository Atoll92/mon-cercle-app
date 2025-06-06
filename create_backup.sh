#!/bin/bash

# Multiple Profiles Migration - Database Backup Script
# Run this script before executing the migration

set -e  # Exit on any error

echo "🗄️  Starting pre-migration database backup..."

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/${TIMESTAMP}_pre_multiprofile_migration"
PROJECT_REF=""  # Will be prompted if not set

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if project is linked
if [ ! -f .supabase/config.toml ]; then
    print_warning "Project not linked to Supabase. Please link your project."
    echo -n "Enter your Supabase project reference ID: "
    read PROJECT_REF
    supabase link --project-ref $PROJECT_REF
fi

# Create backup directory
print_status "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Create full database backup
print_status "Creating full database backup..."
supabase db dump --file "$BACKUP_DIR/backup_pre_multiprofile_migration_${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
    print_success "Full database backup created"
else
    print_error "Failed to create full database backup"
    exit 1
fi

# Create individual table backups for critical tables
print_status "Creating individual table backups..."

CRITICAL_TABLES=(
    "profiles"
    "messages" 
    "network_events"
    "network_news"
    "direct_messages"
    "portfolio_items"
    "moodboards"
    "moodboard_items"
    "network_polls"
    "network_poll_votes"
    "badges"
    "user_badges"
    "support_tickets"
    "media_uploads"
    "wiki_pages"
    "social_wall_comments"
)

for table in "${CRITICAL_TABLES[@]}"; do
    print_status "Backing up table: $table"
    supabase db dump --table "$table" --file "$BACKUP_DIR/backup_${table}_${TIMESTAMP}.sql"
    
    if [ $? -eq 0 ]; then
        print_success "✓ Table $table backed up"
    else
        print_warning "⚠ Failed to backup table $table (may not exist)"
    fi
done

# Create schema-only backup
print_status "Creating schema-only backup..."
supabase db dump --schema-only --file "$BACKUP_DIR/current_schema_pre_migration.sql"

# Get database connection info
print_status "Getting database connection info..."
DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')

if [ -n "$DB_URL" ]; then
    # Document current foreign key relationships
    print_status "Documenting foreign key relationships..."
    psql "$DB_URL" -c "
        SELECT conname, conrelid::regclass, confrelid::regclass, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE confrelid = 'profiles'::regclass;
    " > "$BACKUP_DIR/current_fk_relationships.txt"
    
    # Document current profiles table structure
    print_status "Documenting profiles table structure..."
    psql "$DB_URL" -c "\d+ profiles" > "$BACKUP_DIR/current_profiles_structure.txt"
    
    # Get table counts for verification
    print_status "Recording table counts for verification..."
    psql "$DB_URL" -c "
        SELECT schemaname, tablename, n_tup_ins as row_count
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
    " > "$BACKUP_DIR/table_counts_pre_migration.txt"
    
    print_success "Database documentation created"
else
    print_warning "Could not get database URL - skipping additional documentation"
fi

# Verify backup integrity
print_status "Verifying backup integrity..."

MAIN_BACKUP="$BACKUP_DIR/backup_pre_multiprofile_migration_${TIMESTAMP}.sql"

if [ -f "$MAIN_BACKUP" ]; then
    BACKUP_SIZE=$(ls -lh "$MAIN_BACKUP" | awk '{print $5}')
    LINE_COUNT=$(wc -l < "$MAIN_BACKUP")
    
    if [ "$LINE_COUNT" -gt 100 ]; then
        print_success "Backup verification passed - Size: $BACKUP_SIZE, Lines: $LINE_COUNT"
    else
        print_error "Backup verification failed - File too small: $LINE_COUNT lines"
        exit 1
    fi
else
    print_error "Main backup file not found!"
    exit 1
fi

# Create compressed archive
print_status "Creating compressed archive..."
cd "$BACKUP_DIR"
tar -czf "../multiprofile_migration_backup_${TIMESTAMP}.tar.gz" *.sql *.txt
cd - > /dev/null

if [ $? -eq 0 ]; then
    ARCHIVE_SIZE=$(ls -lh "backups/multiprofile_migration_backup_${TIMESTAMP}.tar.gz" | awk '{print $5}')
    print_success "Compressed archive created - Size: $ARCHIVE_SIZE"
else
    print_error "Failed to create compressed archive"
    exit 1
fi

# Generate backup summary
print_status "Generating backup summary..."
cat > "$BACKUP_DIR/BACKUP_SUMMARY.md" << EOF
# Pre-Migration Backup Summary

**Backup Created**: $(date)
**Migration**: Multiple Profiles Migration
**Backup Directory**: $BACKUP_DIR

## Backup Files

### Main Backup
- \`backup_pre_multiprofile_migration_${TIMESTAMP}.sql\` - Full database backup

### Individual Tables
$(for table in "${CRITICAL_TABLES[@]}"; do
    if [ -f "backup_${table}_${TIMESTAMP}.sql" ]; then
        echo "- \`backup_${table}_${TIMESTAMP}.sql\` - $table table backup"
    fi
done)

### Documentation
- \`current_schema_pre_migration.sql\` - Schema structure
- \`current_fk_relationships.txt\` - Foreign key relationships
- \`current_profiles_structure.txt\` - Profiles table details
- \`table_counts_pre_migration.txt\` - Row counts for verification

### Archive
- \`../multiprofile_migration_backup_${TIMESTAMP}.tar.gz\` - Compressed backup

## Restore Command

To restore this backup:

\`\`\`bash
# Full restore (DESTRUCTIVE)
supabase db reset --linked
psql "\$DB_URL" < backup_pre_multiprofile_migration_${TIMESTAMP}.sql
\`\`\`

## Verification

After restore, verify table counts match:
\`\`\`bash
cat table_counts_pre_migration.txt
\`\`\`

**⚠️  IMPORTANT**: Test restore procedure on development environment before production migration.
EOF

print_success "Backup summary created"

# Final summary
echo ""
echo "🎉 BACKUP COMPLETE!"
echo ""
print_success "Backup Location: $BACKUP_DIR"
print_success "Archive Location: backups/multiprofile_migration_backup_${TIMESTAMP}.tar.gz"
echo ""
print_warning "NEXT STEPS:"
echo "1. Verify all backup files are present"
echo "2. Test restore procedure on development environment"
echo "3. Store backup archive in multiple secure locations" 
echo "4. Proceed with migration using: big_multiprofile_migration.sql"
echo ""
print_warning "IMPORTANT: Keep backups for at least 30 days after successful migration"