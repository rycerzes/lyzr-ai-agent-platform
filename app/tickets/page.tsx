"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/ticket-card";
import { CreateTicketForm } from "@/components/create-ticket-form";

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
  );
}
