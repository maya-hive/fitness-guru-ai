import { EXERCISES } from "./exerciseLibrary.js";

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

export function daysFromWeeklyHours(hours) {
    // Simple mapping (adjust as you want)
    if (hours <= 1) return 1;
    if (hours <= 2) return 2;
    if (hours <= 4) return 3;
    if (hours <= 6) return 4;
    return 5;
}

export function goalToFocus(goal) {
    switch (goal) {
        case "Weight loss":
            return ["fat_loss", "general"];
        case "Muscle gain":
            return ["hypertrophy", "strength"];
        case "General fitness":
            return ["general", "strength", "endurance"];
        case "Endurance":
            return ["endurance"];
        case "Flexibility":
            return ["flexibility", "mobility", "recovery"];
        default:
            return ["general"];
    }
}

export function buildWeeklyPlan({ goal, weeklyHours, equipment }) {
    const days = daysFromWeeklyHours(weeklyHours);
    const focus = goalToFocus(goal);

    const available = EXERCISES.filter(ex =>
        ex.equipment.some(eq => equipment.includes(eq))
    );

    // Prefer exercises that match goal focus
    const scored = available
        .map(ex => ({
            ...ex,
            score: ex.focus.reduce((acc, f) => acc + (focus.includes(f) ? 2 : 0), 0)
        }))
        .sort((a, b) => b.score - a.score);

    // Build sessions
    const sessions = [];
    const sessionMinutes = clamp(Math.round((weeklyHours * 60) / days), 20, 75);

    for (let i = 0; i < days; i++) {
        const pick = scored.slice(i * 3, i * 3 + 6); // rotate selection
        sessions.push({
            day: i + 1,
            durationMinutes: sessionMinutes,
            warmup: "5–10 min dynamic warm-up",
            main: pick.slice(0, 4).map(x => x.name),
            finisher: focus.includes("fat_loss") || focus.includes("endurance")
                ? "5–10 min easy cardio cooldown"
                : "Core + stretch cooldown"
        });
    }

    return {
        meta: { days, sessionMinutes, focus },
        sessions
    };
}

