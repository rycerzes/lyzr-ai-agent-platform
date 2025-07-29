"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason?: string;
  banExpires?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserListResponse {
  users: User[];
  total: number;
  limit?: number;
  offset?: number;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [searchField, setSearchField] = useState<"email" | "name">("name");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    name: "",
    role: "user" as "user" | "admin",
  });
  const [showCreateUser, setShowCreateUser] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authClient.admin.listUsers({
        query: {
          searchValue: searchValue || undefined,
          searchField,
          limit,
          offset,
        },
      });
      
      if (response.data) {
        const userData = response.data as UserListResponse;
        setUsers(userData.users);
        setTotal(userData.total);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [searchValue, searchField, limit, offset]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    try {
      await authClient.admin.createUser({
        email: newUserData.email,
        password: newUserData.password,
        name: newUserData.name,
        role: newUserData.role,
      });
      
      setNewUserData({ email: "", password: "", name: "", role: "user" as "user" | "admin" });
      setShowCreateUser(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user");
    }
  };

  const handleSetRole = async (userId: string, role: string) => {
    try {
      await authClient.admin.setRole({
        userId,
        role: role as "user" | "admin",
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to set role:", error);
      alert("Failed to set role");
    }
  };

  const handleBanUser = async (userId: string, banReason?: string) => {
    try {
      await authClient.admin.banUser({
        userId,
        banReason: banReason || "No reason provided",
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to ban user:", error);
      alert("Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await authClient.admin.unbanUser({
        userId,
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to unban user:", error);
      alert("Failed to unban user");
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const goToPage = (page: number) => {
    setOffset((page - 1) * limit);
  };

  if (loading && users.length === 0) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Create User Section */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="Search users..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full md:w-64"
            />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as "email" | "name")}
              className="border rounded px-3 py-2"
            >
              <option value="name">Search by Name</option>
              <option value="email">Search by Email</option>
            </select>
          </div>
          <Button onClick={() => setShowCreateUser(!showCreateUser)}>
            {showCreateUser ? "Cancel" : "Create User"}
          </Button>
        </div>

        {/* Create User Form */}
        {showCreateUser && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
              />
              <Input
                placeholder="Name"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
              />
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as "user" | "admin" })}
                className="border rounded px-3 py-2"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button onClick={handleCreateUser} className="mt-4">
              Create User
            </Button>
          </div>
        )}
      </Card>

      {/* Users Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Users ({total} total)</h2>
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setOffset(0);
              }}
              className="border rounded px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleSetRole(user.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.banned ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                        Banned
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex gap-2">
                      {user.banned ? (
                        <Button
                          onClick={() => handleUnbanUser(user.id)}
                          size="sm"
                          variant="outline"
                        >
                          Unban
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            const reason = prompt("Reason for ban:");
                            if (reason !== null) {
                              handleBanUser(user.id, reason);
                            }
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Ban
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} users
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
