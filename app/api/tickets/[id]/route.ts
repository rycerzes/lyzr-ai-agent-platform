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

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get a specific ticket by ID
 *     description: Retrieves a specific ticket by its ID. Only returns tickets belonging to the authenticated user.
 *     tags:
 *       - Tickets
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiKeyQuery: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the ticket
 *         example: "abc123def456"
 *     responses:
 *       200:
 *         description: Successfully retrieved ticket
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
 *                     title: "Login issue"
 *                     description: "Cannot log in with valid credentials"
 *                     email: "user@example.com"
 *                     phone: "+1234567890"
 *                     status: "open"
 *                     priority: "medium"
 *                     userId: "user123"
 *                     createdAt: "2024-01-01T12:00:00Z"
 *                     updatedAt: "2024-01-01T12:00:00Z"
 *               api_key_auth:
 *                 summary: API key authentication response
 *                 value:
 *                   ticket:
 *                     id: "abc123def456"
 *                     title: "Login issue"
 *                     description: "Cannot log in with valid credentials"
 *                     email: "user@example.com"
 *                     phone: "+1234567890"
 *                     status: "open"
 *                     priority: "medium"
 *                     userId: "user123"
 *                     createdAt: "2024-01-01T12:00:00Z"
 *                     updatedAt: "2024-01-01T12:00:00Z"
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
 *       404:
 *         description: Ticket not found or doesn't belong to authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Ticket not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
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

/**
 * @swagger
 * /tickets/{id}:
 *   put:
 *     summary: Update a specific ticket by ID
 *     description: Updates a specific ticket by its ID. Only allows updating tickets belonging to the authenticated user. All fields are optional - only provided fields will be updated.
 *     tags:
 *       - Tickets
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiKeyQuery: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the ticket
 *         example: "abc123def456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTicketRequest'
 *           example:
 *             title: "Login issue - Updated"
 *             status: "in_progress"
 *             priority: "high"
 *     responses:
 *       200:
 *         description: Ticket updated successfully
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
 *                     title: "Login issue - Updated"
 *                     description: "Cannot log in with valid credentials"
 *                     email: "user@example.com"
 *                     phone: "+1234567890"
 *                     status: "in_progress"
 *                     priority: "high"
 *                     userId: "user123"
 *                     createdAt: "2024-01-01T12:00:00Z"
 *                     updatedAt: "2024-01-01T12:30:00Z"
 *               api_key_auth:
 *                 summary: API key authentication response
 *                 value:
 *                   ticket:
 *                     id: "abc123def456"
 *                     title: "Login issue - Updated"
 *                     description: "Cannot log in with valid credentials"
 *                     email: "user@example.com"
 *                     phone: "+1234567890"
 *                     status: "in_progress"
 *                     priority: "high"
 *                     userId: "user123"
 *                     createdAt: "2024-01-01T12:00:00Z"
 *                     updatedAt: "2024-01-01T12:30:00Z"
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
 *       404:
 *         description: Ticket not found or doesn't belong to authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Ticket not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
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

/**
 * @swagger
 * /tickets/{id}:
 *   delete:
 *     summary: Delete a specific ticket by ID
 *     description: Permanently deletes a specific ticket by its ID. Only allows deleting tickets belonging to the authenticated user.
 *     tags:
 *       - Tickets
 *     security:
 *       - ApiKeyAuth: []
 *       - ApiKeyQuery: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the ticket
 *         example: "abc123def456"
 *     responses:
 *       200:
 *         description: Ticket deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: "Ticket deleted successfully"
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
 *                   message: "Ticket deleted successfully"
 *               api_key_auth:
 *                 summary: API key authentication response
 *                 value:
 *                   message: "Ticket deleted successfully"
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
 *       404:
 *         description: Ticket not found or doesn't belong to authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Ticket not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
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
