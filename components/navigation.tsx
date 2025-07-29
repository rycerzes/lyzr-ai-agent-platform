"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string | null;
}

interface NavigationProps {
  user?: User | null;
}

export function Navigation({ user }: NavigationProps) {
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/auth");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            Lyzr AI
          </Link>
          
          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/tickets"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Tickets
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium font-semibold"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <span className="text-sm text-gray-600">
              {user.name} {isAdmin && <span className="text-blue-600 font-medium">(Admin)</span>}
            </span>
          )}
          <Button onClick={handleSignOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
