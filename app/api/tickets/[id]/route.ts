import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { ticket } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch ticket only if it belongs to the authenticated user
    const userTicket = await db
      .select()
      .from(ticket)
      .where(and(eq(ticket.id, params.id), eq(ticket.userId, session.user.id)))
      .limit(1);

    if (userTicket.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket: userTicket[0] });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, email, phone, status, priority } = body;

    // Update ticket only if it belongs to the authenticated user
    const updatedTicket = await db
      .update(ticket)
      .set({
        ...(title && { title }),
        ...(description && { description }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(status && { status }),
        ...(priority && { priority }),
        updatedAt: new Date(),
      })
      .where(and(eq(ticket.id, params.id), eq(ticket.userId, session.user.id)))
      .returning();

    if (updatedTicket.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket: updatedTicket[0] });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete ticket only if it belongs to the authenticated user
    const deletedTicket = await db
      .delete(ticket)
      .where(and(eq(ticket.id, params.id), eq(ticket.userId, session.user.id)))
      .returning();

    if (deletedTicket.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
