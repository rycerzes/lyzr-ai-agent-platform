"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAgentById, updateAgent, deleteAgent, updateSingleTaskAgent, getAgentVersions, getAgentVersion } from "@/lib/lyzr-api";

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
    features?: string[] | null;
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
                    response_format: agent.response_format
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
                    response_format: agent.response_format
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
                    response_format: versionData.response_format || agent.response_format
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
                    response_format: versionData.response_format || agent.response_format
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
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-4xl p-6 text-center text-gray-500">
                    <div>Loading agent details...</div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-4xl p-6 text-center">
                    <div className="text-red-500 mb-4">{error}</div>
                    <Button onClick={handleGoBack}>Go Back to Dashboard</Button>
                </Card>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-4xl p-6 text-center">
                    <div className="text-red-500 mb-4">Agent not found</div>
                    <Button onClick={handleGoBack}>Go Back to Dashboard</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen p-4">
            <div className="w-full max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">{agent.name}</h1>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <>
                                <Button onClick={handleEdit} variant="outline">
                                    ✏️ Edit
                                </Button>
                                <Button
                                    onClick={fetchVersionHistory}
                                    variant="outline"
                                    disabled={versionsLoading}
                                >
                                    {versionsLoading ? "Loading..." : "📜 Version History"}
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    variant="destructive"
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? "Deleting..." : "🗑️ Delete"}
                                </Button>
                                <Button onClick={handleGoBack} variant="outline">
                                    ← Back
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={updateLoading}
                                >
                                    {updateLoading ? "Saving..." : "💾 Save"}
                                </Button>
                                <Button onClick={handleCancelEdit} variant="outline">
                                    ❌ Cancel
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="font-medium">Agent ID:</span>
                            <p className="text-sm text-gray-600 mt-1">{agent._id}</p>
                        </div>
                        <div>
                            <span className="font-medium">Name:</span>
                            {isEditing ? (
                                <Input
                                    value={editedAgent.name || ""}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    className="mt-1"
                                />
                            ) : (
                                <p className="text-sm text-gray-600 mt-1">{agent.name}</p>
                            )}
                        </div>
                        <div>
                            <span className="font-medium">Description:</span>
                            {isEditing ? (
                                <Input
                                    value={editedAgent.description || ""}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    className="mt-1"
                                />
                            ) : (
                                <p className="text-sm text-gray-600 mt-1">{agent.description || 'No description provided'}</p>
                            )}
                        </div>
                        <div>
                            <span className="font-medium">Version:</span>
                            <p className="text-sm text-gray-600 mt-1">{agent.version}</p>
                        </div>
                        <div>
                            <span className="font-medium">Provider:</span>
                            <p className="text-sm text-gray-600 mt-1">{agent.provider_id}</p>
                        </div>
                    </div>
                </Card>

                {/* Agent Configuration */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Agent Configuration</h2>
                    <div className="space-y-4">
                        <div>
                            <span className="font-medium">Agent Role:</span>
                            {isEditing ? (
                                <Input
                                    value={editedAgent.agent_role || ""}
                                    onChange={(e) => handleInputChange("agent_role", e.target.value)}
                                    className="mt-1"
                                />
                            ) : (
                                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{agent.agent_role}</p>
                            )}
                        </div>
                        <div>
                            <span className="font-medium">Agent Instructions:</span>
                            {isEditing ? (
                                <textarea
                                    value={editedAgent.agent_instructions || ""}
                                    onChange={(e) => handleInputChange("agent_instructions", e.target.value)}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md resize-vertical min-h-[100px]"
                                />
                            ) : (
                                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{agent.agent_instructions}</p>
                            )}
                        </div>
                        {agent.agent_goal && (
                            <div>
                                <span className="font-medium">Agent Goal:</span>
                                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{agent.agent_goal}</p>
                            </div>
                        )}
                        {agent.agent_context && (
                            <div>
                                <span className="font-medium">Agent Context:</span>
                                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{agent.agent_context}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Model Settings */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Model Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <span className="font-medium">Model:</span>
                            <p className="text-sm text-gray-600 mt-1">{agent.model}</p>
                        </div>
                        <div>
                            <span className="font-medium">Temperature:</span>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="2"
                                    value={editedAgent.temperature || ""}
                                    onChange={(e) => handleInputChange("temperature", parseFloat(e.target.value))}
                                    className="mt-1"
                                />
                            ) : (
                                <p className="text-sm text-gray-600 mt-1">{agent.temperature}</p>
                            )}
                        </div>
                        <div>
                            <span className="font-medium">Top P:</span>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="1"
                                    value={editedAgent.top_p || ""}
                                    onChange={(e) => handleInputChange("top_p", parseFloat(e.target.value))}
                                    className="mt-1"
                                />
                            ) : (
                                <p className="text-sm text-gray-600 mt-1">{agent.top_p}</p>
                            )}
                        </div>
                        <div>
                            <span className="font-medium">Response Format:</span>
                            <p className="text-sm text-gray-600 mt-1">{agent.response_format?.type || 'Not specified'}</p>
                        </div>
                        <div>
                            <span className="font-medium">LLM Credential ID:</span>
                            <p className="text-sm text-gray-600 mt-1">{agent.llm_credential_id}</p>
                        </div>
                    </div>
                </Card>

                {/* Additional Details */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Additional Details</h2>
                    <div className="space-y-4">
                        <div>
                            <span className="font-medium">Features:</span>
                            <p className="text-sm text-gray-600 mt-1">
                                {agent.features && agent.features.length > 0 ? agent.features.join(', ') : 'No features configured'}
                            </p>
                        </div>
                        <div>
                            <span className="font-medium">Tools:</span>
                            <p className="text-sm text-gray-600 mt-1">
                                {agent.tools && agent.tools.length > 0 ? agent.tools.join(', ') : 'No tools configured'}
                            </p>
                        </div>
                        {agent.tool_usage_description && agent.tool_usage_description !== '{}' && (
                            <div>
                                <span className="font-medium">Tool Usage Description:</span>
                                <p className="text-sm text-gray-600 mt-1">{agent.tool_usage_description}</p>
                            </div>
                        )}
                        <div>
                            <span className="font-medium">Managed Agents:</span>
                            <p className="text-sm text-gray-600 mt-1">
                                {agent.managed_agents && agent.managed_agents.length > 0 ? agent.managed_agents.join(', ') : 'No managed agents'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Timestamps */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Timestamps</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="font-medium">Created At:</span>
                            <p className="text-sm text-gray-600 mt-1">{new Date(agent.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                            <span className="font-medium">Updated At:</span>
                            <p className="text-sm text-gray-600 mt-1">{new Date(agent.updated_at).toLocaleString()}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Version History Modal */}
            {showVersionHistory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowVersionHistory(false)}>
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Version History</h2>
                            <Button
                                onClick={() => setShowVersionHistory(false)}
                                variant="outline"
                                size="sm"
                            >
                                ✕
                            </Button>
                        </div>

                        {!Array.isArray(versions) || versions.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No version history available</p>
                        ) : (
                            <div className="space-y-3">
                                {versions.map((version: any, index: number) => {
                                    const config = version.config || version;
                                    const versionId = version.version_id || version.id || index.toString();
                                    const isActive = version.active === true;

                                    return (
                                        <Card key={versionId} className="p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-medium">Version {versionId.substring(0, 8)}...</span>
                                                        {isActive && (
                                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Current</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        <strong>Name:</strong> {config.name || 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        <strong>Description:</strong> {config.description || 'No description'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        <strong>Model:</strong> {config.model || 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        <strong>Temperature:</strong> {config.temperature || 'N/A'}
                                                    </p>
                                                    {version.created_at && (
                                                        <p className="text-xs text-gray-400">
                                                            Created: {new Date(version.created_at).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                                {!isActive && (
                                                    <Button
                                                        onClick={() => handleVersionSelect(versionId)}
                                                        disabled={versionUpdateLoading}
                                                        size="sm"
                                                        className="ml-4"
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
        </div>
    );
}
