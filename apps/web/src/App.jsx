import React from "react";
import { Routes, Route } from "react-router-dom";

import Chat from "@/components/Chat";
import ViewPlan from "@/pages/ViewPlan";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/plan/:sessionId" element={<ViewPlan />} />
        </Routes>
    );
}

/* export default function App() {
    return (
        <div className="appShell w-full max-w-4xl mx-auto shadow-xl pt-8">
            <main className="main">
                <Chat />
            </main>
        </div>
    );
} */
