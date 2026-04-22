import AIProvider from "./AIProvider.js";
import axios from "axios";
import FlowTrigger from "../services/FlowTrigger.js";

class ClaudeProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.model = process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307";
  }

  async generateResponse(prompt, context = {}) {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY is missing");
    
    try {
      const url = "https://api.anthropic.com/v1/messages";
      const payload = {
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            name: "trigger_workflow",
            description: "Trigger a FlowConnect workflow when the user specifically requests an automation task to be performed.",
            input_schema: {
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
        ]
      };

      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01"
        }
      });

      const content = response.data.content;
      const toolCall = content.find(c => c.type === "tool_use");
      
      if (toolCall && toolCall.name === "trigger_workflow") {
        const args = toolCall.input;
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

      const textMessage = content.find(c => c.type === "text");
      return textMessage?.text || "Sorry, I could not generate a response.";
    } catch (error) {
      console.error("Claude API Error:", error?.response?.data || error.message);
      return "Sorry, there was an error processing your request with Claude.";
    }
  }
}

export default ClaudeProvider;
