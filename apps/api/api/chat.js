import { getOrCreateSession } from "../src/sessionStore.js";
import {
    applyUserInput,
    nextAssistantTurn,
    generatePlanWithLLM
} from "../src/flow.js";
import { saveSessionBlob } from "../src/blob/sessionStore.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).end();
    }

    const { sessionId, message, selection } = req.body;
    const session = getOrCreateSession(sessionId);

    if (message || selection) {
        const result = applyUserInput(session, { message, selection });

        if (!result.ok) {
            const turn = nextAssistantTurn(session);
            return res.json({
                sessionId: session.id,
                assistant: turn,
                error: result.error
            });
        }

        if (session.stage === "PLAN") {
            const { planText } = await generatePlanWithLLM(session);

            await saveSessionBlob(session.id, {
                sessionId: session.id,
                profile: session.data,
                planText,
                createdAt: new Date().toISOString()
            });

            session.stage = "DONE";

            return res.json({
                sessionId: session.id,
                assistant: {
                    text: "Here’s your personalized fitness plan:"
                },
                plan: { planText }
            });
        }
    }

    const turn = nextAssistantTurn(session);

    res.json({
        sessionId: session.id,
        assistant: turn
    });
}
