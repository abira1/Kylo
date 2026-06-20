# Claude API Backend Integration Guide

**Important:** Claude API must run on backend ONLY. Never expose the API key in frontend code.

---

## 🚨 API Key Security

**Your Claude API Key:**  
`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`

**Store in Vercel environment:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-DBHMOIYo_y-kEN3Trpw3wHpBmPtvk68e...
```

**Never:**
- ❌ Commit to Git
- ❌ Store in `.env` file that gets pushed
- ❌ Expose in frontend code
- ❌ Include in error messages to users

**Always:**
- ✅ Use environment variables
- ✅ Verify ANTHROPIC_API_KEY exists before using
- ✅ Rotate key if exposed

---

## 🏗️ Backend Architecture

### API Endpoints to Implement

All endpoints should be Vercel serverless functions in `api/` directory.

#### 1. Chat API
```
POST /api/chat
Content-Type: application/json

{
  "clientId": "string",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "qaContext": [
    {
      "id": "qa-1",
      "question": "...",
      "answer": "...",
      "category": "pricing"
    }
  ]
}

Response:
{
  "message": "AI response text",
  "usage": {
    "inputTokens": 150,
    "outputTokens": 75
  }
}
```

**Implementation:**
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { clientId, messages, qaContext } = req.body;

    // Build system prompt with Q&A context
    const qaText = qaContext
      .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join("\n\n");

    const systemPrompt = `You are a helpful AI assistant for a customer support chatbot.

Context Information:
${qaText}

Instructions:
- Answer questions based on the context provided above
- Be concise and helpful
- If you don't know the answer, say "I don't have that information"
- After 3-4 interactions, suggest the user "Ready to get started?"`;

    // Call Claude API
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    return res.status(200).json({
      message: assistantMessage,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("Claude API error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
}
```

#### 2. Passport Extraction API
```
POST /api/passport/extract
Content-Type: application/json

{
  "clientId": "string",
  "imageUrl": "https://..."
}

Response:
{
  "passportNumber": "...",
  "firstName": "...",
  "lastName": "...",
  "dateOfBirth": "...",
  "expiry": "...",
  "nationality": "...",
  ...
}
```

**Implementation:**
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { clientId, imageUrl } = req.body;

    // Call Claude Vision API
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: imageUrl,
              },
            },
            {
              type: "text",
              text: `Extract all information from this passport image. Return JSON with these fields:
{
  "passportNumber": string,
  "firstName": string,
  "lastName": string,
  "dateOfBirth": string (YYYY-MM-DD),
  "expiryDate": string (YYYY-MM-DD),
  "nationality": string,
  "gender": string,
  "issueDate": string (YYYY-MM-DD),
  "authority": string
}

If any field cannot be read clearly, use null.`,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from API");
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    const passportData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return res.status(200).json(passportData);
  } catch (error) {
    console.error("Passport extraction error:", error);
    return res.status(500).json({ error: "Failed to extract passport info" });
  }
}
```

#### 3. Lead Capture Webhook
```
POST /api/leads
Content-Type: application/json

{
  "clientId": "string",
  "visitorName": "string",
  "email": "string",
  "phone": "string",
  "source": "Website Widget | WhatsApp | Email",
  "score": number
}
```

---

## 📊 Claude Model Configuration

**Model:** `claude-sonnet-4-6`

**Key Parameters:**
```typescript
{
  model: "claude-sonnet-4-6",
  max_tokens: 800,           // Keep responses concise
  temperature: 0.7,          // Natural but not hallucinating
  top_p: 0.95,              // Standard diversity
  // system: "..."           // System prompt with context
}
```

**Cost Optimization:**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- Max 800 tokens per response = ~$0.02 per chat
- Enable prompt caching to reduce token costs by ~90%

---

## 🔄 Q&A Retrieval Pattern

The frontend sends Q&A context with each request:

```typescript
// 1. User types message
// 2. Frontend retrieves matching Q&As from Firebase
const qaContext = await retrieveQAs(userMessage, clientId);

// 3. Frontend sends to backend with conversation
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    clientId,
    messages,
    qaContext  // ← Q&As injected into system prompt
  })
});
```

**Retrieval Algorithm:**
```typescript
async function retrieveQAs(userMessage, clientId) {
  // 1. Extract keywords from user message
  const keywords = extractKeywords(userMessage);
  
  // 2. Query Firestore for matching Q&As
  const qaRef = ref(database, `qa`);
  const qas = await get(qaRef);
  
  // 3. Score by keyword matches + usage count
  const scored = qas
    .filter(qa => keywords.some(kw => qa.question.includes(kw)))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 8); // Top 8
  
  return scored;
}
```

---

## 🚀 Deployment to Vercel

### 1. Create `api/chat.ts`
```bash
mkdir api
touch api/chat.ts
```

### 2. Add to `.env.production`
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Deploy
```bash
vercel deploy
```

### 4. Update Frontend API URL
Update `.env.local`:
```
VITE_API_BASE_URL=https://your-vercel-deployment.vercel.app
```

---

## 📝 System Prompt Template

```
You are [Company Name] AI Assistant.

Your Role:
- Provide helpful information about our products/services
- Answer common questions
- Collect contact information when user shows interest
- Be professional yet friendly

Company Information:
[Injected from Q&A context]

Conversation Guidelines:
- Keep responses under 150 words
- Use conversational tone
- Ask clarifying questions if needed
- After 3+ messages, gently suggest next steps

When to Suggest Contact:
- User asks about pricing
- User mentions pain point we solve
- User uses keywords: "ready", "apply", "start"
```

---

## 🧪 Testing Claude Integration

### Using cURL
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-client",
    "messages": [
      {"role": "user", "content": "What is your pricing?"}
    ],
    "qaContext": [
      {
        "question": "What pricing plans do you offer?",
        "answer": "We offer Starter, Pro, and Enterprise plans starting at $99/month"
      }
    ]
  }'
```

### Using Frontend
```typescript
import { callClaudeAPI } from '../../services/claudeApi';

const response = await callClaudeAPI(
  clientId,
  [{ role: 'user', content: 'Hello!' }],
  []
);

console.log(response.message);
```

---

## ⚠️ Error Handling

```typescript
try {
  const response = await client.messages.create({...});
} catch (error) {
  if (error.status === 401) {
    console.error('Invalid API key');
    // Check ANTHROPIC_API_KEY
  } else if (error.status === 429) {
    console.error('Rate limited');
    // Implement exponential backoff
  } else if (error.status === 500) {
    console.error('Claude API error');
    // Retry with backoff
  }
}
```

---

## 📚 Resources

- Anthropic Docs: https://docs.anthropic.com
- Claude API: https://console.anthropic.com
- Vercel Functions: https://vercel.com/docs/functions/serverless-functions

---

## ✅ Checklist

- [ ] Install `@anthropic-ai/sdk` in backend
- [ ] Create `/api/chat.ts` endpoint
- [ ] Create `/api/passport/extract.ts` endpoint
- [ ] Add `ANTHROPIC_API_KEY` to Vercel environment
- [ ] Test Claude API with cURL
- [ ] Test from frontend
- [ ] Deploy to Vercel
- [ ] Update `VITE_API_BASE_URL` to production URL

---

**Status:** Ready to implement  
**Next:** Create Vercel serverless functions
