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

app.listen(port, "0.0.0.0", () => {
  console.log(`Pravah is running on port ${port}`);
});
