#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");
const { Client } = require("@notionhq/client");

// ─── Configuration ────────────────────────────────────────────────────────

const NOTION_API_KEY = process.env.NOTION_API_KEY;

if (!NOTION_API_KEY) {
  process.stderr.write("ERROR: NOTION_API_KEY not set in .env\n");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

// ─── Tool Definitions ─────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "get_database",
    description: "Retrieve a Notion database and its properties.",
    inputSchema: {
      type: "object",
      properties: {
        database_id: {
          type: "string",
          description: "The ID of the Notion database (uuid format, hyphens removed for this tool).",
        },
      },
      required: ["database_id"],
    },
  },
  {
    name: "query_database",
    description: "Query a Notion database with optional filters and sorting.",
    inputSchema: {
      type: "object",
      properties: {
        database_id: {
          type: "string",
          description: "The ID of the Notion database.",
        },
        filter: {
          type: "object",
          description: "Optional filter object (Notion filter format).",
        },
        sorts: {
          type: "array",
          description: "Optional array of sort objects.",
        },
        page_size: {
          type: "number",
          description: "Number of results to return (default 10, max 100).",
        },
      },
      required: ["database_id"],
    },
  },
  {
    name: "get_page",
    description: "Retrieve a specific Notion page content and properties.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "The ID of the Notion page.",
        },
      },
      required: ["page_id"],
    },
  },
  {
    name: "get_page_blocks",
    description: "Retrieve blocks (content) from a Notion page.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "The ID of the Notion page.",
        },
      },
      required: ["page_id"],
    },
  },
  {
    name: "create_page",
    description: "Create a new page in a Notion database.",
    inputSchema: {
      type: "object",
      properties: {
        database_id: {
          type: "string",
          description: "The ID of the database where the page will be created.",
        },
        properties: {
          type: "object",
          description: "Page properties object (matches database schema).",
        },
        children: {
          type: "array",
          description: "Optional array of blocks to add to the page.",
        },
      },
      required: ["database_id", "properties"],
    },
  },
  {
    name: "update_page",
    description: "Update properties of an existing Notion page.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "The ID of the page to update.",
        },
        properties: {
          type: "object",
          description: "Properties to update.",
        },
      },
      required: ["page_id", "properties"],
    },
  },
  {
    name: "append_blocks",
    description: "Append blocks (content) to a Notion page.",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "The ID of the page.",
        },
        children: {
          type: "array",
          description: "Array of blocks to append.",
        },
      },
      required: ["page_id", "children"],
    },
  },
];

// ─── Tool Implementation ──────────────────────────────────────────────────

async function getDatabase({ database_id }) {
  try {
    const database = await notion.databases.retrieve({
      database_id: formatDatabaseId(database_id),
    });
    return {
      success: true,
      database: {
        id: database.id,
        title: database.title,
        properties: database.properties,
        created_time: database.created_time,
        last_edited_time: database.last_edited_time,
      },
    };
  } catch (error) {
    throw new Error(`Failed to retrieve database: ${error.message}`);
  }
}

async function queryDatabase({ database_id, filter, sorts, page_size }) {
  try {
    const response = await notion.databases.query({
      database_id: formatDatabaseId(database_id),
      filter,
      sorts,
      page_size: page_size || 10,
    });
    return {
      success: true,
      total_count: response.results.length,
      pages: response.results.map((page) => ({
        id: page.id,
        properties: page.properties,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
      })),
      has_more: response.has_more,
      next_cursor: response.next_cursor,
    };
  } catch (error) {
    throw new Error(`Failed to query database: ${error.message}`);
  }
}

async function getPage({ page_id }) {
  try {
    const page = await notion.pages.retrieve({ page_id: formatPageId(page_id) });
    return {
      success: true,
      page: {
        id: page.id,
        properties: page.properties,
        parent: page.parent,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        created_by: page.created_by,
        last_edited_by: page.last_edited_by,
        cover: page.cover,
        icon: page.icon,
      },
    };
  } catch (error) {
    throw new Error(`Failed to retrieve page: ${error.message}`);
  }
}

async function getPageBlocks({ page_id }) {
  try {
    const response = await notion.blocks.children.list({
      block_id: formatPageId(page_id),
    });
    return {
      success: true,
      blocks: response.results.map((block) => ({
        id: block.id,
        type: block.type,
        content: block[block.type],
      })),
    };
  } catch (error) {
    throw new Error(`Failed to retrieve page blocks: ${error.message}`);
  }
}

async function createPage({ database_id, properties, children }) {
  try {
    const page = await notion.pages.create({
      parent: { database_id: formatDatabaseId(database_id) },
      properties,
      children: children || [],
    });
    return {
      success: true,
      page_id: page.id,
      page_url: page.url,
      message: `Page created successfully in database`,
    };
  } catch (error) {
    throw new Error(`Failed to create page: ${error.message}`);
  }
}

async function updatePage({ page_id, properties }) {
  try {
    const page = await notion.pages.update({
      page_id: formatPageId(page_id),
      properties,
    });
    return {
      success: true,
      page_id: page.id,
      message: `Page updated successfully`,
    };
  } catch (error) {
    throw new Error(`Failed to update page: ${error.message}`);
  }
}

async function appendBlocks({ page_id, children }) {
  try {
    const response = await notion.blocks.children.append({
      block_id: formatPageId(page_id),
      children,
    });
    return {
      success: true,
      blocks_added: response.results.length,
      message: `${response.results.length} blocks appended successfully`,
    };
  } catch (error) {
    throw new Error(`Failed to append blocks: ${error.message}`);
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────

function formatDatabaseId(id) {
  // Add hyphens to UUID format if missing
  return id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

function formatPageId(id) {
  // Same as database ID formatting
  return id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

// ─── MCP stdio transport ──────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin });

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

async function handleRequest(req) {
  const { id, method, params } = req;

  if (method === "initialize") {
    return send({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "notion-mcp", version: "1.0.0" },
      },
    });
  }

  if (method === "notifications/initialized") return;

  if (method === "tools/list") {
    return send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    try {
      let result;
      if (name === "get_database") result = await getDatabase(args);
      else if (name === "query_database") result = await queryDatabase(args);
      else if (name === "get_page") result = await getPage(args);
      else if (name === "get_page_blocks") result = await getPageBlocks(args);
      else if (name === "create_page") result = await createPage(args);
      else if (name === "update_page") result = await updatePage(args);
      else if (name === "append_blocks") result = await appendBlocks(args);
      else throw new Error(`Unknown tool: ${name}`);

      return send({
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(result) }] },
      });
    } catch (error) {
      return send({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: error.message,
        },
      });
    }
  }

  send({
    jsonrpc: "2.0",
    id: id || null,
    error: { code: -32601, message: "Method not found" },
  });
}

rl.on("line", async (line) => {
  try {
    const req = JSON.parse(line);
    await handleRequest(req);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
  }
});

process.on("uncaughtException", (error) => {
  process.stderr.write(`Uncaught error: ${error.message}\n`);
});
