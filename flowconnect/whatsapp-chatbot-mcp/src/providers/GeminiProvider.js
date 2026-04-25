import AIProvider from "./AIProvider.js";
import axios from "axios";
import FlowTrigger from "../services/FlowTrigger.js";

class GeminiProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  async generateResponse(prompt, context = {}) {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY is missing");
    
    try {
      const model = process.env.GEMINI_MODEL || "gemini-pro";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [
          {
            functionDeclarations: [
              {
                name: "trigger_workflow",
                description: "Trigger a FlowConnect workflow when the user specifically requests an automation task to be performed.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    workflow_name: {
                      type: "STRING",
                      description: "The specific name or intent of the workflow to trigger (e.g., 'sales_report', 'invoice_generation')"
                    },
                    parameters: {
                      type: "STRING",
                      description: "Any additional parameters extracted from the user's message formatted as a JSON string."
                    }
                  },
                  required: ["workflow_name"]
                }
              }
            ]
          }
        ]
      };

      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" }
      });

      const parts = response.data?.candidates?.[0]?.content?.parts;
      if (!parts || parts.length === 0) return "Sorry, I could not generate a response.";

      if (parts[0].functionCall) {
        const functionCall = parts[0].functionCall;
        if (functionCall.name === "trigger_workflow") {
          const workflowName = functionCall.args.workflow_name;
          const paramsString = functionCall.args.parameters;
          
          let parsedParams = { senderPhone: context.senderPhone };
          try {
            if (paramsString) Object.assign(parsedParams, JSON.parse(paramsString));
          } catch (e) {
            console.error("Failed to parse AI parameters", e);
          }
          await FlowTrigger.trigger(workflowName, parsedParams);
          return `Executing workflow: "${workflowName}" for you now!`;
        }
      }
      return parts[0].text || "Sorry, I could not generate a response.";
    } catch (error) {
      console.error("Gemini API Error:", error?.response?.data || error.message);
      return "Sorry, there was an error processing your request with Gemini.";
    }
  }
}

export default GeminiProvider;
