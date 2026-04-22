import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

class FlowTrigger {
  /**
   * Translates NLP intents parsed from AI into actionable FlowConnect workflows.
   */
  static async trigger(intentName, params) {
    
    const webhookUrl = process.env.FLOWCONNECT_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("FLOWCONNECT_WEBHOOK_URL not configured. Cannot trigger flow.");
      return null;
    }

    try {
      const response = await axios.post(webhookUrl, {
        source: "whatsapp-chatbot",
        intent: intentName,
        data: params,
        timestamp: new Date().toISOString()
      });
      
      return {
        status: "success",
        message: `Flow ${intentName} was triggered successfully.`,
        executionId: response.data?.executionId || Date.now()
      };
    } catch (error) {
      console.error(`Failed to trigger flow ${intentName}:`, error.message);
      throw error;
    }
  }
}

export default FlowTrigger;
