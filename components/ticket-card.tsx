"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

interface TicketCardProps {
  ticket: Ticket;
  onStatusUpdate: (ticketId: string, newStatus: string) => void;
  onDelete: (ticketId: string) => void;
}

export function TicketCard({ ticket, onStatusUpdate, onDelete }: TicketCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      onDelete(ticket.id);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{ticket.title}</h3>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                ticket.status
              )}`}
            >
              {ticket.status.replace("_", " ")}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(
                ticket.priority
              )}`}
            >
              {ticket.priority}
            </span>
          </div>
          <p className="text-gray-600 mb-2">{ticket.description}</p>
          <div className="text-sm text-gray-500 space-y-1">
            <div>📧 {ticket.email}</div>
            {ticket.phone && <div>📞 {ticket.phone}</div>}
            <div>📅 Created: {new Date(ticket.createdAt).toLocaleDateString()}</div>
            <div className="text-xs opacity-75">ID: {ticket.id}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          {ticket.status !== "closed" && (
            <select
              className="text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={ticket.status}
              onChange={(e) => onStatusUpdate(ticket.id, e.target.value)}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="text-xs"
          >
            🗑️ Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
