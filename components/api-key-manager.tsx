"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ApiKeyManagerProps {
  onApiKeyChange?: (apiKey: string | null) => void;
}

export function ApiKeyManager({ onApiKeyChange }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const fetchApiKey = useCallback(async () => {
    try {
      const response = await fetch("/api/user/api-key");
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
        if (onApiKeyChange) {
          onApiKeyChange(data.apiKey);
        }
      }
    } catch (error) {
      console.error("Error fetching API key:", error);
    }
  }, [onApiKeyChange]);

  useEffect(() => {
    fetchApiKey();
  }, [fetchApiKey]);

  const generateNewApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/api-key", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
        if (onApiKeyChange) {
          onApiKeyChange(data.apiKey);
        }
        alert("New API key generated successfully!");
      } else {
        alert("Failed to generate API key");
      }
    } catch (error) {
      console.error("Error generating API key:", error);
      alert("Failed to generate API key");
    } finally {
      setLoading(false);
    }
  };

  const revokeApiKey = async () => {
    if (!window.confirm("Are you sure you want to revoke your API key? This will break any existing integrations.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/api-key", {
        method: "DELETE",
      });

      if (response.ok) {
        setApiKey(null);
        if (onApiKeyChange) {
          onApiKeyChange(null);
        }
        alert("API key revoked successfully!");
      } else {
        alert("Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      alert("Failed to revoke API key");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (apiKey) {
      try {
        await navigator.clipboard.writeText(apiKey);
        alert("API key copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy:", error);
        alert("Failed to copy API key");
      }
    }
  };

  const maskedKey = apiKey ? `${apiKey.substring(0, 12)}${"*".repeat(apiKey.length - 16)}${apiKey.slice(-4)}` : null;

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <h3 className="text-lg font-semibold mb-3 text-blue-900">🔑 API Key Management</h3>
      
      {apiKey ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your API Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm border">
                {showKey ? apiKey : maskedKey}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowKey(!showKey)}
                className="text-xs"
              >
                {showKey ? "👁️" : "👁️‍🗨️"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="text-xs"
              >
                📋 Copy
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Use this API key to authenticate requests to the tickets API
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <h4 className="font-medium text-yellow-800 mb-2">🛡️ API Usage Examples</h4>
            <div className="text-xs text-yellow-700 space-y-1">
              <div><strong>GET tickets:</strong> <code>GET /api/tickets?api_key={apiKey?.substring(0, 12)}...</code></div>
              <div><strong>POST ticket:</strong> <code>POST /api/tickets</code> with header <code>x-api-key: {apiKey?.substring(0, 12)}...</code></div>
              <div><strong>PUT ticket:</strong> <code>PUT /api/tickets/[id]</code> with API key</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateNewApiKey}
              disabled={loading}
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              {loading ? "⏳" : "🔄"} Regenerate Key
            </Button>
            <Button
              onClick={revokeApiKey}
              disabled={loading}
              variant="destructive"
              size="sm"
            >
              {loading ? "⏳" : "🗑️"} Revoke Key
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="text-gray-600">
            <p className="mb-2">No API key generated yet.</p>
            <p className="text-sm">Generate an API key to access the tickets API programmatically.</p>
          </div>
          <Button
            onClick={generateNewApiKey}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "⏳ Generating..." : "🔑 Generate API Key"}
          </Button>
        </div>
      )}
    </Card>
  );
}
