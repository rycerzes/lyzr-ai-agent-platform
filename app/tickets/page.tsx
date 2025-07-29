"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/ticket-card";
import { CreateTicketForm } from "@/components/create-ticket-form";
import { ApiKeyManager } from "@/components/api-key-manager";
import { Navigation } from "@/components/navigation";

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Loading tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Support Tickets</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user?.name || user?.email}! Manage your support requests below.
            </p>
          </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showCreateForm ? "Cancel" : "Create New Ticket"}
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <Button
          onClick={() => setShowApiDocs(!showApiDocs)}
          variant="outline"
          className="w-full flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            🔑 API Access & Documentation
          </span>
          <span className={`transform transition-transform ${showApiDocs ? 'rotate-180' : ''}`}>
            ↓
          </span>
        </Button>

        {showApiDocs && (
          <div className="mt-4 space-y-4">
            <ApiKeyManager onApiKeyChange={setUserApiKey} />

            {userApiKey && (
              <div className="p-6 bg-slate-50 border-slate-200 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">📖 API Documentation</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-slate-700">🔗 Endpoints</h4>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-3 rounded border">
                        <code className="text-green-600 font-semibold">GET</code> <code>/api/tickets</code>
                        <p className="text-gray-600 mt-1">Get all your tickets</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <code className="text-blue-600 font-semibold">POST</code> <code>/api/tickets</code>
                        <p className="text-gray-600 mt-1">Create a new ticket</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <code className="text-orange-600 font-semibold">PUT</code> <code>/api/tickets/[id]</code>
                        <p className="text-gray-600 mt-1">Update a ticket</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <code className="text-red-600 font-semibold">DELETE</code> <code>/api/tickets/[id]</code>
                        <p className="text-gray-600 mt-1">Delete a ticket</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 text-slate-700">🧩 Example Usage</h4>
                    <div className="bg-black text-green-400 p-4 rounded text-xs font-mono overflow-x-auto">
                      <div className="mb-3">
                        <div className="text-gray-400"># Create a ticket</div>
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
                        <div className="text-gray-400"># Get all tickets</div>
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
      </Card>

      {showCreateForm && (
        <CreateTicketForm
          onSubmit={handleCreateTicket}
          onCancel={() => setShowCreateForm(false)}
          loading={formLoading}
        />
      )}

      {tickets.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <h3 className="text-lg font-medium mb-2">No tickets yet</h3>
            <p>Create your first support ticket to get started.</p>
          </div>
        </Card>
      ) : (
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
      )}
      </div>
    </div>
  );
}
