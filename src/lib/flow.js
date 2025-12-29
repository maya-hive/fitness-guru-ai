import { z } from "zod";

import { GOALS, EQUIPMENT } from "./plan/exerciseLibrary.js";
import { buildWeeklyPlan } from "./plan/planner.js";
import { getOpenAI } from "./openaiClient.js";
import { systemDeveloperPrompt, planRenderUserPrompt, learningContextPrompt } from "./plan/renderPrompt.js";
import { getDB } from "./db.js";
import { getSimilarSessions } from "./learning/sessionRetriever.js";

const AgeSchema = z.number().int().min(10).max(90);
const WeightSchema = z.number().min(25).max(350);
const HeightSchema = z.number().min(120).max(230);
const HoursSchema = z.number().min(0.5).max(20);

function asNumberLoose(input) {
    const n = typeof input === "number" ? input : Number(String(input).trim());
    return Number.isFinite(n) ? n : null;
}

export function getGoalOptions() {
    return GOALS;
}
export function getEquipmentOptions() {
    return EQUIPMENT;
}

export function nextAssistantTurn(session) {
    const { stage, data } = session;

    if (stage === "GOAL") {
        return {
            text: "Select your primary fitness goal:",
            ui: { type: "goal_buttons", options: getGoalOptions() }
        };
    }

    if (stage === "AGE") return { text: "What is your age (years)?", ui: null };
    if (stage === "WEIGHT") return { text: "What is your weight (kg)?", ui: null };
    if (stage === "HEIGHT") return { text: "What is your height (cm)?", ui: null };
    if (stage === "HOURS") return { text: "How many hours per week can you dedicate to workouts? (0.5–20)", ui: null };

    if (stage === "EQUIPMENT") {
        return {
            text: "Which equipment do you have access to? (You can select multiple.)",
            ui: { type: "equipment_multiselect", options: getEquipmentOptions() }
        };
    }

    if (stage === "PLAN") {
        return { text: "Generating your plan now…", ui: null };
    }

    if (stage === "EMAIL_SHARE") {
        return { text: "Please enter the email address where you'd like to receive your plan link.", ui: null };
    }

    return { text: "Let's start again. Select your primary fitness goal:", ui: { type: "goal_buttons", options: getGoalOptions() } };
}

export function applyUserInput(session, payload) {
    const { stage } = session;
    const { message, selection } = payload;

    // Selection can come from buttons; message from free-typed input.
    if (stage === "GOAL") {
        const chosen = selection || message;
        if (GOALS.includes(chosen)) {
            session.data.goal = chosen;
            session.stage = "AGE";
            return { ok: true };
        }
        return { ok: false, error: "Please select one of the provided goals." };
    }

    if (stage === "AGE") {
        const n = asNumberLoose(message);
        const parsed = AgeSchema.safeParse(n);
        if (parsed.success) {
            session.data.age = parsed.data;
            session.stage = "WEIGHT";
            return { ok: true };
        }
        return { ok: false, error: "Please enter a valid age (10–90)." };
    }

    if (stage === "WEIGHT") {
        const n = asNumberLoose(message);
        const parsed = WeightSchema.safeParse(n);
        if (parsed.success) {
            session.data.weight = parsed.data;
            session.stage = "HEIGHT";
            return { ok: true };
        }
        return { ok: false, error: "Please enter a valid weight in kg (25–350)." };
    }

    if (stage === "HEIGHT") {
        const n = asNumberLoose(message);
        const parsed = HeightSchema.safeParse(n);
        if (parsed.success) {
            session.data.height = parsed.data;
            session.stage = "HOURS";
            return { ok: true };
        }
        return { ok: false, error: "Please enter a valid height in cm (120–230)." };
    }

    if (stage === "HOURS") {
        const n = asNumberLoose(message);
        const parsed = HoursSchema.safeParse(n);
        if (parsed.success) {
            session.data.weeklyHours = parsed.data;
            session.stage = "EQUIPMENT";
            return { ok: true };
        }
        return { ok: false, error: "Please enter weekly hours (0.5–20)." };
    }

    if (stage === "EQUIPMENT") {
        // For multiselect, expect selection as array OR comma-separated message
        const list = Array.isArray(selection)
            ? selection
            : String(message || "")
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);

        const valid = list.filter(x => EQUIPMENT.includes(x));
        if (valid.length === 0) {
            return { ok: false, error: "Please select at least one equipment option." };
        }
        session.data.equipment = [...new Set(valid)];
        session.stage = "PLAN";
        return { ok: true };
    }

    // Handle email share trigger from DONE stage
    if (stage === "DONE" && (selection === "__SHARE_EMAIL__" || message === "__SHARE_EMAIL__")) {
        session.stage = "EMAIL_SHARE";
        return { ok: true };
    }

    if (stage === "EMAIL_SHARE") {
        const email = message?.trim();

        if (!email) {
            return { ok: false, error: "Please enter an email address." };
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { ok: false, error: "Please enter a valid email address." };
        }

        session.data.shareEmail = email;
        session.stage = "EMAIL_SENDING";
        return { ok: true };
    }

    return { ok: false, error: "Invalid state." };
}

