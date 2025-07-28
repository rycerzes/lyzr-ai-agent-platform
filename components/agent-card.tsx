"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteAgent } from "@/lib/lyzr-api";
import { ChatModal } from "@/components/chat-modal";

interface Agent {
    _id?: string;
    id?: string;
    name: string;
    description: string;
}

interface AgentCardProps {
    agent: Agent;
    apiKey?: string;
    onAgentDeleted?: () => void;
}

export function AgentCard({ agent, apiKey, onAgentDeleted }: AgentCardProps) {
    const router = useRouter();
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);

    const handleClick = () => {
        const agentId = agent._id || agent.id;
        if (agentId) {
            router.push(`/dashboard/${agentId}`);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        const agentId = agent._id || agent.id;
        if (agentId) {
            router.push(`/dashboard/${agentId}`);
        }
    };

    const handleChat = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (apiKey) {
            setShowChatModal(true);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!apiKey) {
            alert("API key not found");
            return;
        }
        
        const confirmDelete = window.confirm(`Are you sure you want to delete agent "${agent.name}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        const agentId = agent._id || agent.id;
        
        if (!agentId) {
            alert("Agent ID not found");
            return;
        }

        setDeleteLoading(true);

        try {
            await deleteAgent(apiKey, agentId);
            if (onAgentDeleted) {
                onAgentDeleted();
            }
        } catch (err: any) {
            alert(err.message || "Failed to delete agent");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <Card 
            className="w-full max-w-md p-6 mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={handleClick}
        >
            <div className="space-y-3">
                <div className="font-medium text-lg">{agent.name}</div>
                <div className="text-sm text-gray-600">{agent.description}</div>
                <div className="text-xs text-gray-400 border-t pt-2">
                    ID: {agent._id || agent.id}
                </div>
                <div className="flex justify-between items-center mt-3">
                    <div className="text-xs text-blue-500 hover:text-blue-700">
                        Click to view details →
                    </div>
                    {apiKey && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleChat}
                                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                                💬 Chat
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleEdit}
                                className="text-xs"
                            >
                                ✏️ Edit
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="text-xs"
                            >
                                {deleteLoading ? "..." : "🗑️"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Modal */}
            {apiKey && (
                <ChatModal
                    isOpen={showChatModal}
                    onClose={() => setShowChatModal(false)}
                    agent={agent}
                    apiKey={apiKey}
                />
            )}
        </Card>
    );
}
