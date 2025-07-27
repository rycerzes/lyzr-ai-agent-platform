"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAgents } from "@/lib/lyzr-api";
import { ApiKeyInput } from "@/components/api-input";
import { AgentCard } from "@/components/agent-card";
import { CreateAgentModal } from "@/components/create-agent-modal";


export default function DashboardPage() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [emptyResponse, setEmptyResponse] = useState(false);
    const [noAgents, setNoAgents] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const storedKey = typeof window !== "undefined" ? localStorage.getItem("lyzr-api-key") : null;
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    useEffect(() => {
        if (apiKey) {
            handleFetchAgents(apiKey);
        }
    }, [apiKey]);

    const handleFetchAgents = async (key: string) => {
        setLoading(true);
        setError("");
        setAgents([]);
        setEmptyResponse(false);
        setNoAgents(false);
        try {
            const data = await getAgents(key);
            if (Array.isArray(data)) {
                if (data.length === 0) {
                    setNoAgents(true);
                } else {
                    setAgents(data);
                    // Store agents data in sessionStorage for detail pages
                    sessionStorage.setItem('lyzr-agents', JSON.stringify(data));
                }
            } else if (data && Object.keys(data).length === 0) {
                setEmptyResponse(true);
                setAgents([]);
            } else {
                const agentsArray = data.agents || [];
                setAgents(agentsArray);
                if (agentsArray.length > 0) {
                    sessionStorage.setItem('lyzr-agents', JSON.stringify(agentsArray));
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch agents");
        } finally {
            setLoading(false);
        }
    };

    const handleAgentCreated = () => {
        // Refresh the agents list after creating a new agent
        if (apiKey) {
            handleFetchAgents(apiKey);
        }
    };

    const handleAgentDeleted = () => {
        // Refresh the agents list after deleting an agent
        if (apiKey) {
            handleFetchAgents(apiKey);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            {!apiKey ? (
                <ApiKeyInput onSetKey={setApiKey} />
            ) : (
                <>
                    <div className="w-full max-w-md mb-4">
                        <Button 
                            onClick={() => setShowCreateModal(true)}
                            className="w-full"
                        >
                            + Create New Agent
                        </Button>
                    </div>
                    
                    {error && <Card className="w-full max-w-md p-6 text-center text-red-500 mb-4">{error}</Card>}
                    {emptyResponse && (
                        <Card className="w-full max-w-md p-6 text-center text-gray-500">
                            <div>API returned an empty response: &#123;&#125;</div>
                        </Card>
                    )}
                    {noAgents && (
                        <Card className="w-full max-w-md p-6 text-center text-gray-500">
                            <div>No agents found.</div>
                        </Card>
                    )}
                    {loading && (
                        <Card className="w-full max-w-md p-6 text-center text-gray-500 mb-4">
                            <div>Loading...</div>
                        </Card>
                    )}
                    {agents.length > 0 && (
                        <div className="w-full max-w-md space-y-4">
                            <h2 className="text-xl font-semibold text-center mb-4">Your Agents</h2>
                            {agents.map(agent => (
                                <AgentCard
                                    key={agent._id || agent.id}
                                    agent={agent}
                                    apiKey={apiKey}
                                    onAgentDeleted={handleAgentDeleted}
                                />
                            ))}
                        </div>
                    )}

                    <CreateAgentModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        apiKey={apiKey}
                        onAgentCreated={handleAgentCreated}
                    />
                </>
            )}
        </div>
    );
}
