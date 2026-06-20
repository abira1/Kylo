/**
 * Claude Service
 * Manages all interactions with Claude API for multi-turn conversations
 * 
 * Handles:
 * - Message formatting and history management
 * - Tool use request parsing
 * - Model selection (Haiku for chat, Opus for vision)
 * - Error handling and retries
 */

const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable not set');
    }

    this.client = new Anthropic({ apiKey });
    this.conversationHistories = new Map(); // Store multi-turn histories by sessionId
    
    // Model configuration
    this.models = {
      chat: 'claude-3-5-haiku-20241022', // Fast, efficient for conversation
      vision: 'claude-opus-4-1-20250805', // Powerful for document analysis
    };

    console.log('[CLAUDE_SERVICE] Initialized with API key');
  }

  /**
   * Send a message to Claude and get a response
   * @param {Array} messages - Message history in Claude format
   * @param {Object} options - Optional configuration
   * @returns {Promise<string>} Claude's response
   */
  async chat(messages, options = {}) {
    try {
      const {
        model = this.models.chat,
        maxTokens = 2048,
        temperature = 0.7,
        tools = null,
        systemPrompt = this.getDefaultSystemPrompt(),
      } = options;

      console.log('[CLAUDE_SERVICE] Sending message to Claude');

      const requestBody = {
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages,
      };

      // Add tools if provided
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
      }

      // Make API call
      const response = await this.client.messages.create(requestBody);

      console.log('[CLAUDE_SERVICE] Response received');

      // Extract response text
      let responseText = '';
      
      if (response.content && Array.isArray(response.content)) {
        for (const block of response.content) {
          if (block.type === 'text') {
            responseText += block.text;
          } else if (block.type === 'tool_use') {
            // Include tool use blocks in response for parsing
            responseText += `<tool_use id="${block.id}" name="${block.name}">` +
                           `${JSON.stringify(block.input)}</tool_use>`;
          }
        }
      }

      return responseText;
    } catch (error) {
      console.error('[CLAUDE_SERVICE] Error calling Claude:', error.message);
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Multi-turn conversation with history management
   * @param {string} sessionId - Session ID for history tracking
   * @param {string} userMessage - User's message
   * @param {Object} options - Optional configuration
   * @returns {Promise<string>} Claude's response
   */
  async conversationTurn(sessionId, userMessage, options = {}) {
    try {
      // Get or initialize conversation history
      let history = this.conversationHistories.get(sessionId) || [];

      // Add user message to history
      history.push({
        role: 'user',
        content: userMessage,
      });

      // Get response from Claude
      const response = await this.chat(history, options);

      // Add assistant response to history
      history.push({
        role: 'assistant',
        content: response,
      });

      // Keep history to reasonable size (last 20 messages)
      if (history.length > 40) {
        history = history.slice(-40);
      }

      // Save history
      this.conversationHistories.set(sessionId, history);

      console.log(`[CLAUDE_SERVICE] Conversation turn complete for session ${sessionId}`);
      return response;
    } catch (error) {
      console.error('[CLAUDE_SERVICE] Error in conversation turn:', error.message);
      throw error;
    }
  }

  /**
   * Clear conversation history for a session
   * @param {string} sessionId - Session ID
   */
  clearHistory(sessionId) {
    this.conversationHistories.delete(sessionId);
    console.log(`[CLAUDE_SERVICE] Cleared history for session ${sessionId}`);
  }

  /**
   * Get default system prompt for AS AI Agent
   * @returns {string} System prompt
   */
  getDefaultSystemPrompt() {
    return `You are AS AI Agent, a specialized WhatsApp assistant for UAE Business License and Visa applications.

Your role:
1. Guide users through an 18-step application process
2. Collect required personal, business, and financial information
3. Validate documents (passports, visas, bank statements, business licenses)
4. Extract data from documents using OCR/Vision
5. Manage multi-shareholder applications
6. Verify information and escalate to humans when needed
7. Provide multilingual support (English and Arabic)

Response Guidelines:
- Be professional, clear, and concise
- Use simple language appropriate for non-technical users
- Ask one question or request at a time
- Use emojis for visual clarity (e.g., 📄 for documents, ✅ for verification)
- Provide numbered options for choices (1️⃣, 2️⃣, 3️⃣)
- Always be helpful and patient
- Maintain context across conversation turns

When a user provides information:
1. Acknowledge their input with emojis
2. Validate against step requirements
3. Confirm understanding
4. Provide next steps
5. Use tool calls for document extraction, OTP sending, etc.

Always maintain a friendly, professional tone and ensure user data is handled securely.`;
  }

  /**
   * Build tools array for Claude to use in API calls
   * @returns {Array} Array of tool definitions
   */
  static getTools() {
    return [
      {
        name: 'send_otp',
        description: 'Send OTP verification code to user via WhatsApp and Email',
        input_schema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID'
            },
            phoneNumber: {
              type: 'string',
              description: 'User phone number in +971XXXXXXXXX format'
            },
            email: {
              type: 'string',
              description: 'User email address'
            },
            language: {
              type: 'string',
              enum: ['en', 'ar'],
              description: 'Language for OTP message'
            }
          },
          required: ['sessionId', 'phoneNumber', 'email', 'language']
        }
      },
      {
        name: 'verify_otp',
        description: 'Verify OTP code submitted by user',
        input_schema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID'
            },
            otpCode: {
              type: 'string',
              description: '6-digit OTP code'
            }
          },
          required: ['sessionId', 'otpCode']
        }
      },
      {
        name: 'extract_passport',
        description: 'Extract passport data from uploaded image using Claude Vision',
        input_schema: {
          type: 'object',
          properties: {
            imageUrl: {
              type: 'string',
              description: 'URL to passport image'
            }
          },
          required: ['imageUrl']
        }
      },
      {
        name: 'extract_bank_statement',
        description: 'Extract financial information from bank statement image',
        input_schema: {
          type: 'object',
          properties: {
            imageUrl: {
              type: 'string',
              description: 'URL to bank statement image'
            }
          },
          required: ['imageUrl']
        }
      },
      {
        name: 'escalate_to_human',
        description: 'Escalate the session to a human agent for manual review',
        input_schema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID'
            },
            reason: {
              type: 'string',
              description: 'Reason for escalation'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Escalation priority'
            }
          },
          required: ['sessionId', 'reason']
        }
      },
      {
        name: 'log_pending',
        description: 'Log a pending action or issue for later review',
        input_schema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The session ID'
            },
            itemType: {
              type: 'string',
              description: 'Type of pending item (e.g., document_verification, manual_review)'
            },
            description: {
              type: 'string',
              description: 'Description of the pending item'
            }
          },
          required: ['sessionId', 'itemType', 'description']
        }
      }
    ];
  }

  /**
   * Parse messages from Claude response that might contain tool calls
   * @param {string} response - Claude's response
   * @returns {Object} { text: string, tools: Array }
   */
  static parseResponse(response) {
    const toolRegex = /<tool_use id="([^"]+)" name="([^"]+)">(.+?)<\/tool_use>/g;
    const tools = [];
    let match;

    while ((match = toolRegex.exec(response)) !== null) {
      try {
        tools.push({
          id: match[1],
          name: match[2],
          input: JSON.parse(match[3])
        });
      } catch (e) {
        console.error('[CLAUDE_SERVICE] Error parsing tool:', e.message);
      }
    }

    // Remove tool use blocks from text
    const text = response.replace(toolRegex, '').trim();

    return { text, tools };
  }

  /**
   * Get service statistics
   * @returns {Object} Stats
   */
  getStats() {
    return {
      activeConversations: this.conversationHistories.size,
      model: this.models.chat,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new ClaudeService();
