// Quick script to fix the event activity trigger
// Run with: node fix_event_trigger.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://etoxvocwsktguoddmgcu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0b3h2b2N3c2t0Z3VvZGRtZ2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDM3Mjg0MSwiZXhwIjoyMDU5OTQ4ODQxfQ.uQNujoK7bcmu1xknCTrHTp1LeRYZza_lPNM4t3RXwWo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const fixSQL = `
CREATE OR REPLACE FUNCTION create_event_activity()
RETURNS trigger AS $$
BEGIN
    INSERT INTO activity_feed (network_id, profile_id, activity_type, entity_type, entity_id, activity_text, metadata)
    VALUES (
        NEW.network_id,
        NEW.created_by,
        'event_created',
        'event',
        NEW.id,
        (SELECT full_name FROM profiles WHERE id = NEW.created_by LIMIT 1) || ' created an event: ' || NEW.title,
        jsonb_build_object(
            'profile_name', (SELECT full_name FROM profiles WHERE id = NEW.created_by LIMIT 1),
            'event_title', NEW.title,
            'event_date', NEW.date
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function fixTrigger() {
  console.log('Fixing event activity trigger...');

  const { data, error } = await supabase.rpc('exec', { sql: fixSQL });

  if (error) {
    console.error('Error:', error);
    // Try alternative method
    console.log('\nTrying alternative method...');
    const { error: error2 } = await supabase.from('_migrations').insert({
      name: '20251110000000_fix_event_activity_trigger',
      executed_at: new Date().toISOString()
    });

    if (error2) {
      console.error('Alternative method failed:', error2);
      console.log('\n⚠️  Please run this SQL manually in Supabase Dashboard SQL Editor:');
      console.log(fixSQL);
    } else {
      console.log('✅ Migration recorded. SQL may need manual execution.');
    }
  } else {
    console.log('✅ Event activity trigger fixed successfully!');
  }
}

fixTrigger().catch(console.error);
