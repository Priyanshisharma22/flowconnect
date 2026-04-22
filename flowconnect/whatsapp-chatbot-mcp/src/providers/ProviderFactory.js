import OpenAIProvider from "./OpenAIProvider.js";
import ClaudeProvider from "./ClaudeProvider.js";
import GeminiProvider from "./GeminiProvider.js";
import GroqProvider from "./GroqProvider.js";
import dotenv from "dotenv";

dotenv.config();

class ProviderFactory {
  static getProvider() {
    const providerName = process.env.DEFAULT_AI_PROVIDER || "openai";
    
    switch (providerName.toLowerCase()) {
      case "openai":
        return new OpenAIProvider();
      case "claude":
        return new ClaudeProvider();
      case "gemini":
        return new GeminiProvider();
      case "groq":
        return new GroqProvider();
      default:
        console.warn(`Provider ${providerName} not recognized, falling back to OpenAI.`);
        return new OpenAIProvider();
    }
  }
}

export default ProviderFactory;
