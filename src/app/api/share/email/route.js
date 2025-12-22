import { NextResponse } from "next/server";
import { sendPlanEmail } from "@/lib/email/sendEmail";

export async function POST(request) {
    try {
        const body = await request.json();
        const { sessionId, email } = body;

        if (!sessionId || !email) {
            return NextResponse.json(
                { success: false, message: "Missing email or sessionId" },
                { status: 400 }
            );
        }

        await sendPlanEmail({ to: email, sessionId });
        return NextResponse.json({ success: true, message: "Email sent successfully" });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { success: false, message: "Failed to send email", error: err.message },
            { status: 500 }
        );
    }
}

