const API_BASE = "http://localhost:3001";

export async function sendChat({ sessionId, message, selection }) {
    try {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, message, selection })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Request failed with status ${res.status}`);
        }

        return res.json();
    } catch (err) {
        if (err instanceof TypeError && err.message.includes("fetch")) {
            throw new Error("Unable to connect to server. Please check if the API is running.");
        }
        throw err;
    }
}
