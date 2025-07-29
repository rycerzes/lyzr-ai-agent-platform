"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAgents, getRagConfigsByUserId } from "@/lib/lyzr-api";
import { ApiKeyInput } from "@/components/api-input";
import { AgentCard } from "@/components/agent-card";
import { CreateAgentModal } from "@/components/create-agent-modal";
import { RagCard } from "@/components/rag-card";
import { CreateRagModal } from "@/components/create-rag-modal";
import { Navigation } from "@/components/navigation";


export default function DashboardPage() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [agents, setAgents] = useState<any[]>([]);
    const [ragConfigs, setRagConfigs] = useState<any[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [ragLoading, setRagLoading] = useState(false);
    const [agentsError, setAgentsError] = useState("");
    const [ragError, setRagError] = useState("");
    const [emptyResponse, setEmptyResponse] = useState(false);
    const [noAgents, setNoAgents] = useState(false);
    const [noRagConfigs, setNoRagConfigs] = useState(false);
    const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
    const [showCreateRagModal, setShowCreateRagModal] = useState(false);

    useEffect(() => {
        const storedKey = typeof window !== "undefined" ? localStorage.getItem("lyzr-api-key") : null;
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    useEffect(() => {
        if (apiKey) {
            handleFetchAgents(apiKey);
            handleFetchRagConfigs(apiKey);
        }
    }, [apiKey]);

    const handleFetchAgents = async (key: string) => {
        setAgentsLoading(true);
        setAgentsError("");
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
            setAgentsError(err.message || "Failed to fetch agents");
        } finally {
            setAgentsLoading(false);
        }
    };

    const handleFetchRagConfigs = async (key: string) => {
        setRagLoading(true);
        setRagError("");
        setRagConfigs([]);
        setNoRagConfigs(false);
        try {
            // Use the API key as the user ID
            const data = await getRagConfigsByUserId(key, key);

            if (data.configs && Array.isArray(data.configs)) {
                if (data.configs.length === 0) {
                    setNoRagConfigs(true);
                } else {
                    setRagConfigs(data.configs);
                }
            } else {
                setNoRagConfigs(true);
            }
        } catch (err: any) {
            setRagError(err.message || "Failed to fetch RAG configurations");
        } finally {
            setRagLoading(false);
        }
    }; const handleAgentCreated = () => {
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

    const handleRagCreated = () => {
        // Refresh the RAG configs list after creating a new config
        if (apiKey) {
            handleFetchRagConfigs(apiKey);
        }
    };

    const handleRagDeleted = () => {
        // Refresh the RAG configs list after deleting a config
        if (apiKey) {
            handleFetchRagConfigs(apiKey);
        }
    };

    const handleRagConfigDeleted = (deletedConfigId: string) => {
        // Simply refresh the list since we're now fetching from API
        handleRagDeleted();
    };

    return (
        <>
            <Navigation />
            <div className="flex flex-col min-h-screen p-4">
            {!apiKey ? (
                <div className="flex items-center justify-center min-h-screen">
                    <ApiKeyInput onSetKey={setApiKey} />
                </div>
            ) : (
                <div className="w-full max-w-7xl mx-auto">
                    {/* Two-panel layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Agents Panel */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold">Agents</h1>
                                <Button
                                    onClick={() => setShowCreateAgentModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    + Create Agent
                                </Button>
                            </div>

                            {agentsError && (
                                <Card className="p-6 text-center text-red-500">
                                    {agentsError}
                                </Card>
                            )}

                            {emptyResponse && (
                                <Card className="p-6 text-center text-gray-500">
                                    <div>API returned an empty response: &#123;&#125;</div>
                                </Card>
                            )}

                            {noAgents && !agentsLoading && (
                                <Card className="p-6 text-center text-gray-500">
                                    <div>No agents found.</div>
                                </Card>
                            )}

                            {agentsLoading && (
                                <Card className="p-6 text-center text-gray-500">
                                    <div>Loading agents...</div>
                                </Card>
                            )}

                            {agents.length > 0 && (
                                <div className="space-y-4">
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
                        </div>

                        {/* RAG Panel */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold">Knowledge Bases</h1>
                                <Button
                                    onClick={() => setShowCreateRagModal(true)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    + Create Knowledge Base
                                </Button>
                            </div>

                            {ragError && (
                                <Card className="p-6 text-center text-red-500">
                                    {ragError}
                                </Card>
                            )}

                            {noRagConfigs && !ragLoading && (
                                <Card className="p-6 text-center text-gray-500">
                                    <div>No knowledge bases found.</div>
                                </Card>
                            )}

                            {ragLoading && (
                                <Card className="p-6 text-center text-gray-500">
                                    <div>Loading knowledge bases...</div>
                                </Card>
                            )}

                            {ragConfigs.length > 0 && (
                                <div className="space-y-4">
                                    {ragConfigs.map(config => (
                                        <RagCard
                                            key={config._id || config.id}
                                            ragConfig={config}
                                            apiKey={apiKey}
                                            onRagDeleted={handleRagConfigDeleted}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modals */}
                    <CreateAgentModal
                        isOpen={showCreateAgentModal}
                        onClose={() => setShowCreateAgentModal(false)}
                        apiKey={apiKey}
                        onAgentCreated={handleAgentCreated}
                    />

                    <CreateRagModal
                        isOpen={showCreateRagModal}
                        onClose={() => setShowCreateRagModal(false)}
                        apiKey={apiKey}
                        onRagCreated={handleRagCreated}
                    />
                </div>
            )}
            </div>
        </>
    );
}
