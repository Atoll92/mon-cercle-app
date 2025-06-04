-- Create a function to get database statistics for super admin dashboard
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    db_stats jsonb;
    total_size bigint;
    tables_size jsonb;
    row_counts jsonb;
    index_info jsonb;
BEGIN
    -- Get total database size
    SELECT pg_database_size(current_database()) INTO total_size;
    
    -- Get individual table sizes
    SELECT jsonb_object_agg(
        tablename,
        pg_total_relation_size(schemaname||'.'||tablename)
    ) INTO tables_size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    
    -- Get row counts for major tables
    WITH table_counts AS (
        SELECT 
            'profiles' as table_name, 
            COUNT(*) as row_count 
        FROM profiles
        UNION ALL
        SELECT 'networks', COUNT(*) FROM networks
        UNION ALL
        SELECT 'network_news', COUNT(*) FROM network_news
        UNION ALL
        SELECT 'network_events', COUNT(*) FROM network_events
        UNION ALL
        SELECT 'messages', COUNT(*) FROM messages
        UNION ALL
        SELECT 'direct_messages', COUNT(*) FROM direct_messages
        UNION ALL
        SELECT 'network_files', COUNT(*) FROM network_files
        UNION ALL
        SELECT 'wiki_pages', COUNT(*) FROM wiki_pages
        UNION ALL
        SELECT 'moodboards', COUNT(*) FROM moodboards
        UNION ALL
        SELECT 'moodboard_items', COUNT(*) FROM moodboard_items
        UNION ALL
        SELECT 'portfolio_items', COUNT(*) FROM portfolio_items
        UNION ALL
        SELECT 'badges', COUNT(*) FROM badges
        UNION ALL
        SELECT 'user_badges', COUNT(*) FROM user_badges
        UNION ALL
        SELECT 'network_polls', COUNT(*) FROM network_polls
        UNION ALL
        SELECT 'support_tickets', COUNT(*) FROM support_tickets
    )
    SELECT jsonb_object_agg(table_name, row_count) INTO row_counts
    FROM table_counts;
    
    -- Get index information
    WITH index_stats AS (
        SELECT 
            COUNT(*) as total_indexes,
            SUM(pg_relation_size(indexrelid)) as total_index_size,
            COUNT(*) FILTER (WHERE indisunique) as unique_indexes,
            COUNT(*) FILTER (WHERE indisprimary) as primary_indexes
        FROM pg_stat_user_indexes
        JOIN pg_index ON pg_stat_user_indexes.indexrelid = pg_index.indexrelid
        WHERE schemaname = 'public'
    )
    SELECT jsonb_build_object(
        'total_indexes', total_indexes,
        'total_index_size', total_index_size,
        'unique_indexes', unique_indexes,
        'primary_indexes', primary_indexes
    ) INTO index_info
    FROM index_stats;
    
    -- Build final stats object
    db_stats := jsonb_build_object(
        'database_size', total_size,
        'database_size_formatted', pg_size_pretty(total_size),
        'table_sizes', tables_size,
        'row_counts', row_counts,
        'index_info', index_info,
        'version', version(),
        'uptime', EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())),
        'active_connections', (SELECT count(*) FROM pg_stat_activity),
        'cache_hit_ratio', (
            SELECT 
                CASE 
                    WHEN sum(blks_hit + blks_read) = 0 THEN 0
                    ELSE round(100.0 * sum(blks_hit) / sum(blks_hit + blks_read), 2)
                END
            FROM pg_stat_database 
            WHERE datname = current_database()
        )
    );
    
    RETURN db_stats;
END;
$$;

-- Grant execute permission to authenticated users (super admins will check their own permissions)
GRANT EXECUTE ON FUNCTION get_database_stats() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_database_stats() IS 'Returns comprehensive database statistics for super admin monitoring';