import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

class WhatsAppClient {
  constructor() {
    this.token = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseUrl = `https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`;
  }

  async sendMessage(to, textBody) {
    if (!this.token || !this.phoneNumberId) {
      console.error("WhatsApp credentials are not configured properly.");
      return;
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: {
            body: textBody,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error("Failed to send WhatsApp message:", error?.response?.data || error.message);
      throw error;
    }
  }
}

export default new WhatsAppClient();
