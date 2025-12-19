import { put, get } from "@vercel/blob";

const BUCKET_PREFIX = "sessions";

function sessionKey(sessionId) {
    return `${BUCKET_PREFIX}/session_${sessionId}.json`;
}

/**
 * Save session + plan to Vercel Blob
 */
export async function saveSessionBlob(sessionId, payload) {
    const key = sessionKey(sessionId);

    await put(key, JSON.stringify(payload), {
        access: "public", // required for read later
        contentType: "application/json"
    });
}

/**
 * Load session from Vercel Blob
 */
export async function loadSessionBlob(sessionId) {
    try {
        const blob = await get(sessionKey(sessionId));
        const text = await blob.text();
        return JSON.parse(text);
    } catch {
        return null;
    }
}
