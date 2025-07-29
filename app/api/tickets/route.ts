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

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Get all tickets for authenticated user
 *     description: Retrieves all tickets belonging to the authenticated user. Supports both API key and session authentication.
 *     tags:
 *       - Tickets
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiKeyQuery: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tickets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 *                 user:
 *                   type: object
 *                   description: User information (only included for API key authentication)
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *             examples:
 *               session_auth:
 *                 summary: Session authentication response
 *                 value:
 *                   tickets:
 *                     - id: "abc123"
 *                       title: "Login issue"
 *                       description: "Cannot log in"
 *                       email: "user@example.com"
 *                       phone: "+1234567890"
 *                       status: "open"
 *                       priority: "medium"
 *                       userId: "user123"
 *                       createdAt: "2024-01-01T12:00:00Z"
 *                       updatedAt: "2024-01-01T12:00:00Z"
 *               api_key_auth:
 *                 summary: API key authentication response
 *                 value:
 *                   tickets:
 *                     - id: "abc123"
 *                       title: "Login issue"
 *                       description: "Cannot log in"
 *                       email: "user@example.com"
 *                       phone: "+1234567890"
 *                       status: "open"
 *                       priority: "medium"
 *                       userId: "user123"
 *                       createdAt: "2024-01-01T12:00:00Z"
 *                       updatedAt: "2024-01-01T12:00:00Z"
 *                   user:
 *                     id: "user123"
 *                     name: "John Doe"
 *                     email: "john@example.com"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
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

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Create a new ticket
 *     description: Creates a new support ticket for the authenticated user. Supports both API key and session authentication.
 *     tags:
 *       - Tickets
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiKeyQuery: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTicketRequest'
 *           example:
 *             title: "Unable to access dashboard"
 *             description: "I'm getting a 403 error when trying to access the main dashboard"
 *             email: "user@example.com"
 *             phone: "+1234567890"
 *             priority: "high"
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   $ref: '#/components/schemas/Ticket'
 *                 user:
 *                   type: object
 *                   description: User information (only included for API key authentication)
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *             examples:
 *               session_auth:
 *                 summary: Session authentication response
 *                 value:
 *                   ticket:
 *                     id: "abc123def456"
 *                     title: "Unable to access dashboard"
 *                     description: "I'm getting a 403 error when trying to access the main dashboard"
 *                     email: "user@example.com"
 *                     phone: "+1234567890"
 *                     status: "open"
 *                     priority: "high"
 *                     userId: "user123"
 *                     createdAt: "2024-01-01T12:00:00Z"
 *                     updatedAt: "2024-01-01T12:00:00Z"
 *               api_key_auth:
 *                 summary: API key authentication response
 *                 value:
 *                   ticket:
 *                     id: "abc123def456"
 *                     title: "Unable to access dashboard"
 *                     description: "I'm getting a 403 error when trying to access the main dashboard"
 *                     email: "user@example.com"
 *                     phone: "+1234567890"
 *                     status: "open"
 *                     priority: "high"
 *                     userId: "user123"
 *                     createdAt: "2024-01-01T12:00:00Z"
 *                     updatedAt: "2024-01-01T12:00:00Z"
 *                   user:
 *                     id: "user123"
 *                     name: "John Doe"
 *                     email: "john@example.com"
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Title, description, and email are required"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
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
