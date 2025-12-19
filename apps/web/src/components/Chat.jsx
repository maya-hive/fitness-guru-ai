import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { sendChat } from "@/api";
import OptionButtons from "./OptionButtons";
import PlanCard from "./PlanCard";
import TypingIndicator from "./TypingIndicator";
import ModeToggle from "./ModeToggle";

export default function Chat() {
    const [sessionId, setSessionId] = useState(
        () => localStorage.getItem("fitness_session") || ""
    );
    const [messages, setMessages] = useState([]);
    const [assistantUI, setAssistantUI] = useState(null);
    const [plan, setPlan] = useState(null);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Initial load
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await sendChat({ sessionId: sessionId || undefined });

                if (data.sessionId && !sessionId) {
                    setSessionId(data.sessionId);
                    localStorage.setItem("fitness_session", data.sessionId);
                }

                const newMessages = [];

                // Show error if present
                if (data.error) {
                    setError(data.error);
                    newMessages.push({ role: "error", text: data.error });
                }

                // Show assistant response
                if (data.assistant?.text) {
                    newMessages.push({ role: "assistant", text: data.assistant.text });
                }

                setMessages(newMessages);
                setAssistantUI(data.assistant?.ui || null);
            } catch (err) {
                setError(err.message || "Failed to initialize chat. Please try again.");
                setMessages([{ role: "error", text: err.message || "Failed to initialize chat. Please try again." }]);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, plan]);

    // Auto-focus input after response
    useEffect(() => {
        if (!loading && inputRef.current) {
            inputRef.current.focus();
        }
    }, [loading]);

    async function handleSendText(e) {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: userText }]);

        setLoading(true);
        setError(null);
        try {
            const data = await sendChat({ sessionId, message: userText });

            const newMessages = [];

            // Show error if present
            if (data.error) {
                setError(data.error);
                newMessages.push({ role: "error", text: data.error });
            }

            if (data.plan?.planText) {
                setPlan(data.plan.planText);
                setAssistantUI(null);
                if (data.assistant?.text) {
                    newMessages.push({ role: "assistant", text: data.assistant.text });
                }
                // Add plan as a message in the flow
                newMessages.push({ role: "plan", planText: data.plan.planText });
                setMessages(prev => [...prev, ...newMessages]);
                setLoading(false);
                return;
            }

            // Show assistant response
            if (data.assistant?.text) {
                newMessages.push({ role: "assistant", text: data.assistant.text });
            }

            setMessages(prev => [...prev, ...newMessages]);
            setAssistantUI(data.assistant?.ui || null);
        } catch (err) {
            const errorMessage = err.message || "Failed to send message. Please try again.";
            setError(errorMessage);
            setMessages(prev => [
                ...prev,
                { role: "error", text: errorMessage }
            ]);
        } finally {
            setLoading(false);
        }
    }

    async function handleOptionSelect(selection) {

        if (selection === "__SHARE_EMAIL__") {
            // Send to backend to transition to EMAIL_SHARE stage
            setLoading(true);
            setError(null);
            try {
                const data = await sendChat({ sessionId, selection: "__SHARE_EMAIL__" });

                if (data.assistant?.text) {
                    setMessages(prev => [
                        ...prev,
                        { role: "assistant", text: data.assistant.text }
                    ]);
                }
                setAssistantUI(data.assistant?.ui || null);
            } catch (err) {
                const errorMessage = err.message || "Failed to process request. Please try again.";
                setError(errorMessage);
                setMessages(prev => [
                    ...prev,
                    { role: "error", text: errorMessage }
                ]);
            } finally {
                setLoading(false);
            }
            return;
        }

        setMessages(prev => [
            ...prev,
            {
                role: "user",
                text: Array.isArray(selection) ? selection.join(", ") : selection
            }
        ]);

        setLoading(true);
        setError(null);

        try {
            const data = await sendChat({ sessionId, selection });

            const newMessages = [];

            // Show error if present
            if (data.error) {
                setError(data.error);
                newMessages.push({ role: "error", text: data.error });
            }

            if (data.plan?.planText) {
                setPlan(data.plan.planText);
                setAssistantUI(null);
                if (data.assistant?.text) {
                    newMessages.push({ role: "assistant", text: data.assistant.text });
                }
                // Add plan as a message in the flow
                newMessages.push({ role: "plan", planText: data.plan.planText });
                setMessages(prev => [...prev, ...newMessages]);
                setLoading(false);
                return;
            }

            // Show assistant response
            if (data.assistant?.text) {
                newMessages.push({ role: "assistant", text: data.assistant.text });
            }

            setMessages(prev => [...prev, ...newMessages]);
            setAssistantUI(data.assistant?.ui || null);
        } catch (err) {
            const errorMessage = err.message || "Failed to process selection. Please try again.";
            setError(errorMessage);
            setMessages(prev => [
                ...prev,
                { role: "error", text: errorMessage }
            ]);
        } finally {
            setLoading(false);
        }
    }

    function resetChat() {
        localStorage.removeItem("fitness_session");
        window.location.reload();
    }

    const bubbleMotion = {
        hidden: { opacity: 0, y: 10, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -6, scale: 0.98 }
    };

    const planLink = `${window.location.origin}/plan/${sessionId}`;

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-xl mt-8">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                    <CardTitle className="text-center">
                        <h1 className="font-extrabold tracking-tight text-balance my-px text-2xl">Quantum Fitness Guru</h1>
                        <h4 className="font-light text-balance mt-px text-sm">AI-Powered Personal Training Assistant</h4>
                    </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Button variant="secondary" onClick={resetChat} disabled={loading}>
                        Reset
                    </Button>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-4">
                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-4">
                        <AnimatePresence initial={false}>
                            {messages.map((m, i) => {
                                // Handle plan messages separately - center them
                                if (m.role === "plan") {
                                    return (
                                        <motion.div
                                            key={`plan-${i}`}
                                            variants={bubbleMotion}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            transition={{ duration: 0.18 }}
                                            className="flex justify-center"
                                        >
                                            <div className="w-full max-w-2xl">
                                                <PlanCard
                                                    planText={m.planText}
                                                    planLink={planLink}
                                                    onShareEmail={handleOptionSelect}
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                }

                                // Regular messages
                                return (
                                    <motion.div
                                        key={`${m.role}-${i}-${m.text?.slice(0, 10) || i}`}
                                        variants={bubbleMotion}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        transition={{ duration: 0.18 }}
                                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${m.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : m.role === "error"
                                                    ? "bg-red-200 text-destructive-foreground"
                                                    : "bg-muted"
                                                }`}
                                        >
                                            {m.text}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Typing indicator while loading */}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="max-w-[75%] rounded-xl px-4 py-2 bg-muted">
                                    <TypingIndicator />
                                </div>
                            </div>
                        )}

                        {/* Options (goal / equipment) */}
                        {assistantUI && !loading && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18 }}
                            >
                                <OptionButtons ui={assistantUI} onSelect={handleOptionSelect} />
                            </motion.div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                </ScrollArea>

                <Separator className="my-4" />

                <form onSubmit={handleSendText} className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        disabled={loading}
                    />
                    <Button type="submit" disabled={loading}>
                        Send
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={resetChat}
                        disabled={loading}
                    >
                        Reset
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
