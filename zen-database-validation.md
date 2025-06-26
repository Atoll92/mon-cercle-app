# Zen MCP Database Validation Guide

## Quick Start: Using Zen for Database Schema Validation

The Zen MCP server enables multi-model validation of database changes. Here's how to integrate it with your database development workflow.

### Setup

Zen MCP is already configured in your project via `claude mcp add zen`. It provides tools to query multiple AI models simultaneously for comprehensive validation.

### Basic Usage Pattern

When proposing database schema changes, use this workflow:

```bash
# 1. First, always read the complete database documentation
cat ./database.md

# 2. Check latest migrations for current schema state  
ls -la supabase/migrations/ | tail -5

# 3. Use Zen MCP to validate your proposed changes
# (This queries multiple models: Claude, GPT-4, Gemini)
```

### Example: Validating a New Table Addition

**Scenario**: Adding a `network_announcements` table

**Zen Query Template**:
```
Validate this database schema addition for a Supabase multi-profile system:

CONTEXT:
- 1:many:many User:Profile:Network relationship
- profiles.user_id → auth.users.id
- profiles.network_id → networks.id (immutable)
- RLS policies use profiles.user_id = auth.uid() pattern

PROPOSED CHANGE:
```sql
CREATE TABLE network_announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    created_by uuid NOT NULL REFERENCES profiles(id),
    title varchar(255) NOT NULL,
    content text NOT NULL,
    priority varchar(20) DEFAULT 'normal',
    is_pinned boolean DEFAULT false,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE network_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Network members can view announcements" ON network_announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.network_id = network_announcements.network_id 
            AND profiles.user_id = auth.uid()
        )
    );
```

VALIDATION CRITERIA:
1. Multi-profile architecture compatibility
2. RLS policy correctness
3. Foreign key relationships
4. Performance implications
5. Security considerations

Compare approaches across models: Claude, GPT-4, Gemini
```

### Expected Multi-Model Benefits

- **Claude**: Focus on architectural integrity and RLS security patterns
- **GPT-4**: Emphasis on performance optimization and scalability
- **Gemini**: Systems architecture and operational considerations

### Integration with CLAUDE.md

The database validation protocol in CLAUDE.md now enforces:

1. **Mandatory Documentation Review**: Must read `./database.md` before any schema changes
2. **Multi-Model Validation**: Use Zen MCP for cross-model verification  
3. **Multi-Profile Compliance**: Ensure all changes support the complex relationship system
4. **Migration Safety**: Validate scripts for RLS and foreign key integrity

### Validation Checklist

Before implementing any database changes:

- [ ] Read complete database documentation (`./database.md`)
- [ ] Review latest migration files for current state
- [ ] Use Zen MCP to validate with multiple models
- [ ] Verify RLS policies follow `profiles.user_id = auth.uid()` pattern
- [ ] Check foreign key relationships and cascade behaviors
- [ ] Ensure indexes support query patterns
- [ ] Test migration script in development environment

### Benefits

This multi-model validation approach provides:

- **Risk Reduction**: Multiple AI perspectives catch potential issues
- **Best Practices**: Ensures adherence to established patterns
- **Documentation**: Creates audit trail of validation decisions  
- **Quality Assurance**: Comprehensive review before implementation
- **Learning**: Exposes different architectural approaches

### Next Steps

1. Test this workflow with a simple schema addition
2. Integrate validation results into your migration planning
3. Use multi-model insights to improve database design decisions
4. Document validation outcomes for future reference

This systematic approach protects the complex multi-profile architecture while enabling confident database evolution.