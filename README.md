#  AI Playground

An AI Model Playground web app where users enter a single prompt and instantly see responses from multiple AI models side-by-side.  
Supports real-time streaming, session management, quotas, authentication, and extensible AI provider integration.

---

##  Backend Setup (NestJS)

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Environment variables (`.env.example`)
```env
# General
PORT=8080
NODE_ENV=development

# Auth
JWT_SECRET= your_secret

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname


# AI Providers
OPENAI_API_KEY=sk-xxx
OPENROUTER_API_KEY=sk-xxx   # optional

# CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Run development server
```bash
npm run start:dev
```

### 4. Production build
```bash
npm run build
PORT=8080 npm run start:prod
```

---

##  Backend Features

###  Authentication & Accounts
- **Register / Login** endpoints with JWT + secure httpOnly cookies  
- **Quota system** per account (stored in DB, checked on each request)  
- **Logout** endpoint clears cookie  

---

###  Session Management
- `/sessions` → **POST**: create a new comparison session  
- `/sessions/:id` → **GET**: retrieve session details (prompt, results, metrics)  
- `/sessions` → **GET**: list sessions for authenticated user  
- `/sessions/:id/stream` → **GET (SSE)**: live stream model outputs chunk-by-chunk  

---

###  AI Provider Integration
- `OpenAI` and `OpenRouter` integrated via provider interface  
- Easy to extend (Claude, Gemini, local LLMs)  
- Providers return standardized streaming format (text chunks + metadata)  

---

### ⚡Real-time Streaming
- Uses **Server-Sent Events (SSE)** for chunk-by-chunk output  
- Each model streams independently → UI updates in real time  
- Supports status updates (`pending → streaming → complete` or `error`)  

---

###  Error Handling
- Graceful handling of:
  - API rate limits (retry with backoff)  
  - Connection timeouts  
  - Model/provider failures  
- Clear error payload returned to frontend  

---

###  Data Storage
- **Prisma ORM** with PostgreSQL:  
  - Users (id, email, hashedPassword, quotaRemaining)  
  - Sessions (id, userId, prompt, createdAt)  
  - Responses (id, sessionId, model, text, duration, cost, status)  
- Stores metrics per session (response time, token usage, model cost)  

---

###  Quota Limits
- Each account has a **quota counter** (e.g., daily tokens or requests)  
- Backend checks quota before starting a session  
- Rejects if quota exceeded → returns structured error (`402 Payment Required`)  
- Quota can be replenished manually or via subscription plan  

---


## Scripts

### Backend
```bash
npm run start:dev   # dev mode
npm run build       # build TS → dist
npm run start:prod  # run compiled code
npm run seed        # seed database
```


---

## Tech Stack

- **Backend**: NestJS, Prisma, PostgreSQL, Redis, JWT Auth  
- **Frontend**: Next.js 14, React, Tailwind, SWR  
- **AI Providers**: OpenAI, OpenRouter, (extensible to Anthropic, Gemini)  
- **Deployment**: Railway (backend), Vercel (frontend)  
