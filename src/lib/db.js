import 'server-only';
import mysql from "mysql2/promise";

let db;
let sshTunnel = null;
let sshClient = null;
let dbInitialized = false;
let dbInitPromise = null;

/**
 * Initialize database connection with optional SSH tunneling
 */
async function initializeDB() {
    if (dbInitialized && db) {
        return db;
    }

    if (dbInitPromise) {
        return dbInitPromise;
    }

    dbInitPromise = (async () => {
        const useSSH = process.env.DB_USE_SSH === 'true';

        if (useSSH) {
            try {
                // Dynamically import SSH tunnel only on server side
                if (typeof window !== 'undefined') {
                    throw new Error('SSH tunneling is only available on the server side');
                }

                console.log('Establishing SSH tunnel to remote MySQL...');
                const { createSSHTunnel } = await import("./sshTunnel.js");
                const tunnelResult = await createSSHTunnel();
                sshTunnel = tunnelResult.tunnel;
                sshClient = tunnelResult.sshClient;

                // Use localhost since we're tunneling
                const dbConfig = {
                    host: '127.0.0.1',
                    port: tunnelResult.localPort,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME,
                    waitForConnections: true,
                    connectionLimit: 10,
                };

                db = mysql.createPool(dbConfig);
                console.log('✓ Database connection pool created via SSH tunnel');
            } catch (error) {
                console.error('Failed to establish SSH tunnel:', error);
                console.warn('⚠️  Continuing without database connection. App will work but data won\'t be persisted.');
                // Don't throw - allow app to continue without DB
                dbInitialized = true;
                return null;
            }
        } else {
            try {
                // Direct connection
                const dbConfig = {
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT || '3306'),
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME,
                    waitForConnections: true,
                    connectionLimit: 10,
                };

                db = mysql.createPool(dbConfig);
                console.log('✓ Database connection pool created (direct connection)');
            } catch (error) {
                console.error('Failed to create database connection:', error);
                console.warn('⚠️  Continuing without database connection. App will work but data won\'t be persisted.');
                // Don't throw - allow app to continue without DB
                dbInitialized = true;
                return null;
            }
        }

        dbInitialized = true;
        return db;
    })();

    return dbInitPromise;
}

// Initialize database connection (non-blocking)
initializeDB().catch(err => {
    console.error('Failed to initialize database connection:', err);
    // Don't throw - allow server to start even if DB connection fails
});

/**
 * Get database connection pool, ensuring it's initialized
 * Returns null if database is unavailable (SSH failed, connection failed, etc.)
 */
export async function getDB() {
    if (!dbInitialized) {
        await initializeDB();
    }
    return db || null;
}

// Export db directly for backward compatibility
// Note: This may be undefined until initialization completes
export { db };

/**
 * Initialize database tables - creates tables if they don't exist
 */
export async function initializeTables() {
    try {
        const db = await getDB();
        if (!db) {
            console.warn('⚠️  Database not available, skipping table initialization');
            return;
        }
        // Check if fitness_sessions table exists
        const [tables] = await db.execute(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'fitness_sessions'`,
            [process.env.DB_NAME]
        );

        // Create table if it doesn't exist
        if (tables.length === 0) {
            await db.execute(`
                CREATE TABLE fitness_sessions (
                    session_id VARCHAR(255) PRIMARY KEY,
                    goal VARCHAR(100),
                    age INT,
                    weight DECIMAL(5,2),
                    height DECIMAL(5,2),
                    weekly_hours DECIMAL(4,2),
                    equipment TEXT,
                    chat_history TEXT,
                    plan_text TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✓ Created fitness_sessions table');
        } else {
            console.log('✓ fitness_sessions table already exists');
        }
    } catch (error) {
        console.error('Error initializing database tables:', error);
        throw error;
    }
}

// Initialize tables on module load (non-blocking)
// Wait a bit for DB connection to be established
setTimeout(() => {
    initializeTables().catch(err => {
        console.error('Failed to initialize database tables:', err);
        // Don't throw - allow server to start even if table creation fails
        // The error will be caught when trying to use the table
    });
}, 1000);

