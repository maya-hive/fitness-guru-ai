export const EQUIPMENT = [
    "Treadmills",
    "Spin bikes",
    "Dumbbells",
    "Resistance bands",
    "Ellipticals",
    "Home gym",
    "Kettlebells",
    "Yoga mats"
];

export const GOALS = [
    "Weight loss",
    "Muscle gain",
    "General fitness",
    "Endurance",
    "Flexibility"
];

/**
 * Very small starter library (expand later).
 * Each exercise includes: name, equipment tags, focus
 */
export const EXERCISES = [
    { name: "Treadmill brisk walk (incline)", equipment: ["Treadmills"], focus: ["fat_loss", "endurance"] },
    { name: "Treadmill intervals", equipment: ["Treadmills"], focus: ["fat_loss", "endurance"] },
    { name: "Spin bike steady ride", equipment: ["Spin bikes"], focus: ["endurance", "general"] },
    { name: "Spin bike HIIT sprints", equipment: ["Spin bikes"], focus: ["fat_loss", "endurance"] },

    { name: "Dumbbell goblet squat", equipment: ["Dumbbells"], focus: ["strength", "hypertrophy", "general"] },
    { name: "Dumbbell bench/floor press", equipment: ["Dumbbells"], focus: ["strength", "hypertrophy"] },
    { name: "Dumbbell one-arm row", equipment: ["Dumbbells"], focus: ["strength", "hypertrophy"] },
    { name: "Dumbbell shoulder press", equipment: ["Dumbbells"], focus: ["strength", "hypertrophy"] },

    { name: "Resistance band rows", equipment: ["Resistance bands"], focus: ["strength", "general"] },
    { name: "Resistance band glute bridges", equipment: ["Resistance bands"], focus: ["strength", "general"] },

    { name: "Kettlebell deadlift", equipment: ["Kettlebells"], focus: ["strength", "general"] },
    { name: "Kettlebell swings", equipment: ["Kettlebells"], focus: ["fat_loss", "endurance"] },

    { name: "Yoga mobility flow", equipment: ["Yoga mats"], focus: ["mobility", "flexibility", "recovery"] },
    { name: "Core: plank variations", equipment: ["Yoga mats"], focus: ["general", "strength"] },

    // Home gym = assumed cables/machine options
    { name: "Cable lat pulldown / assisted pull", equipment: ["Home gym"], focus: ["strength", "hypertrophy"] },
    { name: "Leg press (machine)", equipment: ["Home gym"], focus: ["strength", "hypertrophy"] },
    { name: "Chest press (machine)", equipment: ["Home gym"], focus: ["strength", "hypertrophy"] },

    { name: "Elliptical steady cardio", equipment: ["Ellipticals"], focus: ["fat_loss", "endurance"] }
];

