"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateTicketFormProps {
  onSubmit: (formData: {
    title: string;
    description: string;
    email: string;
    phone: string;
    priority: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function CreateTicketForm({ onSubmit, onCancel, loading }: CreateTicketFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    email: "",
    phone: "",
    priority: "medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      title: "",
      description: "",
      email: "",
      phone: "",
      priority: "medium",
    });
  };

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Create New Support Ticket</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            placeholder="Brief description of your issue"
            className="focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            placeholder="Please provide a detailed description of your issue, including any error messages or steps to reproduce the problem"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Contact Email <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            placeholder="your.email@example.com"
            className="focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            We'll use this email to contact you about your ticket
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Phone Number (Optional)
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="+1 (555) 123-4567"
            className="focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            For urgent issues that may require immediate callback
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Priority Level</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value })
            }
          >
            <option value="low">🟢 Low - General question or minor issue</option>
            <option value="medium">🟡 Medium - Standard support request</option>
            <option value="high">🟠 High - Important functionality affected</option>
            <option value="urgent">🔴 Urgent - Critical system down</option>
          </select>
        </div>
        
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Creating Ticket...
              </>
            ) : (
              "🎫 Create Ticket"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
