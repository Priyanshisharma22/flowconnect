# 🏗️ Architecture Overview

## System Components

Pravah is built with a modular architecture consisting of three main layers:

### 1. Frontend Layer (React + Vite)
- **Tech**: React 19, TypeScript, Tailwind CSS
- **Location**: `src/` directory
- **Responsibility**: User interface for workflow building & management
- **Key Files**:
  - `src/pages/` - Page components (Builder, Dashboard, Auth pages)
  - `src/components/` - Reusable UI components
  - `src/api/` - API client services for each integration
  - `src/context/` - Global state (Auth, Theme)

### 2. Backend API Layer (Express.js)
- **Tech**: Express 5, Node.js
- **Location**: `index.js`
- **Responsibility**: REST API server & request routing
- **Features**:
  - Route requests to appropriate MCP integrations
  - Coordinate between frontend and backend services
  - Serve built frontend files in production

### 3. Auth Backend (Express.js + JWT)
- **Tech**: Express, JWT, bcrypt, JSON storage
- **Location**: `flowconnect/auth-backend/`
- **Responsibility**: User authentication & management
- **Features**:
  - User registration & login
  - JWT token generation
  - Session management
  - Local JSON file storage (no database)

### 4. Integration Layer (MCP Services)
- **Tech**: Model Context Protocol (MCP)
- **Location**: `flowconnect/{service}-mcp/`
- **Responsibility**: Connect to external services
- **Features**:
  - Slack, Discord, Telegram messaging
  - Zoho CRM, Airtable database
  - Razorpay payments
  - And 7+ more integrations

---

## Data Flow

### 1. User Authentication Flow

```
Login UI (src/pages/LoginPage.tsx)
    ↓
POST /auth/login (Express)
    ↓
flowconnect/auth-backend/auth-server.js validates credentials
    ↓
Generate JWT token
    ↓
Return token to frontend
    ↓
Frontend stores token & redirects to dashboard
```

### 2. Workflow Creation & Execution

```
Visual Builder (src/pages/BuilderPage.tsx)
    ↓
User creates workflow with multiple steps
    ↓
POST /workflows (Express API)
    ↓
Auth Backend stores workflow (workflows.local.json)
    ↓
User triggers workflow manually or via trigger
    ↓
Express routes to appropriate MCP service
    ↓
MCP authenticates with external service (Slack, Discord, etc.)
    ↓
MCP executes action (send message, create record, etc.)
    ↓
Response returned to frontend with result
```

### 3. Integration Request Flow

```
Frontend Component (React)
    ↓
API Client (src/api/{service}.ts)
    ↓
POST /api/{service} (Express index.js)
    ↓
Route to MCP Service (flowconnect/{service}-mcp/)
    ↓
MCP calls external API with credentials
    ↓
External Service (Slack, Discord, Zoho, etc.)
    ↓
Response back through MCP → Express → Frontend
```

---

## Directory Structure

```
flowconnect/
├── src/                           # Frontend (React + TypeScript)
│   ├── api/                       # API clients for each integration
│   │   ├── slack.ts              # Slack API client
│   │   ├── discord.ts            # Discord API client
│   │   ├── zoho.ts               # Zoho CRM client
│   │   ├── razorpay.ts           # Razorpay client
│   │   └── ... (other services)
│   ├── pages/                    # Top-level page components
│   │   ├── BuilderPage.tsx       # Main workflow builder
│   │   ├── HomePage.tsx          # Home/dashboard
│   │   ├── LoginPage.tsx         # Authentication
│   │   └── ProfilePage.tsx       # User settings
│   ├── components/               # Reusable UI components
│   │   ├── common/               # Button, Modal, Input, etc.
│   │   └── sections/             # Complex component groups
│   ├── context/                  # React Context for global state
│   │   ├── AuthContext.tsx       # User auth state
│   │   └── ThemeContext.tsx      # Theme settings
│   ├── styles/                   # CSS files (one per page)
│   └── utils/                    # Utility functions
│
├── flowconnect/                   # Integration services (MCP)
│   ├── auth-backend/             # Local auth server
│   │   ├── auth-server.js        # JWT, user management
│   │   └── users.json            # User storage
│   ├── slack-mcp/
│   │   ├── index.js              # MCP entry
│   │   ├── sendSlack.js          # Slack logic
│   │   └── package.json
│   ├── discord-mcp/
│   │   ├── index.js
│   │   ├── sendDiscord.js
│   │   └── package.json
│   ├── zoho-crm-mcp/
│   │   ├── index.js
│   │   ├── sendZoho.js
│   │   ├── zoho-auth.js          # OAuth flow
│   │   └── package.json
│   └── ... (other integrations)
│
├── public/                        # Static assets
├── index.js                      # Express production server
├── vite.config.ts                # Vite build config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Root dependencies
├── .env.example                  # Environment template
└── README.md                     # Project documentation
```

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **UI Framework** | React 19 | Component-based UI |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Build Tool** | Vite | Fast dev & prod builds |
| **Runtime** | Node.js ≥20 | JavaScript runtime |
| **API Server** | Express 5 | REST API |
| **Authentication** | JWT + bcrypt | Secure auth |
| **HTTP Client** | Axios | API requests |
| **Storage** | JSON files | Local persistence |
| **Integration Protocol** | MCP | External service integration |

---

## Deployment Architecture

```
Production Server
│
├── Frontend (static files)
│   └── Built from src/ → dist/
│
├── Express API Server (index.js)
│   └── Handles /api/* routes
│
└── Auth Backend (flowconnect/auth-backend/)
    └── Handles /auth/* routes

External Services
├── Slack, Discord, Telegram
├── Zoho, Airtable
├── Razorpay, Typeform, etc.
└── Connected via MCP layer
```

---

## Execution Environment

```
Development:
- Frontend: npm run dev (Vite dev server on :5173)
- Backend: Express serves static files
- Auth: npm run auth:server (separate terminal on :5000)

Production:
- npm run build (build frontend)
- npm start (Express serves built frontend + API)
```

---

## Key Design Decisions

1. **No Database Required** - Uses JSON files for local storage (simpler setup)
2. **Modular Integrations** - Each service is independent MCP server (easy to add/remove)
3. **Frontend-First** - Rich UI for workflow building (React + Vite)
4. **Separation of Concerns** - Auth, API, Integrations are separate services
5. **Type Safety** - TypeScript throughout for better DX
