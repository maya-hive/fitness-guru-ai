import 'server-only';
import { createClient } from '@supabase/supabase-js';

let supabase = null;
let dbInitialized = false;
let dbInitPromise = null;

/**
 * Initialize Supabase client
 */
async function initializeDB() {
    if (dbInitialized && supabase) {
        return supabase;
    }

    if (dbInitPromise) {
        return dbInitPromise;
    }

    dbInitPromise = (async () => {
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                console.warn('⚠️  Supabase credentials not configured. App will work but data won\'t be persisted.');
                dbInitialized = true;
                return null;
            }

            // Use service role key for server-side operations (bypasses RLS)
            // If service role key is not available, fall back to anon key
            supabase = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });

            console.log('✓ Supabase client initialized');
            dbInitialized = true;
            return supabase;
        } catch (error) {
            console.error('Failed to initialize Supabase client:', error);
            console.warn('⚠️  Continuing without database connection. App will work but data won\'t be persisted.');
            dbInitialized = true;
            return null;
        }
    })();

    return dbInitPromise;
}

// Initialize database connection (non-blocking)
initializeDB().catch(err => {
    console.error('Failed to initialize database connection:', err);
    // Don't throw - allow server to start even if DB connection fails
});

/**
 * Get Supabase client, ensuring it's initialized
 * Returns null if database is unavailable
 */
export async function getDB() {
    if (!dbInitialized) {
        await initializeDB();
    }
    return supabase || null;
}

// Export supabase directly for backward compatibility
// Note: This may be undefined until initialization completes
export { supabase };

/**
 * Initialize database tables - creates tables if they don't exist
 * Note: In Supabase, tables should be created via SQL migrations or the Supabase dashboard
 * This function checks if the table exists and logs a warning if it doesn't
 */
export async function initializeTables() {
    try {
        const db = await getDB();
        if (!db) {
            console.warn('⚠️  Database not available, skipping table initialization');
            return;
        }

        // Check if fitness_sessions table exists by attempting a query
        const { error } = await db
            .from('fitness_sessions')
            .select('session_id')
            .limit(1);

        if (error && error.code === 'PGRST116') {
            // Table doesn't exist - log instructions
            console.warn('⚠️  fitness_sessions table does not exist. Please create it in Supabase.');
            console.log('Run this SQL in your Supabase SQL editor:');
            console.log(`
-- Table schema matches Supabase structure
-- session_id is UUID with default gen_random_uuid()
-- chat_history is JSONB for better JSON handling

CREATE TABLE IF NOT EXISTS fitness_sessions (
    session_id UUID NOT NULL DEFAULT gen_random_uuid(),
    goal VARCHAR(100),
    age INTEGER,
    weight NUMERIC(5,2),
    height NUMERIC(5,2),
    weekly_hours NUMERIC(4,2),
    equipment TEXT,
    chat_history JSONB,
    plan_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fitness_sessions_pkey PRIMARY KEY (session_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS update_fitness_sessions_updated_at ON fitness_sessions;

CREATE TRIGGER update_fitness_sessions_updated_at BEFORE UPDATE
ON fitness_sessions FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
            `);
        } else if (error) {
            console.error('Error checking fitness_sessions table:', error);
        } else {
            console.log('✓ fitness_sessions table exists');
        }
    } catch (error) {
        console.error('Error initializing database tables:', error);
        // Don't throw - allow server to start even if table check fails
    }
}

// Initialize tables on module load (non-blocking)
// Wait a bit for DB connection to be established
setTimeout(() => {
    initializeTables().catch(err => {
        console.error('Failed to initialize database tables:', err);
        // Don't throw - allow server to start even if table creation fails
    });
}, 1000);
