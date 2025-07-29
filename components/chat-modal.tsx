"use client";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithAgent, ChatRequest } from "@/lib/lyzr-api";
import { authClient } from "@/lib/auth-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, X, MessageCircle, Bot } from "lucide-react";

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl h-[600px] flex flex-col border border-slate-200 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-2xl">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                            <Bot className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{agent.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
                            {sessionId && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">Session: {sessionId.substring(0, 16)}...</p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl h-10 w-10 p-0"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 mt-16">
                            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <MessageCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start a conversation with {agent.name}</h4>
                            <p className="text-sm">Type a message below to begin chatting!</p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${message.type === 'user'
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                        : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                {message.type === 'agent' ? (
                                    <div className="text-sm prose prose-sm max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-900 dark:prose-p:text-white prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-gray-900 dark:prose-code:text-white prose-pre:bg-gray-100 dark:prose-pre:bg-slate-700 prose-pre:text-gray-900 dark:prose-pre:text-white">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                // Customize code blocks
                                                code: ({ children, className, ...props }: any) => {
                                                    const isInline = !className?.includes('language-');
                                                    if (isInline) {
                                                        return (
                                                            <code
                                                                className="bg-slate-100 dark:bg-slate-700 text-gray-900 dark:text-white px-2 py-1 rounded-md text-xs font-mono"
                                                                {...props}
                                                            >
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                    return (
                                                        <pre className="bg-slate-100 dark:bg-slate-700 text-gray-900 dark:text-white p-3 rounded-xl text-xs overflow-x-auto border border-slate-200 dark:border-slate-600">
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
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                                                        {...props}
                                                    >
                                                        {children}
                                                    </a>
                                                ),
                                                // Customize lists
                                                ul: ({ children, ...props }: any) => (
                                                    <ul className="list-disc list-inside space-y-1 text-gray-900 dark:text-white" {...props}>
                                                        {children}
                                                    </ul>
                                                ),
                                                ol: ({ children, ...props }: any) => (
                                                    <ol className="list-decimal list-inside space-y-1 text-gray-900 dark:text-white" {...props}>
                                                        {children}
                                                    </ol>
                                                ),
                                                // Customize tables
                                                table: ({ children, ...props }: any) => (
                                                    <div className="overflow-x-auto">
                                                        <table className="border-collapse border border-slate-300 dark:border-slate-600 text-xs rounded-lg overflow-hidden" {...props}>
                                                            {children}
                                                        </table>
                                                    </div>
                                                ),
                                                th: ({ children, ...props }: any) => (
                                                    <th className="border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-3 py-2 text-left font-medium" {...props}>
                                                        {children}
                                                    </th>
                                                ),
                                                td: ({ children, ...props }: any) => (
                                                    <td className="border border-slate-300 dark:border-slate-600 px-3 py-2" {...props}>
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
                                    className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
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
                            <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 max-w-[85%] shadow-sm border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center space-x-3">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{agent.name} is typing</div>
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800 rounded-b-2xl">
                    <div className="flex items-center space-x-3">
                        <div className="flex-1 relative">
                            <Input
                                ref={inputRef}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={`Message ${agent.name}...`}
                                disabled={isLoading}
                                className="pr-12 rounded-xl border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50 dark:bg-slate-700"
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isLoading || !userEmail}
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-lg h-8 w-8 p-0 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center justify-center">
                        {!userEmail ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                Authenticating...
                            </span>
                        ) : (
                            "Press Enter to send, Shift+Enter for new line"
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
