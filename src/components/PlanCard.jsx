'use client';

import { ArrowUpRight } from 'lucide-react';
import Markdown from 'react-markdown';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PlanCard({ planText, planLink, onShareEmail }) {
    return (
        <Card className="mt-6 border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>📋 Your Personalized Plan</CardTitle>

                <div className="mt-4 flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() =>
                            onShareEmail("__SHARE_EMAIL__")
                        }
                    >
                        Share via Email
                    </Button>
                    <Button variant="outline" onClick={() => {
                        if (typeof window !== 'undefined') {
                            window.open(planLink, '_blank');
                        }
                    }}>
                        View Plan <ArrowUpRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-4">
                <ScrollArea className="h-[320px] pr-4">
                    <div className="text-sm whitespace-pre-wrap leading-relaxed text-balance markdown-content">
                        <Markdown>{planText}</Markdown>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
