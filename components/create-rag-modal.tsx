"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createRagConfig } from "@/lib/lyzr-api";

// Utility functions for managing RAG config IDs in localStorage (deprecated - now using API)
const getRagConfigIds = (): string[] => {
    return JSON.parse(localStorage.getItem("lyzr-rag-config-ids") || "[]");
};

const addRagConfigId = (configId: string): void => {
    const ids = getRagConfigIds();
    if (!ids.includes(configId)) {
        ids.push(configId);
        localStorage.setItem("lyzr-rag-config-ids", JSON.stringify(ids));
    }
};

interface CreateRagModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    onRagCreated: () => void;
}

export function CreateRagModal({ isOpen, onClose, apiKey, onRagCreated }: CreateRagModalProps) {
    const [formData, setFormData] = useState({
        collection_name: "",
        description: "",
        user_id: "sk-default-KFRWicY3Zv60uidXF7wG6fd7XqiWWnDi",
        llm_credential_id: "lyzr_openai",
        embedding_credential_id: "lyzr_openai",
        vector_db_credential_id: "lyzr_qdrant",
        llm_model: "gpt-4o-mini",
        embedding_model: "text-embedding-ada-002",
        vector_store_provider: "Qdrant [Lyzr]",
        semantic_data_model: false,
        meta_data: {}
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.collection_name.trim()) {
            setError("Please fill in collection name");
            return;
        }

        setCreating(true);
        setError("");

        try {
            const response = await createRagConfig(apiKey, formData);
            // No longer need to store in localStorage since we fetch from API
            onRagCreated();
            onClose();
            // Reset form
            setFormData({
                collection_name: "",
                description: "",
                user_id: "sk-default-KFRWicY3Zv60uidXF7wG6fd7XqiWWnDi",
                llm_credential_id: "lyzr_openai",
                embedding_credential_id: "lyzr_openai",
                vector_db_credential_id: "lyzr_qdrant",
                llm_model: "gpt-4o-mini",
                embedding_model: "text-embedding-ada-002",
                vector_store_provider: "Qdrant [Lyzr]",
                semantic_data_model: false,
                meta_data: {}
            });
        } catch (err: any) {
            setError(err.message || "Failed to create knowledge base");
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Create Knowledge Base</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={creating}
                    >
                        ×
                    </Button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Collection Name *
                        </label>
                        <Input
                            value={formData.collection_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, collection_name: e.target.value }))}
                            placeholder="Enter collection name"
                            disabled={creating}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Description
                        </label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter description (optional)"
                            disabled={creating}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            LLM Model
                        </label>
                        <select
                            value={formData.llm_model}
                            onChange={(e) => setFormData(prev => ({ ...prev, llm_model: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            disabled={creating}
                        >
                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Embedding Model
                        </label>
                        <select
                            value={formData.embedding_model}
                            onChange={(e) => setFormData(prev => ({ ...prev, embedding_model: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            disabled={creating}
                        >
                            <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                            <option value="text-embedding-3-small">text-embedding-3-small</option>
                            <option value="text-embedding-3-large">text-embedding-3-large</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Vector Store Provider
                        </label>
                        <select
                            value={formData.vector_store_provider}
                            onChange={(e) => {
                                const provider = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    vector_store_provider: provider,
                                    vector_db_credential_id: provider === "Qdrant [Lyzr]" ? "lyzr_qdrant" : "lyzr_weaviate"
                                }));
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            disabled={creating}
                        >
                            <option value="Qdrant [Lyzr]">Qdrant [Lyzr]</option>
                            <option value="Weaviate [Lyzr]">Weaviate [Lyzr]</option>
                        </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={creating}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating}
                            className="flex-1"
                        >
                            {creating ? "Creating..." : "Create Knowledge Base"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
