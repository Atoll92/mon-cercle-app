# Database Schema Validation Example with Zen MCP

This file demonstrates how to use Zen MCP for multi-model validation of database schema changes in the Conclav project.

## Scenario: Adding a New Table

Suppose we want to add a new table for "network_announcements". Let's validate this across multiple AI models.

### Proposed Schema Change

```sql
-- Add network announcements table
CREATE TABLE network_announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    network_id uuid NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    created_by uuid NOT NULL REFERENCES profiles(id),
    title varchar(255) NOT NULL,
    content text NOT NULL,
    announcement_type varchar(50) DEFAULT 'general',
    priority varchar(20) DEFAULT 'normal',
    is_pinned boolean DEFAULT false,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies
ALTER TABLE network_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Network members can view announcements" ON network_announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.network_id = network_announcements.network_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Network admins can manage announcements" ON network_announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.network_id = network_announcements.network_id 
            AND profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
```

### Multi-Model Validation Query

Use Zen to compare how different AI models would approach this schema change:

```
Compare approaches for adding a network_announcements table to a Supabase database with multi-profile architecture. 

Context:
- Database uses 1:many:many User:Profile:Network relationship
- profiles.user_id references auth.users.id 
- profiles.network_id references networks.id
- All content tables use profiles.id for creators
- RLS policies must use profiles.user_id = auth.uid() pattern

Evaluate:
1. Table structure and constraints
2. RLS policy implementation 
3. Foreign key relationships
4. Migration script safety
5. Performance considerations

Models: claude-3.5-sonnet, gpt-4, gemini-pro
```

This validation helps ensure:
- Consistent approach across different AI perspectives
- Identification of potential issues before implementation
- Best practices alignment with existing multi-profile architecture
- Performance and security considerations