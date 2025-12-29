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

        const result = await sendPlanEmail({ to: email, sessionId });
        
        if (result.success) {
            return NextResponse.json({ success: true, message: "Email sent successfully" });
        } else {
            // Email sending failed but flow continues - return success with warning
            console.warn(`[email route] Email sending failed but continuing: ${result.error}`);
            return NextResponse.json({ 
                success: true, 
                message: "Request processed successfully, but email could not be sent",
                emailSent: false,
                emailError: result.error
            });
        }
    } catch (err) {
        console.error('[email route] Unexpected error:', err);
        // Even on unexpected errors, don't break the flow
        return NextResponse.json(
            { 
                success: true, 
                message: "Request processed, but email service encountered an error",
                emailSent: false,
                error: err.message 
            },
            { status: 200 }
        );
    }
}

