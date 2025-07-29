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
            className="p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleClick}
        >
            <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-600">{agent.description}</p>
                    <div className="text-xs text-gray-500">
                        ID: {agent._id || agent.id}
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                        Click to view details
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                {apiKey && (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleChat}
                            className="text-green-600 hover:text-green-700"
                        >
                            Chat
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEdit}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDelete}
                            disabled={deleteLoading}
                            className="text-red-600 hover:text-red-700"
                        >
                            {deleteLoading ? "Deleting..." : "Delete"}
                        </Button>
                    </>
                )}
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
