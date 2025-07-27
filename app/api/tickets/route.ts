import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { ticket } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch tickets only for the authenticated user
    const userTickets = await db
      .select()
      .from(ticket)
      .where(eq(ticket.userId, session.user.id))
      .orderBy(desc(ticket.createdAt));

    return NextResponse.json({ tickets: userTickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, email, phone, priority = "medium" } = body;

    if (!title || !description || !email) {
      return NextResponse.json(
        { error: "Title, description, and email are required" },
        { status: 400 }
      );
    }

    // Create new ticket for the authenticated user
    const newTicket = await db
      .insert(ticket)
      .values({
        id: nanoid(),
        title,
        description,
        email,
        phone,
        priority,
        status: "open",
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ ticket: newTicket[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
