"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trainPdfDocument, trainDocxDocument, trainTxtDocument } from "@/lib/lyzr-api";

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    ragConfig: any;
}

type FileType = 'pdf' | 'docx' | 'txt';

export function DocumentUploadModal({ isOpen, onClose, apiKey, ragConfig }: DocumentUploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<FileType>('pdf');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB");
                return;
            }

            // Validate file type
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (!['pdf', 'docx', 'txt'].includes(extension || '')) {
                setError("Please select a PDF, DOCX, or TXT file");
                return;
            }

            setSelectedFile(file);
            setError("");
            setSuccess("");

            // Auto-detect file type
            if (extension === 'pdf') setFileType('pdf');
            else if (extension === 'docx') setFileType('docx');
            else if (extension === 'txt') setFileType('txt');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Please select a file");
            return;
        }

        const ragId = ragConfig.id || ragConfig._id;
        if (!ragId) {
            setError("RAG configuration ID not found");
            return;
        }

        setUploading(true);
        setError("");
        setSuccess("");

        try {
            let response;
            switch (fileType) {
                case 'pdf':
                    response = await trainPdfDocument(apiKey, ragId, selectedFile);
                    break;
                case 'docx':
                    response = await trainDocxDocument(apiKey, ragId, selectedFile);
                    break;
                case 'txt':
                    response = await trainTxtDocument(apiKey, ragId, selectedFile);
                    break;
                default:
                    throw new Error("Unsupported file type");
            }

            // Handle the enhanced response structure with both parse and upload results
            const documentCount = response.documents ? response.documents.length : response.document_count;
            const message = response.message || "Document processed successfully";
            const responseRagId = response.rag_id || ragId;

            // Check if upload was successful
            const uploadSuccess = response.upload_result ? "✅ Successfully uploaded to RAG for training" : "⚠️ Parsed but upload status unclear";

            setSuccess(`${message}. Generated ${documentCount || 'N/A'} text chunks and uploaded to RAG configuration ${responseRagId}. ${uploadSuccess}`);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            setError(err.message || "Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setError("");
        setSuccess("");
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Parse & Train Document</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={uploading}
                    >
                        ×
                    </Button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        Parse and train documents for: <strong>{ragConfig.collection_name}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        RAG ID: {ragConfig.id || ragConfig._id}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        📄 Documents will be parsed then uploaded to RAG for training
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Supported formats: PDF, DOCX, TXT (max 10MB each)
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                        <div className="font-medium">✅ Upload Successful!</div>
                        <div className="text-sm mt-1">{success}</div>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Select File Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['pdf', 'docx', 'txt'] as FileType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFileType(type)}
                                    className={`p-3 text-sm rounded-lg border-2 transition-colors ${fileType === type
                                            ? 'bg-blue-50 border-blue-600 text-blue-700'
                                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                        }`}
                                    disabled={uploading}
                                >
                                    <div className="font-semibold">{type.toUpperCase()}</div>
                                    <div className="text-xs mt-1">
                                        {type === 'pdf' && 'Adobe PDF Documents'}
                                        {type === 'docx' && 'Word Documents'}
                                        {type === 'txt' && 'Plain Text Files'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {type === 'pdf' && 'Parser: llmsherpa'}
                                        {type === 'docx' && 'Parser: docx2txt'}
                                        {type === 'txt' && 'Parser: txt_parser'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Choose File
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={
                                fileType === 'pdf' ? '.pdf' :
                                    fileType === 'docx' ? '.docx' :
                                        '.txt'
                            }
                            onChange={handleFileSelect}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            disabled={uploading}
                        />
                        {selectedFile && (
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFile}
                                    disabled={uploading}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={uploading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={uploading || !selectedFile}
                            className="flex-1"
                        >
                            {uploading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Parsing & Training...
                                </div>
                            ) : "Parse & Train Document"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
