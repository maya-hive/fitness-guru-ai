import { getDB } from "../db.js";

/**
 * Fetch similar past sessions for learning
 */
export async function getSimilarSessions({ goal, weeklyHours, equipment }) {
    const db = await getDB();
    const [rows] = await db.execute(
        `SELECT goal, weekly_hours, equipment, plan_text
    FROM fitness_sessions
    WHERE goal = ?
    ORDER BY ABS(weekly_hours - ?)
    LIMIT 3`,
        [goal, weeklyHours]
    );

    return rows.map(r => {
        // Parse equipment from JSON string stored in database
        let equipment = [];
        try {
            equipment = JSON.parse(r.equipment || '[]');
        } catch (e) {
            // If parsing fails, treat as empty array or single string
            equipment = r.equipment ? [r.equipment] : [];
        }
        // Ensure it's always an array
        if (!Array.isArray(equipment)) {
            equipment = equipment ? [equipment] : [];
        }

        return {
            goal: r.goal,
            weeklyHours: r.weekly_hours,
            equipment,
            planText: r.plan_text
        };
    });
}

