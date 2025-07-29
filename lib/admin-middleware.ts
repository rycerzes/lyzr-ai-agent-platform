import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return session;
}

export async function checkAdminPermission() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user?.role === "admin";
}
