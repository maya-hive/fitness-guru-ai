import { motion } from "framer-motion";

export default function TypingIndicator() {
    const dot = {
        hidden: { opacity: 0.25, y: 0 },
        visible: i => ({
            opacity: 1,
            y: -2,
            transition: {
                delay: i * 0.15,
                duration: 0.35,
                repeat: Infinity,
                repeatType: "reverse"
            }
        })
    };

    return (
        <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Assistant is typing</div>
            <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                    <motion.span
                        key={i}
                        custom={i}
                        variants={dot}
                        initial="hidden"
                        animate="visible"
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground inline-block"
                    />
                ))}
            </div>
        </div>
    );
}
