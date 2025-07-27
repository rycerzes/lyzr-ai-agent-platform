"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ApiKeyInputProps {
    onSetKey: (key: string) => void;
}

export function ApiKeyInput({ onSetKey }: ApiKeyInputProps) {
    const [input, setInput] = useState("");
    const [localError, setLocalError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) {
            setLocalError("API key is required");
            return;
        }
        localStorage.setItem("lyzr-api-key", input.trim());
        onSetKey(input.trim());
    };

    return (
        <Card className="w-full max-w-md p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">Lyzr Agents Dashboard</h1>
            <form onSubmit={handleSubmit}>
                <Input
                    placeholder="Enter your API key"
                    value={input}
                    onChange={e => { setInput(e.target.value); setLocalError(""); }}
                    className="mb-4"
                />
                <Button type="submit" className="w-full mb-2">
                    Submit
                </Button>
                {localError && <div className="text-red-500 text-sm mt-2">{localError}</div>}
            </form>
        </Card>
    );
}