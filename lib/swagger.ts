import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api/tickets", // Only include tickets API folder
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Lyzr AI Tickets API",
        version: "1.0.0",
        description: "API documentation for the Lyzr AI ticket management system",
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
          description: "API server",
        },
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "x-api-key",
            description: "API key authentication using x-api-key header",
          },
          ApiKeyQuery: {
            type: "apiKey",
            in: "query", 
            name: "api_key",
            description: "API key authentication using api_key query parameter",
          },
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Session-based authentication",
          },
        },
        schemas: {
          Ticket: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique ticket identifier",
                example: "abc123def456",
              },
              title: {
                type: "string",
                description: "Ticket title",
                example: "Issue with login functionality",
              },
              description: {
                type: "string",
                description: "Detailed description of the issue",
                example: "Users are unable to log in using their email and password",
              },
              email: {
                type: "string",
                format: "email",
                description: "Contact email for the ticket",
                example: "user@example.com",
              },
              phone: {
                type: "string",
                nullable: true,
                description: "Contact phone number (optional)",
                example: "+1234567890",
              },
              status: {
                type: "string",
                enum: ["open", "in_progress", "resolved", "closed"],
                description: "Current status of the ticket",
                example: "open",
              },
              priority: {
                type: "string",
                enum: ["low", "medium", "high", "urgent"],
                description: "Priority level of the ticket",
                example: "medium",
              },
              userId: {
                type: "string",
                description: "ID of the user who created the ticket",
                example: "user123",
              },
              createdAt: {
                type: "string",
                format: "date-time",
                description: "Timestamp when the ticket was created",
                example: "2024-01-01T12:00:00Z",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                description: "Timestamp when the ticket was last updated",
                example: "2024-01-01T12:30:00Z",
              },
            },
            required: ["id", "title", "description", "email", "status", "priority", "userId", "createdAt", "updatedAt"],
          },
          CreateTicketRequest: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Ticket title",
                example: "Issue with login functionality",
              },
              description: {
                type: "string",
                description: "Detailed description of the issue",
                example: "Users are unable to log in using their email and password",
              },
              email: {
                type: "string",
                format: "email",
                description: "Contact email for the ticket",
                example: "user@example.com",
              },
              phone: {
                type: "string",
                description: "Contact phone number (optional)",
                example: "+1234567890",
              },
              priority: {
                type: "string",
                enum: ["low", "medium", "high", "urgent"],
                description: "Priority level of the ticket (defaults to medium)",
                example: "medium",
              },
            },
            required: ["title", "description", "email"],
          },
          UpdateTicketRequest: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Updated ticket title",
                example: "Issue with login functionality - Resolved",
              },
              description: {
                type: "string",
                description: "Updated description of the issue",
                example: "Users are unable to log in using their email and password - Fixed in v1.2",
              },
              email: {
                type: "string",
                format: "email",
                description: "Updated contact email for the ticket",
                example: "user@example.com",
              },
              phone: {
                type: "string",
                description: "Updated contact phone number",
                example: "+1234567890",
              },
              status: {
                type: "string",
                enum: ["open", "in_progress", "resolved", "closed"],
                description: "Updated status of the ticket",
                example: "resolved",
              },
              priority: {
                type: "string",
                enum: ["low", "medium", "high", "urgent"],
                description: "Updated priority level of the ticket",
                example: "high",
              },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              error: {
                type: "string",
                description: "Error message",
                example: "Unauthorized",
              },
            },
            required: ["error"],
          },
        },
      },
      security: [
        { ApiKeyAuth: [] },
        { ApiKeyQuery: [] },
        { BearerAuth: [] },
      ],
    },
  });
  return spec;
};
