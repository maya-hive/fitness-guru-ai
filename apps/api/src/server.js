import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";

import { getOrCreateSession, saveSession } from "./sessionStore.js";
import { applyUserInput, nextAssistantTurn, generatePlanWithLLM, saveSessionToDB } from "./flow.js";
import { db } from "./db.js";
import { sendPlanEmail } from "./email/sendEmail.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
        credentials: true
    })
);

const ChatSchema = z.object({
    sessionId: z.string().optional(),
    message: z.string().optional(),
    selection: z.any().optional()
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
    const parsed = ChatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

    const { sessionId, message, selection } = parsed.data;
    const session = getOrCreateSession(sessionId);

    // If first call (no user input yet), just return first question
    const hasUserInput = typeof message === "string" || selection !== undefined;

    if (hasUserInput) {
        const result = applyUserInput(session, { message, selection });

        if (!result.ok) {
            // Return the same stage question + error
            const turn = nextAssistantTurn(session);
            saveSession(session);
            return res.json({
                sessionId: session.id,
                stage: session.stage,
                error: result.error,
                assistant: { text: turn.text, ui: turn.ui }
            });
        }

        // If we just moved into PLAN stage, generate plan now
        if (session.stage === "PLAN") {
            try {
                const { planText } = await generatePlanWithLLM(session);

                // Save to DB
                await saveSessionToDB(session, planText);

                session.stage = "DONE";
                saveSession(session);
                return res.json({
                    sessionId: session.id,
                    stage: session.stage,
                    assistant: {
                        text: "Here’s your personalized fitness plan:",
                        ui: null
                    },
                    plan: { planText },
                    actions: [{ type: "share_email", label: "Share via Email" }]
                });
            } catch (e) {
                console.error(e);
                saveSession(session);
                return res.status(500).json({
                    sessionId: session.id,
                    stage: session.stage,
                    error: "Plan generation failed. Please try again."
                });
            }
        }

        // If we just moved into EMAIL_SENDING stage, send email now
        if (session.stage === "EMAIL_SENDING") {
            try {
                await sendPlanEmail({
                    to: session.data.shareEmail,
                    sessionId: session.id
                });

                session.stage = "DONE";
                saveSession(session);

                return res.json({
                    sessionId: session.id,
                    stage: session.stage,
                    assistant: {
                        text: "✅ Your fitness plan link has been sent successfully. Please check your inbox.",
                        ui: null
                    }
                });
            } catch (e) {
                console.error(e);
                saveSession(session);
                return res.status(500).json({
                    sessionId: session.id,
                    stage: session.stage,
                    error: "Failed to send email. Please try again.",
                    errorLog: e
                });
            }
        }
    }

    // Normal next question
    const turn = nextAssistantTurn(session);
    saveSession(session);

    return res.json({
        sessionId: session.id,
        stage: session.stage,
        assistant: { text: turn.text, ui: turn.ui }
    });
});

app.get("/api/plan/:sessionId", async (req, res) => {
    const { sessionId } = req.params;

    try {
        const [rows] = await db.execute(
            "SELECT * FROM fitness_sessions WHERE session_id = ?",
            [sessionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Plan not found" });
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

        res.json({
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
        res.status(500).json({ message: "Failed to load plan", error: err.message });
    }
});

app.post("/api/share/email", async (req, res) => {
    const { sessionId, email } = req.body;

    if (!sessionId || !email) {
        return res.status(400).json({ success: false, message: "Missing email or sessionId" });
    }

    try {
        await sendPlanEmail({ to: email, sessionId });
        res.json({ success: true, message: "Email sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to send email", error: err.message });
    }
});


const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
