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

. ├── src/                     # Frontend application ├── public/                  # Static assets ├── flowconnect/             # Integrations + local backends │   ├── auth-backend/        # Local auth & storage │   ├── slack-mcp/ │   ├── invoice-mcp/ │   └── ... ├── index.js                 # Express production server ├── index.html               # App shell

---

## ⚙️ Setup

### Requirements

- Node.js ≥ 20
- npm ≥ 10

### Installation

```bash
npm install


---

🔐 Environment

Create a .env file in the root directory.

Configure only the services you plan to use.

Local storage files (auto-generated):

flowconnect/auth-backend/users.local.json

flowconnect/auth-backend/workflows.local.json

flowconnect/auth-backend/apps.local.json



---

▶️ Running the Project

1. Start Frontend

npm run dev

2. Start Local Auth Backend

npm run auth:server

3. Production Mode

npm run build
npm start


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

MIT License
See LICENSE


---

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
