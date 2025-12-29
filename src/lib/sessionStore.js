import { randomUUID } from "crypto";

const sessions = new Map();

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
    return str && UUID_REGEX.test(str);
}

/**
 * Session shape:
 * {
 *   id: string (UUID),
 *   data: { goal, age, weight, height, weeklyHours, equipment: [] },
 *   stage: string,
 *   history: [{ role, content }]
 * }
 */

export function getOrCreateSession(sessionId) {
    // If sessionId is provided and exists in memory, return it
    if (sessionId && sessions.has(sessionId)) return sessions.get(sessionId);

    // Validate sessionId - if provided but not a valid UUID, generate a new one
    // This handles old nanoid sessionIds from localStorage
    let id;
    if (sessionId && isValidUUID(sessionId)) {
        id = sessionId;
    } else {
        // Generate new UUID for invalid or missing sessionId
        id = randomUUID();
        if (sessionId) {
            console.warn(`⚠️  Invalid session ID format "${sessionId}". Generated new UUID: ${id}`);
        }
    }
    const session = {
        id,
        data: {
            goal: null,
            age: null,
            weight: null,
            height: null,
            weeklyHours: null,
            equipment: []
        },
        stage: "GOAL",
        history: []
    };

    sessions.set(id, session);
    return session;
}

export function saveSession(session) {
    sessions.set(session.id, session);
}

/** Optional: for dev reset */
export function clearAllSessions() {
    sessions.clear();
}

