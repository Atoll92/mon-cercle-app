# Database Backup and Restore Guide

## Pre-Migration Database Backup

**CRITICAL**: Always create a complete backup before running the multiple profiles migration.

## 1. Create Full Database Backup

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (replace with your project reference)
supabase link --project-ref YOUR_PROJECT_REF

# Create a full backup
supabase db dump --file backup_pre_multiprofile_migration_$(date +%Y%m%d_%H%M%S).sql

# Also backup specific critical tables individually
supabase db dump --table profiles --file backup_profiles_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --table messages --file backup_messages_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --table network_events --file backup_events_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --table network_news --file backup_news_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --table direct_messages --file backup_direct_messages_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --table portfolio_items --file backup_portfolio_$(date +%Y%m%d_%H%M%S).sql
```

### Option B: Using pg_dump (Direct PostgreSQL)

```bash
# Get database URL from Supabase dashboard
# Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Create full backup
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --file backup_pre_multiprofile_migration_$(date +%Y%m%d_%H%M%S).sql \
  --verbose \
  --no-acl \
  --no-owner

# Create schema-only backup (for structure reference)
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --schema-only \
  --file backup_schema_only_$(date +%Y%m%d_%H%M%S).sql \
  --verbose \
  --no-acl \
  --no-owner

# Create data-only backup (for data reference)
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --data-only \
  --file backup_data_only_$(date +%Y%m%d_%H%M%S).sql \
  --verbose \
  --no-acl \
  --no-owner
```

## 2. Verify Backup Integrity

```bash
# Check backup file size (should be substantial, not empty)
ls -lah backup_*.sql

# Verify backup can be parsed (check for syntax errors)
head -50 backup_pre_multiprofile_migration_*.sql
tail -50 backup_pre_multiprofile_migration_*.sql

# Count critical tables in backup
grep -c "CREATE TABLE" backup_pre_multiprofile_migration_*.sql
grep -c "INSERT INTO" backup_pre_multiprofile_migration_*.sql
```

## 3. Store Backups Securely

```bash
# Create backup directory with timestamp
mkdir -p backups/$(date +%Y%m%d_%H%M%S)_pre_multiprofile_migration
mv backup_*.sql backups/$(date +%Y%m%d_%H%M%S)_pre_multiprofile_migration/

# Compress backups to save space
cd backups/$(date +%Y%m%d_%H%M%S)_pre_multiprofile_migration
tar -czf ../multiprofile_migration_backup_$(date +%Y%m%d_%H%M%S).tar.gz *.sql
cd ../..

# Store backup in multiple locations
# 1. Local storage (already done)
# 2. Cloud storage (AWS S3, Google Drive, etc.)
# 3. Different machine/server
```

## 4. Document Current Schema State

```bash
# Create a snapshot of current schema for reference
supabase db dump --schema-only --file current_schema_pre_migration.sql

# Document current RLS policies
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -c "\d+ profiles" > current_profiles_structure.txt

# Document foreign key relationships
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -c "SELECT conname, conrelid::regclass, confrelid::regclass, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE confrelid = 'profiles'::regclass;" > current_fk_relationships.txt
```

## RESTORE PROCEDURES

## Emergency Rollback (Full Restore)

### Option A: Using Supabase CLI

```bash
# WARNING: This will completely replace the current database
# Use only if migration completely fails

# 1. Reset the database (DESTRUCTIVE - removes all data)
supabase db reset --linked

# 2. Restore from backup
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  < backup_pre_multiprofile_migration_YYYYMMDD_HHMMSS.sql
```

### Option B: Using psql (More Control)

```bash
# 1. Connect to database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# 2. Drop all tables (BE VERY CAREFUL)
-- First, disable RLS to avoid permission issues
ALTER ROLE postgres BYPASSRLS;

-- Get list of tables to drop
SELECT 'DROP TABLE IF EXISTS ' || schemaname||'.'||tablename||' CASCADE;'
FROM pg_tables 
WHERE schemaname = 'public';

-- Execute the generated DROP statements
-- (Copy and paste each DROP TABLE statement)

# 3. Restore from backup
\i backup_pre_multiprofile_migration_YYYYMMDD_HHMMSS.sql

# 4. Re-enable RLS
ALTER ROLE postgres NOBYPASSRLS;
```

## Partial Rollback (Specific Tables)

If only certain aspects of the migration fail:

```bash
# Example: Restore only the profiles table
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

-- Drop the problematic profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Restore just the profiles table from backup
\i backup_profiles_YYYYMMDD_HHMMSS.sql

-- Manually restore foreign key relationships if needed
-- (Check current_fk_relationships.txt for original constraints)
```

## Recovery Verification Steps

After any restore operation:

```bash
# 1. Verify table counts match pre-migration
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -c "SELECT schemaname,tablename,n_tup_ins,n_tup_upd,n_tup_del 
      FROM pg_stat_user_tables 
      ORDER BY schemaname,tablename;"

# 2. Verify key relationships still work
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -c "SELECT COUNT(*) as profile_count FROM profiles;"

psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -c "SELECT COUNT(*) as message_count FROM messages;"

# 3. Test application functionality
# - Login/authentication
# - Profile access
# - Network operations
# - Message sending
# - File uploads

# 4. Check RLS policies are working
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -c "SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND rowsecurity = true;"
```

## Pre-Migration Checklist

Before running `big_multiprofile_migration.sql`:

- [ ] **Full database backup created** (`backup_pre_multiprofile_migration_*.sql`)
- [ ] **Individual table backups created** (profiles, messages, etc.)
- [ ] **Schema documentation created** (`current_schema_pre_migration.sql`)
- [ ] **Foreign key relationships documented** (`current_fk_relationships.txt`)
- [ ] **Backups verified and compressed**
- [ ] **Backups stored in multiple locations**
- [ ] **Database connection strings tested**
- [ ] **Rollback procedure tested on development environment**
- [ ] **Application downtime window scheduled**
- [ ] **Team notified of migration schedule**

## Migration Execution Protocol

1. **Announce maintenance window**
2. **Create fresh backup** (follow steps above)
3. **Test application functionality** (baseline)
4. **Run migration script** (`big_multiprofile_migration.sql`)
5. **Verify migration success** (check migration script verification functions)
6. **Test application functionality** (post-migration)
7. **If successful**: Document success and archive backups
8. **If failed**: Execute rollback procedure immediately

## Emergency Contacts

During migration, have these ready:
- Database administrator contact
- Application developer contact  
- Hosting provider support (Supabase)
- Backup storage access credentials

## Important Notes

- **NEVER run migration on production without testing on staging first**
- **Always announce maintenance windows to users**
- **Keep backup files for at least 30 days after successful migration**
- **Test rollback procedure on development environment before migration**
- **Have multiple team members available during migration window**

## File Locations

All backup files should be stored in:
```
backups/
├── YYYYMMDD_HHMMSS_pre_multiprofile_migration/
│   ├── backup_pre_multiprofile_migration_YYYYMMDD_HHMMSS.sql
│   ├── backup_profiles_YYYYMMDD_HHMMSS.sql
│   ├── backup_messages_YYYYMMDD_HHMMSS.sql
│   ├── current_schema_pre_migration.sql
│   └── current_fk_relationships.txt
└── multiprofile_migration_backup_YYYYMMDD_HHMMSS.tar.gz
```