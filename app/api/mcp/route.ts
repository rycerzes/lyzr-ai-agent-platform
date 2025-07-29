import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import { db } from "@/db/drizzle";
import { ticket, user } from "@/db/schema";
import { eq } from "drizzle-orm";
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

const handler = createMcpHandler(
    (server) => {
        // Hello World tool
        server.tool(
            'hello_world',
            'Returns a friendly greeting message',
            {
                name: z.string().optional().default('World')
            },
            async ({ name }) => {
                return {
                    content: [{
                        type: 'text',
                        text: `👋 Hello, ${name}! Welcome to the Lyzr AI Ticket Management System!`
                    }],
                };
            },
        );

        // Create Ticket tool
        server.tool(
            'create_ticket',
            'Creates a new support ticket in the ticket management system',
            {
                title: z.string().min(1, 'Title is required'),
                description: z.string().min(1, 'Description is required'),
                email: z.string().email('Valid email is required'),
                phone: z.string().optional(),
                priority: z.enum(['low', 'medium', 'high']).default('medium'),
                apiKey: z.string().min(1, 'API key is required')
            },
            async ({ title, description, email, phone, priority, apiKey }) => {
                try {
                    // Authenticate the API key and get user info
                    const authenticatedUser = await authenticateApiKey(apiKey);
                    if (!authenticatedUser) {
                        throw new Error('Invalid API key');
                    }

                    const userId = authenticatedUser.id;

                    // Create new ticket in the database
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
                            userId: userId,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                        .returning();

                    const createdTicket = newTicket[0];

                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Ticket created successfully!\n\n` +
                                `🎫 **Ticket ID:** ${createdTicket.id}\n` +
                                `📝 **Title:** ${createdTicket.title}\n` +
                                `📄 **Description:** ${createdTicket.description}\n` +
                                `📧 **Email:** ${createdTicket.email}\n` +
                                `📞 **Phone:** ${createdTicket.phone || 'Not provided'}\n` +
                                `⚡ **Priority:** ${createdTicket.priority}\n` +
                                `📊 **Status:** ${createdTicket.status}\n` +
                                `🕒 **Created at:** ${createdTicket.createdAt.toISOString()}`
                        }],
                    };
                } catch (error) {
                    console.error("Error creating ticket:", error);
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ Error creating ticket: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }],
                    };
                }
            },
        );
    },
    {},
    { basePath: '/api' },
);

export { handler as GET, handler as POST, handler as DELETE };
