"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAgentById, updateAgent, deleteAgent, updateSingleTaskAgent, getAgentVersions, getRagConfigsByUserId } from "@/lib/lyzr-api";
import { ArrowLeft, Edit, Save, X, Trash2, History, Plus, Bot, Settings, Brain, Clock, Database, Zap } from "lucide-react";

interface Agent {
    _id: string;
    api_key: string;
    name: string;
    description: string;
    agent_role: string;
    agent_instructions: string;
    agent_goal: string;
    agent_context: string | null;
    agent_output: string | null;
    examples: string | null;
    features?: Array<{
        type: string;
        config?: any;
        priority?: number;
    }> | null;
    tools?: string[] | null;
    tool_usage_description: string;
    response_format?: {
        type: string;
    } | null;
    provider_id: string;
    model: string;
    top_p: number;
    temperature: number;
    managed_agents?: string[] | null;
    version: string;
    created_at: string;
    updated_at: string;
    llm_credential_id: string;
}

export default function AgentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedAgent, setEditedAgent] = useState<Partial<Agent>>({});
    const [updateLoading, setUpdateLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [versions, setVersions] = useState<any[]>([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [versionUpdateLoading, setVersionUpdateLoading] = useState(false);

    // RAG and Knowledge Base related state
    const [ragConfigs, setRagConfigs] = useState<any[]>([]);
    const [ragConfigsLoading, setRagConfigsLoading] = useState(false);
    const [showKnowledgeBaseModal, setShowKnowledgeBaseModal] = useState(false);

    const fetchRagConfigs = async (apiKey: string) => {
        setRagConfigsLoading(true);
        try {
            const data = await getRagConfigsByUserId(apiKey, apiKey);
            if (data.configs && Array.isArray(data.configs)) {
                setRagConfigs(data.configs);
            } else {
                setRagConfigs([]);
            }
        } catch (err: any) {
            console.error("Failed to fetch RAG configs:", err);
            setRagConfigs([]);
        } finally {
            setRagConfigsLoading(false);
        }
    };

    useEffect(() => {
        const fetchAgent = async () => {
            const agentId = params.agent_id as string;

            if (!agentId) {
                setError("No agent ID provided");
                setLoading(false);
                return;
            }

            // Get API key from localStorage
            const apiKey = localStorage.getItem("lyzr-api-key");
            if (!apiKey) {
                setError("API key not found. Please go back to dashboard and set your API key.");
                setLoading(false);
                return;
            }

            try {
                const agentData = await getAgentById(apiKey, agentId);
                setAgent(agentData);
                setError("");

                // Fetch RAG configurations for knowledge base features
                await fetchRagConfigs(apiKey);
            } catch (err: any) {
                console.error("Failed to fetch agent:", err);
                setError(err.message || "Failed to fetch agent details");
            } finally {
                setLoading(false);
            }
        };

        fetchAgent();
    }, [params.agent_id]);

    const handleGoBack = () => {
        router.push('/dashboard');
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditedAgent({
            name: agent?.name,
            description: agent?.description,
            agent_role: agent?.agent_role,
            agent_instructions: agent?.agent_instructions,
            temperature: agent?.temperature,
            top_p: agent?.top_p,
        });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedAgent({});
    };

    const handleSaveEdit = async () => {
        if (!agent) return;

        const agentId = params.agent_id as string;
        const apiKey = localStorage.getItem("lyzr-api-key");

        if (!apiKey) {
            setError("API key not found");
            return;
        }

        setUpdateLoading(true);
        setError("");

        try {
            // Determine if it's a single-task agent based on available tools/tool field
            const isSingleTask = agent.tools && agent.tools.length === 0;

            if (isSingleTask) {
                // Prepare single task agent update data
                const singleTaskUpdateData = {
                    name: editedAgent.name || agent.name,
                    description: editedAgent.description || agent.description,
                    agent_role: editedAgent.agent_role || agent.agent_role,
                    agent_instructions: editedAgent.agent_instructions || agent.agent_instructions,
                    examples: agent.examples || undefined,
                    features: agent.features ? agent.features.map(f => typeof f === 'string' ? { type: f } : f) : [],
                    tool: agent.tools && agent.tools.length > 0 ? agent.tools[0] : undefined,
                    tool_usage_description: agent.tool_usage_description,
                    llm_credential_id: agent.llm_credential_id,
                    provider_id: agent.provider_id,
                    model: agent.model,
                    temperature: editedAgent.temperature !== undefined ? editedAgent.temperature : agent.temperature,
                    top_p: editedAgent.top_p !== undefined ? editedAgent.top_p : agent.top_p,
                    response_format: agent.response_format || undefined
                };

                await updateSingleTaskAgent(apiKey, agentId, singleTaskUpdateData);
            } else {
                // Prepare regular agent update data
                const regularUpdateData = {
                    name: editedAgent.name || agent.name,
                    description: editedAgent.description || agent.description,
                    system_prompt: editedAgent.agent_instructions || agent.agent_instructions,
                    features: agent.features ? agent.features.map(f => typeof f === 'string' ? { type: f } : f) : [],
                    tools: agent.tools || [],
                    llm_credential_id: agent.llm_credential_id,
                    provider_id: agent.provider_id,
                    model: agent.model,
                    temperature: editedAgent.temperature !== undefined ? editedAgent.temperature : agent.temperature,
                    top_p: editedAgent.top_p !== undefined ? editedAgent.top_p : agent.top_p,
                    response_format: agent.response_format || undefined
                };

                await updateAgent(apiKey, agentId, regularUpdateData);
            }

            // Refresh agent data
            const updatedAgent = await getAgentById(apiKey, agentId);
            setAgent(updatedAgent);
            setIsEditing(false);
            setEditedAgent({});

            // Refetch version history to get any new versions created by the update
            try {
                const versionsData = await getAgentVersions(apiKey, agentId);
                console.log("Version data received after update:", versionsData); // Debug log

                // Handle the actual API response structure
                let versionsArray = [];
                if (Array.isArray(versionsData)) {
                    versionsArray = versionsData;
                } else if (versionsData && versionsData.versions && Array.isArray(versionsData.versions.versions)) {
                    // The API returns: { versions: { versions: [...] } }
                    versionsArray = versionsData.versions.versions;
                } else if (versionsData && Array.isArray(versionsData.versions)) {
                    versionsArray = versionsData.versions;
                } else if (versionsData && Array.isArray(versionsData.data)) {
                    versionsArray = versionsData.data;
                } else {
                    versionsArray = [];
                }

                setVersions(versionsArray);
            } catch (versionErr: any) {
                console.warn("Failed to refresh version history:", versionErr);
                // Don't show error to user as this is secondary functionality
            }
        } catch (err: any) {
            setError(err.message || "Failed to update agent");
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!agent) return;

        const confirmDelete = window.confirm(`Are you sure you want to delete agent "${agent.name}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        const agentId = params.agent_id as string;
        const apiKey = localStorage.getItem("lyzr-api-key");

        if (!apiKey) {
            setError("API key not found");
            return;
        }

        setDeleteLoading(true);
        setError("");

        try {
            await deleteAgent(apiKey, agentId);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || "Failed to delete agent");
            setDeleteLoading(false);
        }
    };

    const handleInputChange = (field: keyof Agent, value: any) => {
        setEditedAgent(prev => ({ ...prev, [field]: value }));
    };

    const getKnowledgeBaseFeatures = () => {
        return agent?.features?.filter(feature => feature.type === 'KNOWLEDGE_BASE') || [];
    };

    const addKnowledgeBaseFeature = (ragConfig: any) => {
        if (!agent) return;

        const newFeature = {
            type: "KNOWLEDGE_BASE",
            config: {
                lyzr_rag: {
                    base_url: "https://rag-prod.studio.lyzr.ai",
                    rag_id: ragConfig._id,
                    rag_name: ragConfig.collection_name || ragConfig.name,
                    params: {
                        top_k: 5,
                        retrieval_type: "basic",
                        score_threshold: 0
                    }
                },
                agentic_rag: []
            },
            priority: 0
        };

        const currentFeatures = agent.features || [];
        const updatedFeatures = [...currentFeatures, newFeature];

        setEditedAgent(prev => ({
            ...prev,
            features: updatedFeatures
        }));

        // Update agent features
        updateAgentFeatures(updatedFeatures);
    };

    const removeKnowledgeBaseFeature = (ragId: string) => {
        if (!agent) return;

        const currentFeatures = agent.features || [];
        const updatedFeatures = currentFeatures.filter(feature => {
            if (feature.type === 'KNOWLEDGE_BASE' && feature.config?.lyzr_rag?.rag_id === ragId) {
                return false;
            }
            return true;
        });

        updateAgentFeatures(updatedFeatures);
    };

    const updateAgentFeatures = async (newFeatures: any[]) => {
        if (!agent) return;

        const agentId = params.agent_id as string;
        const apiKey = localStorage.getItem("lyzr-api-key");

        if (!apiKey) {
            setError("API key not found");
            return;
        }

        try {
            // Determine if it's a single-task agent
            const isSingleTask = agent.tools && agent.tools.length === 0;

            if (isSingleTask) {
                const singleTaskUpdateData = {
                    name: agent.name,
                    description: agent.description,
                    agent_role: agent.agent_role,
                    agent_instructions: agent.agent_instructions,
                    examples: agent.examples || undefined,
                    features: newFeatures,
                    tool: agent.tools && agent.tools.length > 0 ? agent.tools[0] : undefined,
                    tool_usage_description: agent.tool_usage_description,
                    llm_credential_id: agent.llm_credential_id,
                    provider_id: agent.provider_id,
                    model: agent.model,
                    temperature: agent.temperature,
                    top_p: agent.top_p,
                    response_format: agent.response_format || undefined
                };

                await updateSingleTaskAgent(apiKey, agentId, singleTaskUpdateData);
            } else {
                const regularUpdateData = {
                    name: agent.name,
                    description: agent.description,
                    system_prompt: agent.agent_instructions,
                    features: newFeatures,
                    tools: agent.tools || [],
                    llm_credential_id: agent.llm_credential_id,
                    provider_id: agent.provider_id,
                    model: agent.model,
                    temperature: agent.temperature,
                    top_p: agent.top_p,
                    response_format: agent.response_format || undefined
                };

                await updateAgent(apiKey, agentId, regularUpdateData);
            }

            // Refresh agent data
            const updatedAgent = await getAgentById(apiKey, agentId);
            setAgent(updatedAgent);
        } catch (err: any) {
            setError(err.message || "Failed to update agent features");
        }
    };

    const fetchVersionHistory = async () => {
        if (!agent) return;

        const apiKey = localStorage.getItem("lyzr-api-key");
        if (!apiKey) {
            setError("API key not found");
            return;
        }

        setVersionsLoading(true);
        try {
            const versionsData = await getAgentVersions(apiKey, agent._id);
            console.log("Version data received:", versionsData); // Debug log

            // Handle the actual API response structure
            let versionsArray = [];
            if (Array.isArray(versionsData)) {
                versionsArray = versionsData;
            } else if (versionsData && versionsData.versions && Array.isArray(versionsData.versions.versions)) {
                // The API returns: { versions: { versions: [...] } }
                versionsArray = versionsData.versions.versions;
            } else if (versionsData && Array.isArray(versionsData.versions)) {
                versionsArray = versionsData.versions;
            } else if (versionsData && Array.isArray(versionsData.data)) {
                versionsArray = versionsData.data;
            } else {
                console.warn("Unexpected version data structure:", versionsData);
                versionsArray = [];
            }

            setVersions(versionsArray);
            setShowVersionHistory(true);
        } catch (err: any) {
            setError(err.message || "Failed to fetch version history");
        } finally {
            setVersionsLoading(false);
        }
    };

    const handleVersionSelect = async (versionId: string) => {
        if (!agent) return;

        const confirmUpdate = window.confirm(`Are you sure you want to update this agent to version ${versionId.substring(0, 8)}...? This will overwrite the current configuration.`);
        if (!confirmUpdate) return;

        const apiKey = localStorage.getItem("lyzr-api-key");
        if (!apiKey) {
            setError("API key not found");
            return;
        }

        setVersionUpdateLoading(true);
        setError("");

        try {
            // Find the version data from the current versions array
            const selectedVersion = versions.find(v => (v.version_id || v.id) === versionId);
            if (!selectedVersion) {
                throw new Error("Version not found");
            }

            // Extract config data from the version
            const versionData = selectedVersion.config || selectedVersion;

            // Determine if it's a single-task agent
            const isSingleTask = agent.tools && agent.tools.length === 0;

            if (isSingleTask) {
                // Prepare single task agent update data from version
                const singleTaskUpdateData = {
                    name: versionData.name || agent.name,
                    description: versionData.description || agent.description,
                    agent_role: versionData.agent_role || agent.agent_role,
                    agent_instructions: versionData.agent_instructions || agent.agent_instructions,
                    examples: versionData.examples || agent.examples || undefined,
                    features: versionData.features ? versionData.features.map((f: any) => typeof f === 'string' ? { type: f } : f) : (agent.features || []),
                    tool: versionData.tool || (versionData.tools && versionData.tools.length > 0 ? versionData.tools[0] : undefined),
                    tool_usage_description: versionData.tool_usage_description || agent.tool_usage_description,
                    llm_credential_id: versionData.llm_credential_id || agent.llm_credential_id,
                    provider_id: versionData.provider_id || agent.provider_id,
                    model: versionData.model || agent.model,
                    temperature: versionData.temperature !== undefined ? versionData.temperature : agent.temperature,
                    top_p: versionData.top_p !== undefined ? versionData.top_p : agent.top_p,
                    response_format: versionData.response_format || agent.response_format || undefined
                };

                await updateSingleTaskAgent(apiKey, agent._id, singleTaskUpdateData);
            } else {
                // Prepare regular agent update data from version
                const regularUpdateData = {
                    name: versionData.name || agent.name,
                    description: versionData.description || agent.description,
                    system_prompt: versionData.agent_instructions || agent.agent_instructions,
                    features: versionData.features ? versionData.features.map((f: any) => typeof f === 'string' ? { type: f } : f) : (agent.features || []),
                    tools: versionData.tools || agent.tools || [],
                    llm_credential_id: versionData.llm_credential_id || agent.llm_credential_id,
                    provider_id: versionData.provider_id || agent.provider_id,
                    model: versionData.model || agent.model,
                    temperature: versionData.temperature !== undefined ? versionData.temperature : agent.temperature,
                    top_p: versionData.top_p !== undefined ? versionData.top_p : agent.top_p,
                    response_format: versionData.response_format || agent.response_format || undefined
                };

                await updateAgent(apiKey, agent._id, regularUpdateData);
            }

            // Refresh agent data
            const updatedAgent = await getAgentById(apiKey, agent._id);
            setAgent(updatedAgent);
            setShowVersionHistory(false);

        } catch (err: any) {
            setError(err.message || "Failed to update agent with version");
        } finally {
            setVersionUpdateLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="flex flex-col items-center justify-center min-h-screen px-4">
                    <div className="w-full max-w-md text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <div className="text-gray-600 dark:text-gray-400">Loading agent details...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="flex flex-col items-center justify-center min-h-screen px-4">
                    <Card className="w-full max-w-md p-6 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                        <div className="text-red-600 dark:text-red-400 mb-4 font-medium">{error}</div>
                        <Button
                            onClick={handleGoBack}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back to Dashboard
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="flex flex-col items-center justify-center min-h-screen px-4">
                    <Card className="w-full max-w-md p-6 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                        <div className="text-red-600 dark:text-red-400 mb-4 font-medium">Agent not found</div>
                        <Button
                            onClick={handleGoBack}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back to Dashboard
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="px-4 py-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{agent.name}</h1>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">Agent Details & Configuration</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <>
                                        <Button
                                            onClick={handleEdit}
                                            variant="outline"
                                            className="rounded-xl border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={fetchVersionHistory}
                                            variant="outline"
                                            disabled={versionsLoading}
                                            className="rounded-xl border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        >
                                            <History className="h-4 w-4 mr-2" />
                                            {versionsLoading ? "Loading..." : "Version History"}
                                        </Button>
                                        <Button
                                            onClick={handleDelete}
                                            variant="outline"
                                            disabled={deleteLoading}
                                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {deleteLoading ? "Deleting..." : "Delete"}
                                        </Button>
                                        <Button
                                            onClick={handleGoBack}
                                            variant="outline"
                                            className="rounded-xl border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        >
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleSaveEdit}
                                            disabled={updateLoading}
                                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-xl"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {updateLoading ? "Saving..." : "Save"}
                                        </Button>
                                        <Button
                                            onClick={handleCancelEdit}
                                            variant="outline"
                                            className="rounded-xl border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Cancel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <Card className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3 mb-6">
                            <Database className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Agent ID</span>
                                <p className="text-sm text-gray-900 dark:text-white font-mono bg-slate-50 dark:bg-slate-700 p-2 rounded-lg">{agent._id}</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</span>
                                {isEditing ? (
                                    <Input
                                        value={editedAgent.name || ""}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        className="rounded-xl border-slate-200 dark:border-slate-600"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 dark:text-white p-2">{agent.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</span>
                                {isEditing ? (
                                    <Input
                                        value={editedAgent.description || ""}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        className="rounded-xl border-slate-200 dark:border-slate-600"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 dark:text-white p-2">{agent.description || 'No description provided'}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Version</span>
                                <p className="text-sm text-gray-900 dark:text-white p-2">{agent.version}</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Provider</span>
                                <p className="text-sm text-gray-900 dark:text-white p-2">{agent.provider_id}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Agent Configuration */}
                    <Card className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3 mb-6">
                            <Bot className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agent Configuration</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Agent Role</span>
                                {isEditing ? (
                                    <Input
                                        value={editedAgent.agent_role || ""}
                                        onChange={(e) => handleInputChange("agent_role", e.target.value)}
                                        className="rounded-xl border-slate-200 dark:border-slate-600"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-700 rounded-xl whitespace-pre-wrap">{agent.agent_role}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Agent Instructions</span>
                                {isEditing ? (
                                    <textarea
                                        value={editedAgent.agent_instructions || ""}
                                        onChange={(e) => handleInputChange("agent_instructions", e.target.value)}
                                        className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl resize-vertical min-h-[120px] bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-700 rounded-xl whitespace-pre-wrap">{agent.agent_instructions}</p>
                                )}
                            </div>
                            {agent.agent_goal && (
                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Agent Goal</span>
                                    <p className="text-sm text-gray-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-700 rounded-xl whitespace-pre-wrap">{agent.agent_goal}</p>
                                </div>
                            )}
                            {agent.agent_context && (
                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Agent Context</span>
                                    <p className="text-sm text-gray-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-700 rounded-xl whitespace-pre-wrap">{agent.agent_context}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Model Settings */}
                    <Card className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3 mb-6">
                            <Settings className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Model Settings</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</span>
                                <p className="text-sm text-gray-900 dark:text-white p-2 bg-slate-50 dark:bg-slate-700 rounded-lg font-mono">{agent.model}</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Temperature</span>
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="2"
                                        value={editedAgent.temperature || ""}
                                        onChange={(e) => handleInputChange("temperature", parseFloat(e.target.value))}
                                        className="rounded-xl border-slate-200 dark:border-slate-600"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 dark:text-white p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">{agent.temperature}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Top P</span>
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="1"
                                        value={editedAgent.top_p || ""}
                                        onChange={(e) => handleInputChange("top_p", parseFloat(e.target.value))}
                                        className="rounded-xl border-slate-200 dark:border-slate-600"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900 dark:text-white p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">{agent.top_p}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Response Format</span>
                                <p className="text-sm text-gray-900 dark:text-white p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">{agent.response_format?.type || 'Not specified'}</p>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">LLM Credential ID</span>
                                <p className="text-sm text-gray-900 dark:text-white p-2 bg-slate-50 dark:bg-slate-700 rounded-lg font-mono">{agent.llm_credential_id}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Additional Details */}
                    <Card className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3 mb-6">
                            <Zap className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Details</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Features</span>
                                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {agent.features && agent.features.length > 0
                                            ? agent.features.map(f => typeof f === 'string' ? f : f.type).join(', ')
                                            : 'No features configured'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tools</span>
                                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {agent.tools && agent.tools.length > 0 ? agent.tools.join(', ') : 'No tools configured'}
                                    </p>
                                </div>
                            </div>
                            {agent.tool_usage_description && agent.tool_usage_description !== '{}' && (
                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tool Usage Description</span>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                        <p className="text-sm text-gray-900 dark:text-white">{agent.tool_usage_description}</p>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Managed Agents</span>
                                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {agent.managed_agents && agent.managed_agents.length > 0 ? agent.managed_agents.join(', ') : 'No managed agents'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Knowledge Base Features */}
                    <Card className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-3">
                                <Brain className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Knowledge Base Features</h2>
                            </div>
                            <Button
                                onClick={() => setShowKnowledgeBaseModal(true)}
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-xl"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Knowledge Base
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {getKnowledgeBaseFeatures().length > 0 ? (
                                getKnowledgeBaseFeatures().map((feature, index) => {
                                    const ragConfig = feature.config?.lyzr_rag;
                                    return (
                                        <div key={index} className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{ragConfig?.rag_name || 'Unknown Knowledge Base'}</h3>
                                                    <div className="space-y-2 mt-3">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            <strong>RAG ID:</strong> <span className="font-mono">{ragConfig?.rag_id}</span>
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            <strong>Base URL:</strong> <span className="font-mono">{ragConfig?.base_url}</span>
                                                        </p>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            <strong>Parameters:</strong>
                                                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mt-2 border border-slate-200 dark:border-slate-600">
                                                                <ul className="space-y-1">
                                                                    <li><span className="font-medium">Top K:</span> {ragConfig?.params?.top_k || 5}</li>
                                                                    <li><span className="font-medium">Retrieval Type:</span> {ragConfig?.params?.retrieval_type || 'basic'}</li>
                                                                    <li><span className="font-medium">Score Threshold:</span> {ragConfig?.params?.score_threshold || 0}</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => removeKnowledgeBaseFeature(ragConfig?.rag_id)}
                                                    variant="outline"
                                                    className="ml-4 rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8">
                                    <Brain className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No knowledge base features configured. Click "Add Knowledge Base" to attach a RAG configuration.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Timestamps */}
                    <Card className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-3 mb-6">
                            <Clock className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Timestamps</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</span>
                                <p className="text-sm text-gray-900 dark:text-white p-2 bg-slate-50 dark:bg-slate-700 rounded-lg font-mono">{new Date(agent.created_at).toLocaleString()}</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated At</span>
                                <p className="text-sm text-gray-900 dark:text-white p-2 bg-slate-50 dark:bg-slate-700 rounded-lg font-mono">{new Date(agent.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Version History Modal */}
            {showVersionHistory && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowVersionHistory(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-3">
                                <History className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Version History</h2>
                            </div>
                            <Button
                                onClick={() => setShowVersionHistory(false)}
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200 dark:border-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {!Array.isArray(versions) || versions.length === 0 ? (
                            <div className="text-center py-8">
                                <History className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No version history available</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {versions.map((version: any, index: number) => {
                                    const config = version.config || version;
                                    const versionId = version.version_id || version.id || index.toString();
                                    const isActive = version.active === true;

                                    return (
                                        <Card key={versionId} className="p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:shadow-md transition-all duration-200">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="font-semibold text-gray-900 dark:text-white">Version {versionId.substring(0, 8)}...</span>
                                                        {isActive && (
                                                            <span className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs px-2 py-1 rounded-full font-medium">Current</span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            <strong>Name:</strong> {config.name || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            <strong>Description:</strong> {config.description || 'No description'}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            <strong>Model:</strong> {config.model || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            <strong>Temperature:</strong> {config.temperature || 'N/A'}
                                                        </p>
                                                        {version.created_at && (
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                                                Created: {new Date(version.created_at).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {!isActive && (
                                                    <Button
                                                        onClick={() => handleVersionSelect(versionId)}
                                                        disabled={versionUpdateLoading}
                                                        size="sm"
                                                        className="ml-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl"
                                                    >
                                                        {versionUpdateLoading ? "Loading..." : "Apply"}
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Knowledge Base Selection Modal */}
            {showKnowledgeBaseModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowKnowledgeBaseModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-3">
                                <Brain className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Knowledge Base</h2>
                            </div>
                            <Button
                                onClick={() => setShowKnowledgeBaseModal(false)}
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200 dark:border-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {ragConfigsLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-500 dark:text-gray-400">Loading knowledge bases...</p>
                            </div>
                        ) : ragConfigs.length === 0 ? (
                            <div className="text-center py-8">
                                <Brain className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    No knowledge bases available. Create a RAG configuration first from the dashboard.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                    Select a knowledge base to attach to this agent. The agent will be able to use the documents in the selected knowledge base to answer questions.
                                </p>
                                {ragConfigs.map((ragConfig, index) => {
                                    const isAlreadyAttached = getKnowledgeBaseFeatures().some(
                                        feature => feature.config?.lyzr_rag?.rag_id === ragConfig._id
                                    );

                                    return (
                                        <Card key={ragConfig._id || index} className="p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:shadow-md transition-all duration-200">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{ragConfig.collection_name}</h3>
                                                    {ragConfig.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ragConfig.description}</p>
                                                    )}
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 space-y-1 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                                                        <div><strong>ID:</strong> <span className="font-mono">{ragConfig._id}</span></div>
                                                        <div><strong>LLM Model:</strong> {ragConfig.llm_model}</div>
                                                        <div><strong>Embedding Model:</strong> {ragConfig.embedding_model}</div>
                                                        <div><strong>Vector Store:</strong> {ragConfig.vector_store_provider}</div>
                                                        <div><strong>Created:</strong> {new Date(ragConfig.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                    {isAlreadyAttached && (
                                                        <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs px-2 py-1 rounded-full mt-3 font-medium">
                                                            Already Attached
                                                        </span>
                                                    )}
                                                </div>
                                                <Button
                                                    onClick={() => {
                                                        addKnowledgeBaseFeature(ragConfig);
                                                        setShowKnowledgeBaseModal(false);
                                                    }}
                                                    size="sm"
                                                    disabled={isAlreadyAttached}
                                                    className="ml-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isAlreadyAttached ? "Attached" : "Attach"}
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
