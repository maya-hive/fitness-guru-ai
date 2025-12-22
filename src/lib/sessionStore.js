import { nanoid } from "nanoid";

const sessions = new Map();

/**
 * Session shape:
 * {
 *   id: string,
 *   data: { goal, age, weight, height, weeklyHours, equipment: [] },
 *   stage: string,
 *   history: [{ role, content }]
 * }
 */

export function getOrCreateSession(sessionId) {
    if (sessionId && sessions.has(sessionId)) return sessions.get(sessionId);

    const id = sessionId || nanoid();
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

