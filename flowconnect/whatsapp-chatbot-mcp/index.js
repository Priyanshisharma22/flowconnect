import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

dotenv.config();

const server = new Server(
  {
    name: "whatsapp-chatbot-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// MCP Tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "send_whatsapp_message",
        description: "Send a message to a WhatsApp number",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "The recipient phone number with country code",
            },
            message: {
              type: "string",
              description: "The message body to send",
            },
          },
          required: ["to", "message"],
        },
      },
    ],
  };
});

// Implementation of basic tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "send_whatsapp_message") {
    // Basic placeholder implementation, this is typically called by main process or AI agent
    const { to, message } = request.params.arguments;
    return {
      content: [{ type: "text", text: `Successfully routed message to ${to}` }],
    };
  }
  throw new Error(`Tool not found: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WhatsApp Chatbot MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
