<<<<<<< HEAD
# AlgoZap
# ⚡ AlgoZap — Blockchain-Verified Workflow Automation

**AlgoZap** is an open-source, Zapier-like automation platform that connects off-chain applications with **on-chain Algorand smart contract actions**.  
It allows users to create, execute, and verify automated workflows (“Zaps”) — all transparently verified on the blockchain.

---

## 🚀 Features

### 🧩 Core Features
- Create and manage workflows (Triggers + Actions)
- Integrations with Gmail, Slack, Google Sheets, Webhooks, etc.
- On-chain actions (token transfers, smart contract calls)
- Realtime execution logs and blockchain verification
- Secure credential storage and authentication

### 🔐 User System
- Email/password sign-up & login
- Optional wallet login (Pera Wallet / WalletConnect)
- JWT authentication and protected routes
- Multi-factor authentication support (optional)

### 🧠 Developer Features
- Custom connector SDK
- Algorand SDK integration for on-chain verification
- API key management for integrations

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ORM) |
| **Blockchain** | Algorand (via AlgoKit SDK) |
| **Authentication** | JWT, bcrypt |
| **Frontend (planned)** | React + Tailwind (dashboard builder) |

---

## ⚙️ Folder Structure
AlgoZap/
│
├── index.js # Entry point
├── config/
│ └── db.js # MongoDB connection
├── routes/
│ └── authRoutes.js # Authentication routes
├── controllers/
│ └── authController.js # Register/Login logic
├── models/
│ └── User.js # User schema
├── middleware/
│ └── authMiddleware.js # JWT verification
├── .env # Environment variables
├── package.json
└── README.md


---

## ⚡ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/AlgoZap.git
cd AlgoZap

2️⃣ Install dependencies
npm install

3️⃣ Configure environment variables

Create a .env file in the project root:

PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/algozap
JWT_SECRET=supersecretkey123

Start MongoDB (local)
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"

🧪 API Testing (via Postman)
Register User

POST http://localhost:5000/api/auth/register

Body → raw → JSON

{
  "name": "Prince",
  "email": "prince@test.com",
  "password": "123456"
}

Login User

POST http://localhost:5000/api/auth/login

Body → raw → JSON

{
  "email": "prince@test.com",
  "password": "123456"
}

🛠️ Development Scripts
Command	Description
npm start	Run server (production)
npm run dev	Run server with Nodemon
npm install	Install dependencies
🌐 Future Modules

Drag-and-drop Workflow Builder UI

Execution Engine with retry logic

Team collaboration & billing dashboard

On-chain payment & verification

Multilingual UI support
=======
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
>>>>>>> 9d90bcb (initial website)
