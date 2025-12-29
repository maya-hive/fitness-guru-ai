import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET(request, { params }) {
    try {
        const { sessionId } = await params;
        const db = await getDB();


        if (!db) {
            return NextResponse.json(
                { error: "Database not available. Plan cannot be retrieved." },
                { status: 503 }
            );
        }

        const { data: rows, error } = await db
            .from('fitness_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .limit(1);

        if (error) {
            throw error;
        }

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        const row = rows[0];

        // Safely parse equipment - handle both JSON strings and plain strings
        let equipment;
        try {
            equipment = typeof row.equipment === 'string'
                ? JSON.parse(row.equipment)
                : row.equipment;
        } catch {
            // If parsing fails, treat as plain string and wrap in array
            equipment = row.equipment ? [row.equipment] : [];
        }

        // chat_history is JSONB, so it should already be an object/array
        const chatHistory = row.chat_history || [];

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
            chatHistory: chatHistory,
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

