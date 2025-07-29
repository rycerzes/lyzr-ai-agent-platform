"use client";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithAgent, ChatRequest } from "@/lib/lyzr-api";
import { authClient } from "@/lib/auth-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessage {
    id: string;
    type: 'user' | 'agent';
    message: string;
    timestamp: Date;
}

interface Agent {
    _id?: string;
    id?: string;
    name: string;
    description: string;
}

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: Agent;
    apiKey: string;
}

export function ChatModal({ isOpen, onClose, agent, apiKey }: ChatModalProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [userEmail, setUserEmail] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get user session when modal opens
    useEffect(() => {
        const getUserSession = async () => {
            if (isOpen) {
                try {
                    const session = await authClient.getSession();
                    if (session?.data?.user?.email) {
                        setUserEmail(session.data.user.email);
                    }
                } catch (error) {
                    console.error("Failed to get user session:", error);
                }
            }
        };
        getUserSession();
    }, [isOpen]);

    // Generate session ID when modal opens
    useEffect(() => {
        if (isOpen && !sessionId) {
            const agentId = agent._id || agent.id;
            // Generate random 10-character suffix
            const randomSuffix = Math.random().toString(36).substring(2, 12);
            setSessionId(`${agentId}-${randomSuffix}`);
        }
    }, [isOpen, agent, sessionId]);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const generateMessageId = () => {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading || !sessionId || !userEmail) return;

        const userMessage: ChatMessage = {
            id: generateMessageId(),
            type: 'user',
            message: inputMessage.trim(),
            timestamp: new Date(),
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMessage]);
        setInputMessage("");
        setIsLoading(true);
        setIsTyping(true);

        try {
            const agentId = agent._id || agent.id;
            if (!agentId) {
                throw new Error("Agent ID not found");
            }

            const chatRequest: ChatRequest = {
                user_id: userEmail, // Use authenticated user's email
                agent_id: agentId,
                session_id: sessionId,
                message: userMessage.message,
                system_prompt_variables: {},
                filter_variables: {},
                features: [],
                assets: [],
            };

            const response = await chatWithAgent(apiKey, chatRequest);

            // Show response immediately
            setIsTyping(false);

            const agentMessage: ChatMessage = {
                id: generateMessageId(),
                type: 'agent',
                message: response.response || response.agent_response || "I'm sorry, I couldn't process your request.",
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, agentMessage]);
            setIsLoading(false);

        } catch (error: any) {
            setIsTyping(false);
            setIsLoading(false);

            const errorMessage: ChatMessage = {
                id: generateMessageId(),
                type: 'agent',
                message: `Error: ${error.message || "Failed to send message. Please try again."}`,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClose = () => {
        setMessages([]);
        setInputMessage("");
        setSessionId("");
        setUserEmail("");
        onClose();
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-blue-50 rounded-t-lg">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{agent.name}</h3>
                            <p className="text-sm text-gray-600">{agent.description}</p>
                            {sessionId && (
                                <p className="text-xs text-gray-400 mt-1">Session: {sessionId}</p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </Button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                💬
                            </div>
                            <p>Start a conversation with {agent.name}</p>
                            <p className="text-sm mt-1">Type a message below to begin chatting!</p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}
                            >
                                {message.type === 'agent' ? (
                                    <div className="text-sm prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-900 prose-strong:text-gray-900 prose-code:text-gray-900 prose-pre:bg-gray-200 prose-pre:text-gray-900">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                // Customize code blocks
                                                code: ({ children, className, ...props }: any) => {
                                                    const isInline = !className?.includes('language-');
                                                    if (isInline) {
                                                        return (
                                                            <code
                                                                className="bg-gray-200 text-gray-900 px-1 py-0.5 rounded text-xs"
                                                                {...props}
                                                            >
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                    return (
                                                        <pre className="bg-gray-200 text-gray-900 p-2 rounded text-xs overflow-x-auto">
                                                            <code {...props}>{children}</code>
                                                        </pre>
                                                    );
                                                },
                                                // Customize links
                                                a: ({ children, href, ...props }: any) => (
                                                    <a
                                                        href={href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 underline"
                                                        {...props}
                                                    >
                                                        {children}
                                                    </a>
                                                ),
                                                // Customize lists
                                                ul: ({ children, ...props }: any) => (
                                                    <ul className="list-disc list-inside space-y-1" {...props}>
                                                        {children}
                                                    </ul>
                                                ),
                                                ol: ({ children, ...props }: any) => (
                                                    <ol className="list-decimal list-inside space-y-1" {...props}>
                                                        {children}
                                                    </ol>
                                                ),
                                                // Customize tables
                                                table: ({ children, ...props }: any) => (
                                                    <div className="overflow-x-auto">
                                                        <table className="border-collapse border border-gray-300 text-xs" {...props}>
                                                            {children}
                                                        </table>
                                                    </div>
                                                ),
                                                th: ({ children, ...props }: any) => (
                                                    <th className="border border-gray-300 bg-gray-200 px-2 py-1 text-left" {...props}>
                                                        {children}
                                                    </th>
                                                ),
                                                td: ({ children, ...props }: any) => (
                                                    <td className="border border-gray-300 px-2 py-1" {...props}>
                                                        {children}
                                                    </td>
                                                ),
                                            }}
                                        >
                                            {message.message}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                )}
                                <p
                                    className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                                        }`}
                                >
                                    {formatTime(message.timestamp)}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
                                <div className="flex items-center space-x-1">
                                    <div className="text-sm text-gray-600">{agent.name} is typing</div>
                                    <div className="flex space-x-1">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                    <div className="flex items-center space-x-2">
                        <Input
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={`Message ${agent.name}...`}
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isLoading || !userEmail}
                            className="bg-blue-600 hover:bg-blue-700 px-6"
                        >
                            {isLoading ? '...' : 'Send'}
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {!userEmail ? "Authenticating..." : "Press Enter to send, Shift+Enter for new line"}
                    </p>
                </div>
            </div>
        </div>
    );
}
