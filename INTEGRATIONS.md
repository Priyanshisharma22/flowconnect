# 🔌 MCP Integrations Guide

## What is an MCP?

MCP (Model Context Protocol) is a standardized protocol for integrating external services. Each integration in `flowconnect/` is an MCP server that handles communication with external services.

---

## Available Integrations

| Integration | Purpose | Location | Status |
|---|---|---|---|
| **Slack** | Send messages to Slack channels | `flowconnect/slack-mcp/` | ✅ Active |
| **Discord** | Send messages to Discord servers | `flowconnect/discord-mcp/` | ✅ Active |
| **Telegram** | Send messages via Telegram bot | `flowconnect/telegram-mcp/` | ✅ Active |
| **Zoho CRM** | Sync contacts & manage CRM data | `flowconnect/zoho-crm-mcp/` | ✅ Active |
| **Airtable** | Create/update records in Airtable | `flowconnect/airtable-mcp/` | ✅ Active |
| **Razorpay** | Process payments | `flowconnect/razorpay-mcp/` | ✅ Active |
| **Razorpay Subscriptions** | Manage recurring payments | `flowconnect/razorpay-subscription-mcp/` | ✅ Active |
| **Typeform** | Fetch form responses | `flowconnect/typeform-mcp/` | ✅ Active |
| **Google Forms** | Create forms & collect responses | `flowconnect/googleforms-mcp/` | ✅ Active |
| **Instamojo** | Payment gateway integration | `flowconnect/instamojo-mcp/` | ✅ Active |
| **Fast2SMS** | Send SMS messages | `flowconnect/fast2sms-mcp/` | ✅ Active |
| **Tally** | ERP system integration | `flowconnect/tally-mcp/` | ✅ Active |
| **Invoice** | Generate & send invoices | `flowconnect/invoice-mcp/` | ✅ Active |

---

## Integration File Structure

Each integration follows this standard pattern:

```
integration-mcp/
├── index.js              # MCP server entry point
├── sendIntegration.js    # Core service logic
├── package.json          # Dependencies
└── test.js               # Integration tests
```

---

## Frontend API Clients

The frontend communicates with integrations via API clients:

- `src/api/{service}.ts` - Frontend HTTP client for each integration
- These clients call the Express backend which routes to the appropriate MCP service

---

## How Workflows Execute Integrations

```
1. User creates workflow in UI (src/pages/BuilderPage.tsx)
2. Frontend calls API client (src/api/{service}.ts)
3. Request sent to Express server (index.js)
4. Express routes to MCP service (flowconnect/{service}-mcp/)
5. MCP authenticates & calls external API
6. Response returned to frontend
```

---

## Setting Up an Integration

### Step 1: Get API Credentials
- Visit the service documentation
- Generate API key/token
- Note the credentials

### Step 2: Add Environment Variables
Edit `.env` file:
```bash
SERVICE_API_KEY=your_key_here
SERVICE_AUTH_TOKEN=your_token_here
```

### Step 3: Test the Integration
Each integration has a test file:
```bash
node flowconnect/{service}-mcp/test.js
```

### Step 4: Use in Workflows
Create a workflow and select the integration as an action step.

---

## Adding a New Integration

To add a new service (e.g., "NewService"):

1. **Create MCP folder:**
   ```bash
   mkdir flowconnect/newservice-mcp
   ```

2. **Create `index.js`** - MCP server implementation
3. **Create `sendNewService.js`** - Core service logic
4. **Create `package.json`** - Dependencies
5. **Create `src/api/newservice.ts`** - Frontend client
6. **Add env variables** to `.env.example`
7. **Add tests** in `flowconnect/newservice-mcp/test.js`

---

## Troubleshooting

### Integration not working?
1. Check `.env` variables are set correctly
2. Run the integration test: `node flowconnect/{service}-mcp/test.js`
3. Check browser console for API errors
4. Verify API credentials/tokens are valid

### Missing environment variable?
Check `.env.example` for required variables and add them to `.env`
