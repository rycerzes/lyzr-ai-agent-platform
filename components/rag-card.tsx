"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteRagConfig } from "@/lib/lyzr-api";
import { useState } from "react";
import { DocumentUploadModal } from "./document-upload-modal";

interface RagCardProps {
    ragConfig: any;
    apiKey: string;
    onRagDeleted: (configId: string) => void;
}

export function RagCard({ ragConfig, apiKey, onRagDeleted }: RagCardProps) {
    const [deleting, setDeleting] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this knowledge base?")) {
            return;
        }

        setDeleting(true);
        const configId = ragConfig._id;
        try {
            await deleteRagConfig(apiKey, configId);
            onRagDeleted(configId);
        } catch (error) {
            console.error("Failed to delete RAG config:", error);
            alert("Failed to delete knowledge base");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <Card
                className="p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setShowUploadModal(true)}
            >
                <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                        <h3 className="font-semibold">{ragConfig.collection_name}</h3>
                        {ragConfig.description && (
                            <p className="text-sm text-gray-600">{ragConfig.description}</p>
                        )}
                        <div className="text-xs text-gray-500 space-y-1">
                            <div>ID: {ragConfig._id}</div>
                            <div>LLM Model: {ragConfig.llm_model}</div>
                            <div>Embedding Model: {ragConfig.embedding_model}</div>
                            <div>Vector Store: {ragConfig.vector_store_provider}</div>
                            <div>User ID: {ragConfig.user_id}</div>
                            <div>Created: {new Date(ragConfig.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                            Click to parse & train documents
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowUploadModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        Parse & Train Documents
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        disabled={deleting}
                        className="text-red-600 hover:text-red-700"
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            </Card>

            <DocumentUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                apiKey={apiKey}
                ragConfig={ragConfig}
            />
        </>
    );
}
