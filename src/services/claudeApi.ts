/**
 * Claude API Service - Multi-Tenant
 * 
 * IMPORTANT: The Claude API key should NEVER be exposed in frontend code.
 * This service calls backend endpoints that handle Claude API calls.
 * 
 * For development, you can run a local backend server with the Claude API key,
 * or use Vercel serverless functions with environment variables.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  clientId?: string;
  conversationId?: string;
}

export interface QAItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  usage?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Determine API base URL based on environment
 * - Development: use localhost:5001
 * - Production: use VITE_API_BASE_URL or show helpful error
 */
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('5173')
  );
  
  if (envUrl) {
    return envUrl;
  }
  
  if (isLocalhost) {
    return 'http://localhost:5001';
  }
  
  // For production without backend configured, use a fallback
  // This will fail gracefully with an error message
  return 'http://backend-not-configured.local';
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Generate unique conversation ID
 */
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Call Claude API through backend endpoint (Multi-tenant)
 * 
 * @param clientId - The client/organization ID
 * @param conversationId - Unique conversation ID
 * @param messages - Conversation history
 * @param qaContext - Additional Q&A items for context
 * @returns Claude's response
 */
export const callClaudeAPI = async (
  clientId: string,
  conversationId: string,
  messages: ChatMessage[],
  qaContext: QAItem[] = []
): Promise<ChatResponse> => {
  try {
    if (!clientId) {
      throw new Error('clientId is required');
    }
    if (!conversationId) {
      throw new Error('conversationId is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        conversationId,
        messages,
        qaContext,
      }),
    });

    if (!response.ok) {
      // Check for backend not configured error
      if (API_BASE_URL.includes('backend-not-configured')) {
        const error = new Error('Backend server not configured for production. Please ensure your backend is deployed to a public URL.');
        (error as any).isConfigurationError = true;
        throw error;
      }
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error - backend not reachable
      const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
      const message = isProduction
        ? 'Backend Connection Error\n\nThe backend server is not accessible. This could be because:\n1. The backend server is not deployed\n2. The backend URL is not configured\n3. Network connectivity issue\n\nPlease ensure your backend is running and accessible.'
        : 'Backend Connection Error\n\nMake sure your backend server is running:\nnpm run dev:backend (or PORT=5001 node server-clean.js)';
      
      const customError = new Error(message);
      (customError as any).isNetworkError = true;
      (customError as any).originalError = error;
      console.error('Backend connection error:', error);
      throw customError;
    }
    
    console.error('Error calling Claude API:', error);
    throw error;
  }
};

/**
 * Process a user message with Q&A context (Multi-tenant)
 */
export const processUserMessage = async (
  clientId: string,
  conversationId: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  qaContext: QAItem[] = []
): Promise<ChatResponse> => {
  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  return callClaudeAPI(clientId, conversationId, messages, qaContext);
};

/**
 * Get conversation history from backend
 */
export const getConversationHistory = async (
  clientId: string,
  conversationId: string
): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${clientId}/${conversationId}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Error fetching conversation: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }
};

/**
 * Get client's knowledge base
 */
export const getClientKB = async (clientId: string): Promise<QAItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/kb`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error fetching KB: ${response.statusText}`);
    }

    const data = await response.json();
    return data.faqs || [];
  } catch (error) {
    console.error('Error fetching client KB:', error);
    return [];
  }
};

/**
 * Add/update KB item
 */
export const upsertKBItem = async (
  clientId: string,
  item: Partial<QAItem>
): Promise<{ success: boolean; message: string; id: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/kb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`Error updating KB: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating KB item:', error);
    throw error;
  }
};

/**
 * Delete KB item
 */
export const deleteKBItem = async (clientId: string, itemId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/kb/${itemId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error deleting KB item: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting KB item:', error);
    throw error;
  }
};

/**
 * Extract passport information using Claude Vision API
 * 
 * @param clientId - The client/organization ID
 * @param imageUrl - URL to the passport image
 * @returns Extracted passport data
 */
export const extractPassportInfo = async (
  clientId: string,
  imageUrl: string
): Promise<Record<string, string>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/passport/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        imageUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Passport extraction error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error extracting passport info:', error);
    throw error;
  }
};

/**
 * Detect if user message contains intent to purchase
 * 
 * @param message - The user's message
 * @returns Whether purchase intent was detected
 */
export const detectPurchaseIntent = (message: string): boolean => {
  const purchaseKeywords = [
    'ready',
    'apply',
    'start',
    'subscribe',
    'sign up',
    'get started',
    'purchase',
    'buy',
    'how much',
    'pricing',
    'cost',
    'plan',
  ];

  const lowerMessage = message.toLowerCase();
  return purchaseKeywords.some((keyword) => lowerMessage.includes(keyword));
};

/**
 * Detect if conversation should be escalated to human
 * 
 * @param message - The user's message
 * @returns Whether escalation is needed
 */
export const detectEscalationNeeded = (message: string): boolean => {
  const escalationKeywords = [
    'agent',
    'human',
    'support',
    'help',
    'complaint',
    'problem',
    'issue',
    'error',
    'not working',
    'broken',
  ];

  const lowerMessage = message.toLowerCase();
  return escalationKeywords.some((keyword) => lowerMessage.includes(keyword));
};

/**
 * Calculate lead score based on conversation
 * 
 * @param messageCount - Number of messages in conversation
 * @param purchaseIntentDetected - Whether purchase intent was detected
 * @param interactionTime - How long they've been interacting (minutes)
 * @returns Score from 0-100
 */
export const calculateLeadScore = (
  messageCount: number,
  purchaseIntentDetected: boolean = false,
  interactionTime: number = 0
): number => {
  let score = 0;

  // Base score for engagement
  score += Math.min(messageCount * 10, 30);

  // Bonus for purchase intent
  if (purchaseIntentDetected) {
    score += 40;
  }

  // Bonus for time spent
  if (interactionTime > 5) {
    score += 15;
  }
  if (interactionTime > 15) {
    score += 15;
  }

  return Math.min(score, 100);
};
