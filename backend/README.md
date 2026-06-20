# KYLO AI Backend Setup

This backend server handles secure Claude API calls from the frontend.

## Prerequisites

- Node.js 18+ installed
- Claude API key from [Anthropic](https://console.anthropic.com)

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` and add your Claude API key:**
   ```bash
   CLAUDE_API_KEY=sk-ant-your-key-here
   PORT=3001
   ```

## Running the Backend

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### POST /api/chat
Send a message and get a response from Claude.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" }
  ],
  "qaContext": [
    {
      "id": "doc1",
      "question": "What is KYLO?",
      "answer": "KYLO is an AI support platform",
      "category": "general",
      "usage": 0,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Claude's response here",
  "usage": {
    "inputTokens": 150,
    "outputTokens": 100
  }
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "claudeApiConfigured": true
}
```

## Running Frontend + Backend Together

From the root directory:
```bash
npm run dev:full
```

This will start both:
- Frontend on http://localhost:5174
- Backend on http://localhost:3001

## Troubleshooting

**Backend not connecting:**
- Make sure backend is running: `npm run dev` in the `backend` folder
- Check if port 3001 is available
- Verify CLAUDE_API_KEY is set in `.env`

**API key errors:**
- Verify your Claude API key is correct
- Check that the key starts with `sk-ant-`
- Ensure you have access to the Claude 3.5 Sonnet model

**CORS errors:**
- Make sure the frontend URL is in the CORS allowlist in `server.js`
- Default allowed origins: localhost:5173, localhost:5174, localhost:3000
