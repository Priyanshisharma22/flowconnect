import express from "express";
import dotenv from "dotenv";
import WhatsAppClient from "./src/services/WhatsAppClient.js";
import ProviderFactory from "./src/providers/ProviderFactory.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const aiProvider = ProviderFactory.getProvider();

app.use(express.json());

// Verification Webhook required by Meta
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Handle incoming messages
app.post("/webhook", async (req, res) => {
  try {
    const { body } = req;
    
    // Check if it's a WhatsApp App webhook event
    if (body.object === "whatsapp_business_account") {
      res.status(200).send("EVENT_RECEIVED");

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;
          
          if (value.messages && value.messages[0]) {
            const message = value.messages[0];
            const senderPhone = message.from;
            
            if (message.type === "text") {
              const textContent = message.text.body;
              
              // 1. Process message through the selected AI model
              const aiReply = await aiProvider.generateResponse(textContent, { senderPhone });
              
              // 2. Send the AI's reply back to the user via WhatsApp
              await WhatsAppClient.sendMessage(senderPhone, aiReply);
            }
          }
        }
      }
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error("Error processing webhook POST request:", error);
    if (!res.headersSent) {
      res.sendStatus(500);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
