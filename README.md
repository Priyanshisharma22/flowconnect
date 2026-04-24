# ⚡ Pravah

Pravah is an open-source workflow automation platform that enables teams to design, execute, and manage workflows across multiple services from a single interface.

It is built with a **React + Vite frontend**, a **lightweight Express server**, and a **modular integration layer (`flowconnect/`)** supporting messaging, CRM, forms, invoicing, and payment systems.

---

## 🚀 NSOC '26 Participation

Pravah is an **official project in Nexus Spring of Code 2026 (NSOC '26)**.

- 👨‍💻 Role: **Project Admin**
- 🤝 Open for contributors
- 🎯 Focus Areas:
  - Workflow automation engine
  - Integration ecosystem
  - Frontend UX improvements
  - Backend scalability

---

## ✨ Features

- 🔄 Visual workflow builder
- 🔌 Plug-and-play integrations (Slack, Discord, Telegram, Zoho, Airtable, Razorpay, Typeform, Tally, etc.)
- 🧠 Local-first architecture (no external DB required)
- 🔐 Built-in authentication backend
- 📊 Dashboard with workflow insights
- ⚙️ Enable/disable workflows dynamically
- 🧩 Extensible integration system

---

## 🧩 Architecture

Frontend (React + Vite) ↓ Express Server (Production Hosting) ↓ Local Auth Backend (JSON Storage) ↓ Integration Layer (flowconnect/)

---

## 📁 Project Structure

├── .github/ # GitHub workflows & configs
├── flowconnect/ # Integrations & local backends
├── public/ # Static assets
│
├── src/ # Frontend application
│ ├── api/
│ ├── assets/
│ ├── components/
│ ├── context/
│ ├── pages/
│ ├── styles/
│ ├── utils/
│ ├── App.tsx
│ └── main.tsx
│
├── .gitignore
├── index.html # App entry (Vite)
├── index.js # Backend / server entry
│
├── package.json
├── package-lock.json
├── eslint.config.js
├── postcss.config.js
│
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── ACCESSIBILITY.md
├── ARCHITECTURE.md
├── INTEGRATIONS.md
├── LICENSE
---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Step 1: Clone & Install

```bash
git clone https://github.com/Priyanshisharma22/flowconnect.git
cd flowconnect
npm install
```

### Step 2: Setup Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API keys for services you want to use
# See INTEGRATIONS.md for details on each service
```

**Required variables:**
- `VITE_API_BASE_URL=http://localhost:5000`
- `AUTH_SERVER_PORT=5000`
- `JWT_SECRET=your_jwt_secret_key_here`

**Optional:** Add API keys only for services you plan to use (Slack, Discord, Zoho, etc.)

### Step 3: Start the Development Server

**Terminal 1 - Frontend:**
```bash
npm run dev
# Opens http://localhost:5173
```

**Terminal 2 - Auth Backend:**
```bash
npm run auth:server
# Runs on http://localhost:5000
```

### Step 4: Access the Application

Open http://localhost:5173 in your browser.

**Default test credentials:**
- Email: `test@example.com`
- Password: `password123`

### Production Mode

```bash
npm run build    # Build frontend
npm start        # Start Express server
```

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design & data flows
- **[INTEGRATIONS.md](./INTEGRATIONS.md)** - MCP services & setup guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute & folder structure
- **[.env.example](./.env.example)** - All environment variables


---

📜 Scripts

Command	Description

npm run dev	Start frontend (Vite)
npm run auth:server	Start local auth backend
npm run server	Start Express server (nodemon)
npm run build	Build frontend
npm run lint	Run ESLint



---

🔌 Integrations

Located in flowconnect/, including:

Messaging → Slack, Discord, Telegram

CRM → Zoho, Airtable

Payments → Razorpay

Forms → Typeform

Accounting → Tally


Each module is independently extendable.


---

🤝 Contributing

We welcome contributions, especially during NSOC '26.

Steps

1. Read CONTRIBUTING.md


2. Choose an issue from .github/ISSUE_TEMPLATE


3. Fork the repository


4. Create a feature branch


5. Submit a pull request



Also review:

SECURITY.md

CODE_OF_CONDUCT.md



---

⚠️ Notes

Some integrations require API keys and local setup

Runtime-generated files are ignored where possible

Designed for extensibility — add custom integrations inside flowconnect/



---

📄 License

- **[License](./License)**

💡 Vision

Pravah aims to be a developer-first alternative to n8n and Zapier, with:

Open architecture

Local-first execution

High customizability

Scalable integration ecosystem



---

👨‍💻 Maintainers

Priyansh Chaurasiya – Frontend developer|Ui/Ux designer

Priyanshi Sharma – Machine Learning Engineer | Full Stack Developer



---
