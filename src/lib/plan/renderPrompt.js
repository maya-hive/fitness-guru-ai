export function systemDeveloperPrompt() {
  return `
  You are an AI-Powered Personal Training Assistant designed to create personalized fitness plans through a chat-based conversational flow.
  
  Rules:
  - Ask only ONE question per turn.
  - Follow the mandatory steps in order: Goal -> Age -> Weight -> Height -> Weekly hours -> Equipment -> Generate plan.
  - Do not diagnose medical conditions.
  - Keep outputs clear, structured, and safe.
  
  When generating the final plan:
  - Use the provided computed schedule JSON as the source of truth.
  - Present the plan in a clean, email-ready layout.
  - Include: Profile, Weekly schedule, Training guidelines, Nutrition tips, Recovery & rest.
  `.trim();
}

export function planRenderUserPrompt({ profile, computedPlan }) {
  return `
  Create a personalized fitness plan using this user profile and computed schedule.
  
  USER PROFILE:
  - Goal: ${profile.goal}
  - Age: ${profile.age}
  - Weight: ${profile.weight} kg
  - Height: ${profile.height} cm
  - Weekly time: ${profile.weeklyHours} hours
  - Equipment: ${profile.equipment.join(", ")}
  
  COMPUTED SCHEDULE JSON (do not contradict it):
  ${JSON.stringify(computedPlan, null, 2)}
  
  Output must be in the style:
  ## 🎯 YOUR PROFILE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ...
  ## 📋 X-DAY WEEKLY SCHEDULE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ### Day 1: ...
  ...
  
  IMPORTANT: For the WEEKLY SCHEDULE section, format each day as a flat list (not nested):
  ### Day 1:
  - **Duration:** X minutes
  - **Warm-up:** [warm-up description]
  - **Main Workout:**
    - [exercise 1]
    - [exercise 2]
  - **Finisher:** [finisher description]
  
  Note: Duration, Warm-up, Main Workout, and Finisher must all be at the same indentation level (single dash). Only the exercises within Main Workout should be nested (double dash).
  
  ## 💡 TRAINING GUIDELINES
  ## 🍎 NUTRITION TIPS
  ## 😴 RECOVERY & REST
  
  Add a short safety note: "If you have injuries or medical conditions, consult a professional."
  `.trim();
}

export function learningContextPrompt(similarSessions) {
  if (!similarSessions.length) return "";

  return `
  REFERENCE PLANS FROM PAST USERS (for style & structure guidance only):

  ${similarSessions
      .map(
        (s, i) => `
  Example ${i + 1}:
  Goal: ${s.goal}
  Weekly Hours: ${s.weeklyHours}
  Equipment: ${s.equipment.join(", ")}

  Plan Summary:
  ${s.planText.substring(0, 600)}
  `
      )
      .join("\n")}

  Rules:
  - Do NOT copy text verbatim
  - Use these examples to improve clarity, balance, and structure
  `.trim();
}

