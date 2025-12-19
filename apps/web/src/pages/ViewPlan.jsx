import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function ViewPlan() {
    const { sessionId } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`/api/plan/${sessionId}`)
            .then(res => {
                if (!res.ok) throw new Error("Not found");
                return res.json();
            })
            .then(setData)
            .catch(() => setError("Plan not found"));
    }, [sessionId]);

    if (error) return <div className="p-10 text-center">{error}</div>;
    if (!data) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen flex justify-center items-start p-6">
            <Card className="max-w-4xl w-full">
                <CardHeader>
                    <CardTitle>📋 Your Saved Fitness Plan</CardTitle>
                    <div className="text-xs text-muted-foreground">
                        Session ID: {data.sessionId}
                    </div>
                </CardHeader>

                <CardContent>
                    <ScrollArea className="h-[70vh] pr-4">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {data.planText}
                        </div>
                    </ScrollArea>

                    <div className="mt-4 flex gap-2">
                        <Button variant="secondary" onClick={() => window.location.href = "/"}>
                            Back to Chat
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
