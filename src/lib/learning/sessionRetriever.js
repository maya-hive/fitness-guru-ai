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

    return rows.map(r => ({
        goal: r.goal,
        weeklyHours: r.weekly_hours,
        equipment: JSON.parse(JSON.stringify(r.equipment)),
        planText: r.plan_text
    }));
}

