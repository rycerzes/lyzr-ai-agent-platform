"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createAgent, createSingleTaskAgent, type CreateAgentRequest, type CreateSingleTaskAgentRequest } from "@/lib/lyzr-api";

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    onAgentCreated: () => void;
}

export function CreateAgentModal({ isOpen, onClose, apiKey, onAgentCreated }: CreateAgentModalProps) {
    const [agentType, setAgentType] = useState<"regular" | "single-task">("single-task");

    const modelsByProvider = {
        "OpenAI": [
            "gpt-4o",
            "gpt-4o-mini",
            "o4-mini",
            "gpt-4.1",
            "o3"
        ],
        "Amazon Bedrock": [
            "amazon.nova-micro-v1:0",
            "amazon.nova-lite-v1:0",
            "amazon.nova-pro-v1:0",
            "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            "us.anthropic.claude-3-5-sonnet-20240620-v1:0",
            "us.anthropic.claude-3-sonnet-20240229-v1:0",
            "us.anthropic.claude-3-5-haiku-20241022-v1:0",
            "us.anthropic.claude-3-haiku-20240307-v1:0",
            "us.anthropic.claude-3-opus-20240229-v1:0",
            "us.meta.llama3-3-70b-instruct-v1:0",
            "us.meta.llama3-2-1b-instruct-v1:0",
            "us.meta.llama3-2-3b-instruct-v1:0",
            "us.meta.llama3-2-11b-instruct-v1:0",
            "us.meta.llama3-2-90b-instruct-v1:0",
            "mistral.mistral-7b-instruct-v0:2",
            "mistral.mixtral-8x7b-instruct-v0:1",
            "mistral.mistral-large-2402-v1:0",
            "mistral.mistral-small-2402-v1:0",
            "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
        ],
        "Google": [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.0-pro-exp-02-05",
            "gemini-2.0-flash-thinking-exp-01-21",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.5-flash-preview-04-17",
            "gemini-2.5-pro"
        ],
        "Anthropic": [
            "claude-3-5-sonnet-latest",
            "claude-3-7-sonnet-latest",
            "claude-3-5-haiku-latest",
            "claude-sonnet-4-0",
            "claude-opus-4-0"
        ],
        "Perplexity": [
            "perplexity/sonar",
            "perplexity/sonar-pro",
            "perplexity/sonar-reasoning",
            "perplexity/sonar-reasoning-pro",
            "perplexity/r1-1776",
            "perplexity/sonar-deep-research"
        ],
        "Groq": [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "llama-4-scout-17b-16e-instruct",
            "Llama-4-Maverick-17B-128E-Instruct",
            "deepseek-r1-distill-qwen-32b",
            "mixtral-8x7b-32768",
            "deepseek-r1-distill-llama-70b"
        ]
    };

    const getCredentialId = (provider: string) => {
        const providerMap: { [key: string]: string } = {
            "OpenAI": "lyzr_openai",
            "Amazon Bedrock": "lyzr_amazon_bedrock",
            "Google": "lyzr_google",
            "Anthropic": "lyzr_anthropic",
            "Perplexity": "lyzr_perplexity",
            "Groq": "lyzr_groq"
        };
        return providerMap[provider] || "lyzr_openai";
    };

    const [formData, setFormData] = useState<CreateAgentRequest>({
        name: "",
        description: "",
        agent_role: "",
        agent_goal: "",
        agent_instructions: "",
        examples: undefined,
        tool: "customer_support",
        tool_usage_description: "Handle customer inquiries and provide support",
        provider_id: "Perplexity",
        model: "perplexity/sonar-reasoning-pro",
        temperature: 0.7,
        top_p: 0.9,
        llm_credential_id: "lyzr_perplexity",
        features: [],
        managed_agents: [],
        response_format: {
            type: "text"
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleInputChange = (field: keyof CreateAgentRequest, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleProviderChange = (provider: string) => {
        const models = modelsByProvider[provider as keyof typeof modelsByProvider] || [];
        setFormData(prev => ({
            ...prev,
            provider_id: provider,
            model: models[0] || "",
            llm_credential_id: getCredentialId(provider)
        }));
    };

    const handleAgentTypeChange = (type: "regular" | "single-task") => {
        setAgentType(type);
        // Reset form with appropriate defaults for the agent type
        setFormData({
            name: "",
            description: "",
            agent_role: "",
            agent_goal: "",
            agent_instructions: "",
            examples: undefined,
            tool: type === "single-task" ? "customer_support" : "",
            tool_usage_description: type === "single-task" ? "Handle customer inquiries and provide support" : "{}",
            provider_id: "Perplexity",
            model: "perplexity/sonar-reasoning-pro",
            temperature: 0.7,
            top_p: 0.9,
            llm_credential_id: "lyzr_perplexity",
            features: [],
            managed_agents: [],
            response_format: {
                type: "text"
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const requiredFields = agentType === "single-task"
            ? ["name", "description", "agent_role", "agent_instructions", "tool"]
            : ["name", "description", "agent_role"];

        const missingFields = requiredFields.filter(field => !formData[field as keyof CreateAgentRequest]);

        if (missingFields.length > 0) {
            setError(`${missingFields.join(", ")} ${missingFields.length === 1 ? 'is' : 'are'} required`);
            return;
        }

        setLoading(true);
        setError("");

        try {
            if (agentType === "single-task") {
                const singleTaskData: CreateSingleTaskAgentRequest = {
                    name: formData.name,
                    description: formData.description,
                    agent_role: formData.agent_role,
                    agent_instructions: formData.agent_instructions,
                    examples: formData.examples || "",
                    features: [{
                        type: "SINGLE_TOOL_CALL",
                        config: {},
                        priority: 0
                    }],
                    tool: formData.tool || "",
                    tool_usage_description: formData.tool_usage_description,
                    llm_credential_id: formData.llm_credential_id,
                    response_format: formData.response_format,
                    provider_id: formData.provider_id,
                    model: formData.model,
                    top_p: formData.top_p,
                    temperature: formData.temperature
                };
                await createSingleTaskAgent(apiKey, singleTaskData);
            } else {
                await createAgent(apiKey, formData);
            }

            onAgentCreated();
            onClose();
            // Reset form
            setFormData({
                name: "",
                description: "",
                agent_role: "",
                agent_goal: "",
                agent_instructions: "",
                examples: undefined,
                tool: agentType === "single-task" ? "customer_support" : "",
                tool_usage_description: agentType === "single-task" ? "Handle customer inquiries and provide support" : "{}",
                provider_id: "Perplexity",
                model: "perplexity/sonar-reasoning-pro",
                temperature: 0.7,
                top_p: 0.9,
                llm_credential_id: "lyzr_perplexity",
                features: [],
                managed_agents: [],
                response_format: {
                    type: "text"
                }
            });
        } catch (err: any) {
            setError(err.message || "Failed to create agent");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Create New Agent</h2>
                    <Button variant="ghost" onClick={onClose} className="p-2">
                        ✕
                    </Button>
                </div>

                {error && (
                    <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Agent Type
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="agentType"
                                    value="single-task"
                                    checked={agentType === "single-task"}
                                    onChange={(e) => handleAgentTypeChange(e.target.value as "single-task")}
                                    className="mr-2"
                                />
                                Single Task Agent (Customer Support)
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="agentType"
                                    value="regular"
                                    checked={agentType === "regular"}
                                    onChange={(e) => handleAgentTypeChange(e.target.value as "regular")}
                                    className="mr-2"
                                />
                                Regular Agent
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {agentType === "single-task"
                                ? "Simplified template for customer support with pre-configured settings"
                                : "Full customization with all available options"
                            }
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            placeholder="Enter agent name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            placeholder="Enter agent description"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Agent Role <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full min-h-[120px] p-3 border rounded-md resize-y"
                            value={formData.agent_role}
                            onChange={(e) => handleInputChange("agent_role", e.target.value)}
                            placeholder={agentType === "single-task"
                                ? "You are a helpful customer support agent. You assist customers with their inquiries, resolve issues, and provide information about products and services."
                                : "You are an Expert PROMPT DESIGNER tasked with optimizing user prompts for clarity and effectiveness."
                            }
                            required
                        />
                    </div>

                    {agentType === "regular" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Agent Goal
                            </label>
                            <Input
                                value={formData.agent_goal}
                                onChange={(e) => handleInputChange("agent_goal", e.target.value)}
                                placeholder="Enter agent goal (optional)"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Agent Instructions {agentType === "single-task" && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            className="w-full min-h-[120px] p-3 border rounded-md resize-y"
                            value={formData.agent_instructions}
                            onChange={(e) => handleInputChange("agent_instructions", e.target.value)}
                            placeholder={agentType === "single-task"
                                ? "1. Greet customers warmly and professionally\n2. Listen carefully to their concerns\n3. Provide accurate information and solutions\n4. Escalate complex issues when necessary\n5. Follow up to ensure customer satisfaction"
                                : "Analyze the user-provided prompt for clarity and structure. Rewrite the prompt to ensure it has a clearly defined ROLE, INSTRUCTIONS, and GOAL..."
                            }
                            required={agentType === "single-task"}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Provider</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={formData.provider_id}
                                onChange={(e) => handleProviderChange(e.target.value)}
                            >
                                {Object.keys(modelsByProvider).map(provider => (
                                    <option key={provider} value={provider}>{provider}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Model</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={formData.model}
                                onChange={(e) => handleInputChange("model", e.target.value)}
                            >
                                {(modelsByProvider[formData.provider_id as keyof typeof modelsByProvider] || []).map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Temperature</label>
                            <Input
                                type="number"
                                min="0"
                                max="2"
                                step="0.1"
                                value={formData.temperature}
                                onChange={(e) => handleInputChange("temperature", parseFloat(e.target.value))}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Top P</label>
                            <Input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={formData.top_p}
                                onChange={(e) => handleInputChange("top_p", parseFloat(e.target.value))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">LLM Credential ID</label>
                        <Input
                            value={formData.llm_credential_id}
                            onChange={(e) => handleInputChange("llm_credential_id", e.target.value)}
                            placeholder="e.g., lyzr_openai"
                            readOnly
                            className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Auto-generated based on selected provider
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Tool {agentType === "single-task" && <span className="text-red-500">*</span>}
                        </label>
                        <Input
                            value={formData.tool}
                            onChange={(e) => handleInputChange("tool", e.target.value)}
                            placeholder={agentType === "single-task" ? "customer_support" : "Enter tool name (optional)"}
                            required={agentType === "single-task"}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Tool Usage Description</label>
                        <Input
                            value={formData.tool_usage_description}
                            onChange={(e) => handleInputChange("tool_usage_description", e.target.value)}
                            placeholder={agentType === "single-task"
                                ? "Handle customer inquiries and provide support"
                                : "{}"
                            }
                        />
                    </div>

                    {agentType === "single-task" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Examples</label>
                            <textarea
                                className="w-full min-h-[80px] p-3 border rounded-md resize-y"
                                value={formData.examples || ""}
                                onChange={(e) => handleInputChange("examples", e.target.value)}
                                placeholder="Example conversations or scenarios for the customer support agent..."
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? "Creating..." : "Create Agent"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
