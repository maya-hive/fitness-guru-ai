import { loadSessionBlob } from "../../src/blob/sessionStore.js";

export default async function handler(req, res) {
    const { sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ error: "Missing sessionId" });
    }

    const session = await loadSessionBlob(sessionId);

    if (!session) {
        return res.status(404).json({ error: "Plan not found" });
    }

    res.status(200).json(session);
}
