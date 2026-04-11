# Pravah

Pravah is an open-source workflow automation platform with a React + Vite frontend, a lightweight Express server for production hosting, and service-specific integration modules under [`flowconnect/`](./flowconnect).

The project lets teams orchestrate actions across messaging, forms, CRM, invoicing, and payment systems from one interface.

## Repository At A Glance

- Frontend app in [`src/`](./src)
- Production static server in [`index.js`](./index.js)
- Local auth backend in [`flowconnect/auth-backend/`](./flowconnect/auth-backend)
- Integration modules for Slack, Discord, Telegram, Zoho, Airtable, Razorpay, Typeform, Tally, and more in [`flowconnect/`](./flowconnect)

## Setup

### Requirements

- Node.js 20 or newer
- npm 10 or newer

### Install

```bash
npm install
```

### Environment

Create a local `.env` file and fill in only the services you plan to run.

The auth backend stores local workflow and connected-app data so the authenticated builder and profile pages can work without a separate backend. The default local files are:

- `flowconnect/auth-backend/users.local.json`
- `flowconnect/auth-backend/workflows.local.json`
- `flowconnect/auth-backend/apps.local.json`

### Run Locally

Frontend:

```bash
npm run dev
```

Local auth backend:

```bash
npm run auth:server
```

With both commands running, you can sign up, log in, save workflows, toggle workflow status, view dashboard stats, and manage connected apps locally.

Production-style local server after building:

```bash
npm run build
npm start
```

## Scripts

- `npm run dev` starts the Vite frontend.
- `npm run auth:server` starts the local auth API.
- `npm run server` starts the Express server with `nodemon`.
- `npm run build` type-checks and builds the frontend.
- `npm run lint` runs ESLint across the repo.

## Contributing

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request. If you want a smaller entry point, use the issue templates in [.github/ISSUE_TEMPLATE](./.github/ISSUE_TEMPLATE) to file a bug, feature request, or task.

Review [`SECURITY.md`](./SECURITY.md) before reporting a vulnerability, and follow [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) when participating in the project.

## Project Structure

```text
.
|-- src/                     # Frontend application
|-- public/                  # Static public assets
|-- flowconnect/             # Service integrations and local backends
|   |-- auth-backend/
|   |-- invoice-mcp/
|   |-- slack-mcp/
|   -- ...
|-- index.js                 # Express server for built frontend
|-- index.html               # App HTML shell
```

## Notes

- Some integration modules expect third-party credentials and local service setup.
- Runtime-generated files should stay local and are ignored where possible.

## License

MIT. See [`LICENSE`](./LICENSE).
