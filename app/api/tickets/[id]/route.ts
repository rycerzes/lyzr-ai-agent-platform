import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { ticket, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateUser(request);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: authenticatedUser, isApiAuth } = authResult;

    // Fetch ticket only if it belongs to the authenticated user
    const userTicket = await db
      .select()
      .from(ticket)
      .where(and(eq(ticket.id, params.id), eq(ticket.userId, authenticatedUser.id)))
      .limit(1);

    if (userTicket.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const response = { ticket: userTicket[0] };
    
    // Include user info for API authentication
    if (isApiAuth) {
      return NextResponse.json({ 
        ...response,
        user: authenticatedUser 
      });
    }

    return NextResponse.json(response);
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
    const authResult = await authenticateUser(request);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: authenticatedUser, isApiAuth } = authResult;

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
      .where(and(eq(ticket.id, params.id), eq(ticket.userId, authenticatedUser.id)))
      .returning();

    if (updatedTicket.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const response = { ticket: updatedTicket[0] };
    
    // Include user info for API authentication
    if (isApiAuth) {
      return NextResponse.json({ 
        ...response,
        user: authenticatedUser 
      });
    }

    return NextResponse.json(response);
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
    const authResult = await authenticateUser(request);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: authenticatedUser, isApiAuth } = authResult;

    // Delete ticket only if it belongs to the authenticated user
    const deletedTicket = await db
      .delete(ticket)
      .where(and(eq(ticket.id, params.id), eq(ticket.userId, authenticatedUser.id)))
      .returning();

    if (deletedTicket.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const response = { message: "Ticket deleted successfully" };
    
    // Include user info for API authentication
    if (isApiAuth) {
      return NextResponse.json({ 
        ...response,
        user: authenticatedUser 
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
