const { getOrCreateClient, getMergedKB } = require('./firebaseService');
const { buildWebSystemPrompt } = require('../prompts/uaeAgentSystemPrompt');
const { PASSPORT_COLLECTION_PROMPT } = require('../prompts/passportCollectionPrompt');

/**
 * Convert array or object to array
 */
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

/**
 * Build system prompt with client-specific context
 */
async function buildSystemPrompt(clientId, qaContext = [], messageCount = 0) {
  try {
    const client = await getOrCreateClient(clientId);
    const kb = await getMergedKB(clientId);

    // For new conversations (0-2 messages), use the simpler passport collection prompt
    // This allows users to choose between upload or manual entry
    if (messageCount <= 2) {
      let passportPrompt = PASSPORT_COLLECTION_PROMPT;
      
      // Add any client-specific knowledge to the passport prompt
      const allQA = [...toArray(qaContext), ...toArray(kb?.faqs || [])];
      if (allQA.length > 0) {
        passportPrompt += '\n\nKNOWLEDGE BASE:\n';
        allQA.forEach((item, i) => {
          const q = item?.question || 'Unknown question';
          const a = item?.answer || 'Unknown answer';
          passportPrompt += `${i + 1}. Q: ${q}\nA: ${a}\n\n`;
        });
      }
      
      return passportPrompt;
    }

    // Merge provided qaContext with merged KB - ensure arrays
    const allQA = [...toArray(qaContext), ...toArray(kb?.faqs || [])];

    // Build the CSP-specific knowledge block (FAQs + documents + extra instructions).
    let clientContext = '';

    if (allQA.length > 0) {
      clientContext += 'QUICK REFERENCE (Q&A):\n';
      allQA.forEach((item, i) => {
        const q = item?.question || 'Unknown question';
        const a = item?.answer || 'Unknown answer';
        clientContext += `${i + 1}. Q: ${q}\n   A: ${a}\n\n`;
      });
    }

    // Add raw documents if available (uploaded knowledge)
    const documents = toArray(kb?.documents || []);
    if (documents.length > 0) {
      clientContext += '\nKNOWLEDGE DOCUMENTS:\n';
      documents.forEach((doc, i) => {
        clientContext += `\n[Document ${i + 1}: ${doc.title}]\n${doc.content}\n`;
      });
    }

    // Add client-specific instructions if they exist
    if (client.systemPromptAddition) {
      clientContext += `\nADDITIONAL INSTRUCTIONS:\n${client.systemPromptAddition}`;
    }

    // Opt-out hatch: a client can fall back to the generic assistant persona by
    // setting `useGenericAssistant: true` on their client document.
    if (client.useGenericAssistant) {
      let prompt = `You are a helpful AI assistant for ${client.displayName || client.name}.

Your role is to provide professional, accurate, and helpful responses based on the knowledge provided below.
When answering questions, synthesize information from the knowledge base and present it in a clear, 
professional manner without simply copying content.`;
      if (clientContext) {
        prompt += `\n\n${clientContext}`;
      }
      return prompt;
    }

    // Default: the AS AI UAE License & Visa Application Agent (v2.0) persona,
    // adapted for the web chat channel, with this CSP's knowledge appended.
    return buildWebSystemPrompt(clientContext);
  } catch (error) {
    console.error('[MULTITENANT] Error building prompt:', error.message);
    throw error;
  }
}

/**
 * Validate client access (auto-provisions new clients)
 */
async function validateClientAccess(clientId, token = null) {
  try {
    const client = await getOrCreateClient(clientId);
    
    // If token provided, validate it (optional)
    if (token) {
      // TODO: Implement token validation logic
    }
    
    return client;
  } catch (error) {
    throw new Error(`Access denied: ${error.message}`);
  }
}

module.exports = {
  buildSystemPrompt,
  validateClientAccess
};
