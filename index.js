import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fast2smsRoute from "./src/server/fast2sms-route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT) || 3000;
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));
app.use(express.json());

// ── Fast2SMS route only ────────────────────────────────────────────────────
app.use("/api", fast2smsRoute);

// ── Fallback to index.html for SPA ──────────────────────────────────────────
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Add to the list of MCPs that get loaded/initialized
const mcps = [
  'discord-mcp',
  'airtable-mcp',
  'notion-mcp', // ADD THIS
  // ... other MCPs
];

// Add Notion handlers to workflow triggers and actions
export const TRIGGERS = {
  // ... existing triggers ...
  notion_page_created: {
    name: 'Notion Page Created',
    description: 'Trigger when a new page is created in a database',
    config: {
      database_id: { type: 'string', required: true },
    },
  },
  notion_page_updated: {
    name: 'Notion Page Updated',
    description: 'Trigger when a page is updated',
    config: {
      database_id: { type: 'string', required: true },
    },
  },
}

export const ACTIONS = {
  // ... existing actions ...
  create_notion_page: {
    name: 'Create Notion Page',
    description: 'Create a new page in Notion database',
    config: {
      database_id: { type: 'string', required: true },
      properties: { type: 'object', required: true },
    },
  },
  update_notion_page: {
    name: 'Update Notion Page',
    description: 'Update an existing Notion page',
    config: {
      page_id: { type: 'string', required: true },
      properties: { type: 'object', required: true },
    },
  },
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Pravah is running on port ${port}`);
});
