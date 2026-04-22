/**
 * Base AI Strategy Provider
 * Defines the contract all LLM integrations must follow.
 */
class AIProvider {
  /**
   * Generates a response from the AI model
   * @param {string} prompt - User message/prompt
   * @param {Object} context - Any contextual data (user phone, active flow, etc.)
   * @returns {Promise<string>} The generated reply
   */
  async generateResponse(prompt, context = {}) {
    throw new Error("Method 'generateResponse()' must be implemented.");
  }
}

export default AIProvider;
