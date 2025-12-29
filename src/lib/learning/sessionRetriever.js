import { getDB } from "../db.js";

/**
 * Fetch similar past sessions for learning
 * Returns empty array if database is unavailable
 */
export async function getSimilarSessions({ goal, weeklyHours, equipment }) {
    try {
        const db = await getDB();

        // If DB is not available, return empty array (no learning context)
        if (!db) {
            console.warn('⚠️  Database not available, skipping similar sessions retrieval');
            return [];
        }

        // Fetch sessions with matching goal
        const { data: rows, error } = await db
            .from('fitness_sessions')
            .select('goal, weekly_hours, equipment, plan_text')
            .eq('goal', goal)
            .order('weekly_hours', { ascending: true })
            .limit(10); // Fetch more to sort by difference

        if (error) {
            throw error;
        }

        if (!rows || rows.length === 0) {
            return [];
        }

        // Sort by absolute difference in weekly_hours and take top 3
        const sorted = rows
            .map(r => ({
                ...r,
                diff: Math.abs((r.weekly_hours || 0) - weeklyHours)
            }))
            .sort((a, b) => a.diff - b.diff)
            .slice(0, 3);

        return sorted.map(r => {
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
    } catch (error) {
        console.error('Failed to fetch similar sessions:', error);
        console.warn('⚠️  Continuing without learning context');
        return [];
    }
}

