"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getAgents, getRagConfigsByUserId } from "@/lib/lyzr-api";
import { ApiKeyInput } from "@/components/api-input";
import { AgentCard } from "@/components/agent-card";
import { CreateAgentModal } from "@/components/create-agent-modal";
import { RagCard } from "@/components/rag-card";
import { CreateRagModal } from "@/components/create-rag-modal";
import { Navigation } from "@/components/navigation";
import { authClient } from "@/lib/auth-client";
import { Plus, Bot, Brain, Sparkles } from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
}

interface Agent {
    _id: string;
    id?: string;
    name: string;
    description: string;
    agent_role: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

interface RagConfig {
    _id: string;
    id?: string;
    user_id: string;
    description?: string;
    collection_name: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export default function DashboardPage() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [ragConfigs, setRagConfigs] = useState<RagConfig[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [ragLoading, setRagLoading] = useState(false);
    const [agentsError, setAgentsError] = useState("");
    const [ragError, setRagError] = useState("");
    const [emptyResponse, setEmptyResponse] = useState(false);
    const [noAgents, setNoAgents] = useState(false);
    const [noRagConfigs, setNoRagConfigs] = useState(false);
    const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
    const [showCreateRagModal, setShowCreateRagModal] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedKey = typeof window !== "undefined" ? localStorage.getItem("lyzr-api-key") : null;
        if (storedKey) {
            setApiKey(storedKey);
        }

        // Check authentication and get user data
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const session = await authClient.getSession();
            if (session?.data?.user) {
                setUser(session.data.user);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
        }
    };

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
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch agents";
            setAgentsError(errorMessage);
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
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch RAG configurations";
            setRagError(errorMessage);
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

    const handleRagConfigDeleted = () => {
        // Simply refresh the list since we're now fetching from API
        handleRagDeleted();
    };

    return (
        <>
            <Navigation user={user} />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                {!apiKey ? (
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="w-full max-w-md">
                            <div className="text-center mb-8">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                                        <Sparkles className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    Welcome to Your Dashboard
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Enter your API key to get started with AI agents and knowledge bases
                                </p>
                            </div>
                            <ApiKeyInput onSetKey={setApiKey} />
                        </div>
                    </div>
                ) : (
                    <div className="px-4 py-8">
                        <div className="max-w-7xl mx-auto">
                            {/* Header Section */}
                            <div className="text-center mb-12">
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                    AI Dashboard
                                </h1>
                                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                    Manage your AI agents and knowledge bases
                                </p>
                            </div>

                            {/* Two-panel layout with improved spacing and design */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Agents Panel */}
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                        AI Agents
                                                    </h2>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => setShowCreateAgentModal(true)}
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm border-0 rounded-xl px-4 py-2 transition-all duration-200 transform hover:scale-105"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Agent
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {agentsError && (
                                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                                    <div className="text-red-600 dark:text-red-400 text-sm font-medium">
                                                        {agentsError}
                                                    </div>
                                                </div>
                                            )}

                                            {emptyResponse && (
                                                <div className="p-8 text-center">
                                                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                                                        API returned an empty response
                                                    </div>
                                                </div>
                                            )}

                                            {noAgents && !agentsLoading && (
                                                <div className="p-8 text-center">
                                                    <Bot className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                                                        No agents found. Create your first agent to get started.
                                                    </div>
                                                </div>
                                            )}

                                            {agentsLoading && (
                                                <div className="p-8 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                                                        Loading agents...
                                                    </div>
                                                </div>
                                            )}

                                            {agents.length > 0 && (
                                                <div className="space-y-3">
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
                                    </div>
                                </div>

                                {/* RAG Panel */}
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                    <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                        Knowledge Bases
                                                    </h2>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {ragConfigs.length} knowledge base{ragConfigs.length !== 1 ? 's' : ''} configured
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => setShowCreateRagModal(true)}
                                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm border-0 rounded-xl px-4 py-2 transition-all duration-200 transform hover:scale-105"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Knowledge Base
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {ragError && (
                                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                                    <div className="text-red-600 dark:text-red-400 text-sm font-medium">
                                                        {ragError}
                                                    </div>
                                                </div>
                                            )}

                                            {noRagConfigs && !ragLoading && (
                                                <div className="p-8 text-center">
                                                    <Brain className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                                                        No knowledge bases found. Create your first knowledge base to get started.
                                                    </div>
                                                </div>
                                            )}

                                            {ragLoading && (
                                                <div className="p-8 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                                                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                                                        Loading knowledge bases...
                                                    </div>
                                                </div>
                                            )}

                                            {ragConfigs.length > 0 && (
                                                <div className="space-y-3">
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
                    </div>
                )}
            </div>
        </>
    );
}
