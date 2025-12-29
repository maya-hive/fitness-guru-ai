import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrCreateSession, saveSession } from "@/lib/sessionStore";
import { applyUserInput, nextAssistantTurn, generatePlanWithLLM, saveSessionToDB } from "@/lib/flow";
import { sendPlanEmail } from "@/lib/email/sendEmail";

const ChatSchema = z.object({
    sessionId: z.string().optional(),
    message: z.string().optional(),
    selection: z.any().optional()
});

export async function POST(request) {
    try {
        const body = await request.json();
        const parsed = ChatSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

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
                return NextResponse.json({
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

                    // Save to DB - don't fail the request if this fails
                    const savedToDB = await saveSessionToDB(session, planText);
                    if (savedToDB) {
                        console.log("Session saved to database successfully");
                    } else {
                        console.warn("Session not saved to database (DB unavailable or save failed)");
                    }

                    session.stage = "DONE";
                    saveSession(session);
                    return NextResponse.json({
                        sessionId: session.id,
                        stage: session.stage,
                        assistant: {
                            text: "Here's your personalized fitness plan:",
                            ui: null
                        },
                        plan: { planText, savedToDB },
                        actions: [{ type: "share_email", label: "Share via Email" }]
                    });
                } catch (e) {
                    console.error("Plan generation failed:", e);
                    saveSession(session);
                    return NextResponse.json({
                        sessionId: session.id,
                        stage: session.stage,
                        error: "Plan generation failed. Please try again."
                    }, { status: 500 });
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

                    return NextResponse.json({
                        sessionId: session.id,
                        stage: session.stage,
                        assistant: {
                            text: "✅ Your fitness plan link has been sent successfully. Please check your inbox.",
                            ui: null
                        }
                    });
                } catch (e) {
                    console.error(e);
                    session.stage = "DONE";
                    saveSession(session);
                    return NextResponse.json({
                        sessionId: session.id,
                        stage: session.stage,
                        error: "Failed to send email. Please try again.",
                        errorLog: e.message
                    }, { status: 500 });
                }
            }
        }

        // Normal next question
        const turn = nextAssistantTurn(session);
        saveSession(session);

        return NextResponse.json({
            sessionId: session.id,
            stage: session.stage,
            assistant: { text: turn.text, ui: turn.ui }
        });
    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

