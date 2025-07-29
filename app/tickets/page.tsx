"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/ticket-card";
import { CreateTicketForm } from "@/components/create-ticket-form";
import { ApiKeyManager } from "@/components/api-key-manager";
import { Navigation } from "@/components/navigation";
import { Plus, Ticket, Key, ChevronDown, ChevronUp, Code, FileText, Sparkles } from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  email: string;
  phone?: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [showApiDocs, setShowApiDocs] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await authClient.getSession();
      if (!session?.data?.user) {
        // Redirect to auth page if not authenticated
        window.location.href = "/auth";
        return;
      }
      setUser(session.data.user);
      fetchTickets();
    } catch (error) {
      console.error("Auth check failed:", error);
      window.location.href = "/auth";
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets");
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth";
          return;
        }
        throw new Error("Failed to fetch tickets");
      }
      const data = await response.json();
      setTickets(data.tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      alert("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (formData: {
    title: string;
    description: string;
    email: string;
    phone: string;
    priority: string;
  }) => {
    setFormLoading(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create ticket");
      }

      const data = await response.json();
      setTickets([data.ticket, ...tickets]);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to create ticket");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update ticket");
      }

      const data = await response.json();
      setTickets(
        tickets.map((ticket) =>
          ticket.id === ticketId ? data.ticket : ticket
        )
      );
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket");
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete ticket");
      }

      setTickets(tickets.filter((ticket) => ticket.id !== ticketId));
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Failed to delete ticket");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Navigation user={user} />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">Loading tickets...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation user={user} />
      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <Ticket className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Welcome back, {user?.name || user?.email}! Manage your support requests below.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm border-0 rounded-xl px-6 py-3 transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showCreateForm ? "Cancel" : "Create New Ticket"}
              </Button>
            </div>
          </div>

          {/* API Documentation Section */}
          <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <Button
                onClick={() => setShowApiDocs(!showApiDocs)}
                variant="outline"
                className="w-full flex items-center justify-between rounded-xl border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 p-4"
              >
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <span className="font-medium text-gray-900 dark:text-white">API Access & Documentation</span>
                </div>
                {showApiDocs ? (
                  <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                )}
              </Button>

              {showApiDocs && (
                <div className="mt-6 space-y-6">
                  <ApiKeyManager onApiKeyChange={setUserApiKey} />

                  {userApiKey && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
                      <div className="flex items-center space-x-3 mb-6">
                        <FileText className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Documentation</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Endpoints
                          </h4>
                          <div className="space-y-3">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded text-xs font-semibold">GET</span>
                                <code className="text-sm font-mono text-gray-900 dark:text-white">/api/tickets</code>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">Get all your tickets</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded text-xs font-semibold">POST</span>
                                <code className="text-sm font-mono text-gray-900 dark:text-white">/api/tickets</code>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">Create a new ticket</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 px-2 py-1 rounded text-xs font-semibold">PUT</span>
                                <code className="text-sm font-mono text-gray-900 dark:text-white">/api/tickets/[id]</code>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">Update a ticket</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded text-xs font-semibold">DELETE</span>
                                <code className="text-sm font-mono text-gray-900 dark:text-white">/api/tickets/[id]</code>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">Delete a ticket</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Example Usage
                          </h4>
                          <div className="bg-black dark:bg-slate-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-200 dark:border-slate-600">
                            <div className="mb-4">
                              <div className="text-gray-400 mb-1"># Create a ticket</div>
                              <div>curl -X POST \</div>
                              <div className="ml-2">-H "x-api-key: {userApiKey}" \</div>
                              <div className="ml-2">-H "Content-Type: application/json" \</div>
                              <div className="ml-2">-d '{`{`}</div>
                              <div className="ml-4">"title": "Bug Report",</div>
                              <div className="ml-4">"description": "Login issue",</div>
                              <div className="ml-4">"email": "user@example.com",</div>
                              <div className="ml-4">"priority": "high"</div>
                              <div className="ml-2">{`}`}' \</div>
                              <div className="ml-2">{typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/api/tickets</div>
                            </div>

                            <div>
                              <div className="text-gray-400 mb-1"># Get all tickets</div>
                              <div>curl -H "x-api-key: {userApiKey}" \</div>
                              <div className="ml-2">{typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/api/tickets</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Create Ticket Form */}
          {showCreateForm && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <CreateTicketForm
                onSubmit={handleCreateTicket}
                onCancel={() => setShowCreateForm(false)}
                loading={formLoading}
              />
            </div>
          )}

          {/* Tickets Section */}
          {tickets.length === 0 ? (
            <Card className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <Ticket className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first support ticket to get started.</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ticket
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Tickets ({tickets.length})
                </h2>
              </div>
              <div className="grid gap-4">
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onStatusUpdate={handleUpdateStatus}
                    onDelete={handleDeleteTicket}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