export async function generatePlanWithLLM(session) {
    const profile = session.data;
    const computedPlan = buildWeeklyPlan(profile);

    const similarSessions = await getSimilarSessions(profile);
    const learningContext = learningContextPrompt(similarSessions);

    const client = getOpenAI();
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Structured Output: return a JSON object with a single "planText" string
    const response = await client.responses.create({
        model,
        input: [
            { role: "system", content: systemDeveloperPrompt() },
            { role: "system", content: learningContext }, // LEARNING CONTEXT
            { role: "user", content: planRenderUserPrompt({ profile, computedPlan }) }
        ],
        text: {
            format: {
                type: "json_schema",
                name: "FitnessPlan",
                schema: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        planText: { type: "string" }
                    },
                    required: ["planText"]
                }
            }
        }
    });

    // The SDK provides output_text for plain text, but we requested JSON schema.
    // The JSON is typically in response.output[0].content[0].text; safest is to parse output_text too.
    const raw = response.output_text;
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        // fallback: treat as text
        parsed = { planText: raw };
    }

    return { planText: parsed.planText, computedPlan };
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
    return UUID_REGEX.test(str);
}

export async function saveSessionToDB(session, planText) {
    const { data, history, id } = session;

    try {
        const db = await getDB();

        // If DB is not available, just log and return false
        if (!db) {
            console.warn('⚠️  Database not available, skipping session save. Session ID:', id);
            return false;
        }

        // Validate and convert session ID to UUID if needed
        let sessionId = id;
        if (!isValidUUID(sessionId)) {
            // If session ID is not a valid UUID (e.g., old nanoid), generate a new UUID
            const { randomUUID } = await import('crypto');
            sessionId = randomUUID();
            // Update the session with the new UUID
            session.id = sessionId;
            console.warn(`⚠️  Session ID "${id}" is not a valid UUID. Generated new UUID: ${sessionId}`);
        }

        const sessionData = {
            session_id: sessionId,
            goal: data.goal,
            age: data.age,
            weight: data.weight,
            height: data.height,
            weekly_hours: data.weeklyHours,
            equipment: JSON.stringify(data.equipment),
            chat_history: history, // JSONB column - pass as object, Supabase will handle conversion
            plan_text: planText
        };

        // Use upsert to handle both insert and update
        const { error } = await db
            .from('fitness_sessions')
            .upsert(sessionData, {
                onConflict: 'session_id',
                ignoreDuplicates: false
            });

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error('Failed to save session to database:', {
            sessionId: id,
            error: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
            stack: error.stack,
            data: {
                goal: data.goal,
                age: data.age,
                weight: data.weight,
                height: data.height,
                weeklyHours: data.weeklyHours,
                equipmentCount: Array.isArray(data.equipment) ? data.equipment.length : 0,
                historyLength: Array.isArray(history) ? history.length : 0,
                planTextLength: planText?.length || 0
            }
        });
        // Don't throw - allow app to continue even if DB save fails
        console.warn('⚠️  Continuing without saving to database');
        return false;
    }
}

