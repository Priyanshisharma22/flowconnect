import AIProvider from "./AIProvider.js";
import axios from "axios";
import FlowTrigger from "../services/FlowTrigger.js";

class OpenAIProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async generateResponse(prompt, context = {}) {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is missing");
    
    try {
      const url = "https://api.openai.com/v1/chat/completions";
      const payload = {
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "trigger_workflow",
              description: "Trigger a FlowConnect workflow when the user specifically requests an automation task to be performed.",
              parameters: {
                type: "object",
                properties: {
                  workflow_name: {
                    type: "string",
                    description: "The specific name or intent of the workflow to trigger (e.g., 'sales_report', 'invoice_generation')"
                  },
                  parameters: {
                    type: "string",
                    description: "Any additional parameters extracted from the user's message formatted as a JSON string."
                  }
                },
                required: ["workflow_name"]
              }
            }
          }
        ]
      };

      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        }
      });

      const message = response.data.choices[0].message;
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        if (toolCall.function.name === "trigger_workflow") {
          const args = JSON.parse(toolCall.function.arguments);
          const workflowName = args.workflow_name;
          
          let parsedParams = { senderPhone: context.senderPhone };
          try {
            if (args.parameters) Object.assign(parsedParams, JSON.parse(args.parameters));
          } catch (e) {
            console.error("Failed to parse AI parameters", e);
          }

          await FlowTrigger.trigger(workflowName, parsedParams);
          return `Executing workflow: "${workflowName}" for you now! ⚙️`;
        }
      }

      return message.content || "Sorry, I could not generate a response.";
    } catch (error) {
      console.error("OpenAI API Error:", error?.response?.data || error.message);
      return "Sorry, there was an error processing your request with OpenAI.";
    }
  }
}

export default OpenAIProvider;
