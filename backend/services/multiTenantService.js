const { getOrCreateClient, getMergedKB } = require('./firebaseService');

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
async function buildSystemPrompt(clientId, qaContext = []) {
  try {
    const client = await getOrCreateClient(clientId);
    const kb = await getMergedKB(clientId);
    
    // Merge provided qaContext with merged KB - ensure arrays
    const allQA = [...toArray(qaContext), ...toArray(kb?.faqs || [])];
    
    let prompt = `You are a helpful AI assistant for ${client.displayName || client.name}.

Your role is to provide professional, accurate, and helpful responses based on the knowledge provided below.
When answering questions, synthesize information from the knowledge base and present it in a clear, 
professional manner without simply copying content.`;
    
    // Add Q&A knowledge base if available
    if (allQA.length > 0) {
      prompt += '\n\nQUICK REFERENCE (Q&A):\n';
      allQA.forEach((item, i) => {
        const q = item?.question || 'Unknown question';
        const a = item?.answer || 'Unknown answer';
        prompt += `${i + 1}. Q: ${q}\n   A: ${a}\n\n`;
      });
    }
    
    // Add raw documents if available (uploaded knowledge)
    const documents = toArray(kb?.documents || []);
    if (documents.length > 0) {
      prompt += '\n\nKNOWLEDGE DOCUMENTS:\n';
      documents.forEach((doc, i) => {
        prompt += `\n[Document ${i + 1}: ${doc.title}]\n${doc.content}\n`;
      });
    }
    
    // Add client-specific instructions if they exist
    if (client.systemPromptAddition) {
      prompt += `\n\nADDITIONAL INSTRUCTIONS:\n${client.systemPromptAddition}`;
    }
    
    return prompt;
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
