import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { ticket, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

async function authenticateApiKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith('tk_')) {
    return null;
  }

  const userRecord = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.apiKey, apiKey))
    .limit(1);

  return userRecord.length > 0 ? userRecord[0] : null;
}

async function authenticateUser(request: NextRequest) {
  // Try API key authentication first
  const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('api_key');
  
  if (apiKey) {
    const apiUser = await authenticateApiKey(apiKey);
    if (apiUser) {
      return { user: apiUser, isApiAuth: true };
    }
  }

  // Fall back to session authentication
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session?.user) {
      return { user: session.user, isApiAuth: false };
    }
  } catch (error) {
    console.error("Session auth error:", error);
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: authenticatedUser, isApiAuth } = authResult;

    // Fetch tickets only for the authenticated user
    const userTickets = await db
      .select()
      .from(ticket)
      .where(eq(ticket.userId, authenticatedUser.id))
      .orderBy(desc(ticket.createdAt));

    const response = { tickets: userTickets };
    
    // Include user info for API authentication
    if (isApiAuth) {
      return NextResponse.json({ 
        ...response,
        user: authenticatedUser 
      });
    }

    return NextResponse.json(response);
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
    const authResult = await authenticateUser(request);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: authenticatedUser, isApiAuth } = authResult;

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
        userId: authenticatedUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const response = { ticket: newTicket[0] };
    
    // Include user info for API authentication
    if (isApiAuth) {
      return NextResponse.json({ 
        ...response,
        user: authenticatedUser 
      }, { status: 201 });
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
