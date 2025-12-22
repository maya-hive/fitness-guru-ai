import React from "react";

export default function MessageBubble({ role, content }) {
    return (
        <div className={`bubbleRow ${role}`}>
            <div className="bubble">
                {content}
            </div>
        </div>
    );
}
