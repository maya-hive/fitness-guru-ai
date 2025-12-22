'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OptionButtons({ ui, onSelect }) {
    const isMulti = ui.type === "equipment_multiselect";
    const options = ui.options || [];
    const [selected, setSelected] = useState([]);

    function toggle(option) {
        setSelected(prev =>
            prev.includes(option)
                ? prev.filter(x => x !== option)
                : [...prev, option]
        );
    }

    return (
        <Card className="p-4 bg-muted/40">
            <div className="mb-3 text-sm text-muted-foreground">
                {isMulti ? "Select one or more options:" : "Select one option:"}
            </div>

            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <Button
                        key={opt}
                        variant={
                            isMulti && selected.includes(opt)
                                ? "default"
                                : "outline"
                        }
                        size="sm"
                        onClick={() =>
                            isMulti ? toggle(opt) : onSelect(opt)
                        }
                    >
                        {opt}
                    </Button>
                ))}
            </div>

            {isMulti && (
                <div className="mt-4 flex items-center gap-3">
                    <Button
                        onClick={() => onSelect(selected)}
                        disabled={selected.length === 0}
                    >
                        Confirm
                    </Button>

                    {selected.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {selected.map(s => (
                                <Badge key={s} variant="secondary">
                                    {s}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
