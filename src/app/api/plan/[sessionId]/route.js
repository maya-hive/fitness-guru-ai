import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET(request, { params }) {
    try {
        const { sessionId } = params;
        const db = await getDB();

        const [rows] = await db.execute(
            "SELECT * FROM fitness_sessions WHERE session_id = ?",
            [sessionId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        const row = rows[0];

        // Safely parse equipment - handle both JSON strings and plain strings
        let equipment;
        try {
            equipment = JSON.parse(row.equipment);
        } catch {
            // If parsing fails, treat as plain string and wrap in array
            equipment = row.equipment ? [row.equipment] : [];
        }

        return NextResponse.json({
            sessionId: row.session_id,
            profile: {
                goal: row.goal,
                age: row.age,
                weight: row.weight,
                height: row.height,
                weeklyHours: row.weekly_hours,
                equipment: equipment
            },
            planText: row.plan_text,
            createdAt: row.created_at
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { message: "Failed to load plan", error: err.message },
            { status: 500 }
        );
    }
}

