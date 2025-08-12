# AI Resume Chat - Specifications

## ⚠️ IMPORTANT: Starter Repository Foundation

**This project MUST be built on top of the [nextjs-15-starter-shadcn](https://github.com/siddharthamaity/nextjs-15-starter-shadcn) repository.**

The starter provides:
- ✅ Next.js 15 with App Router pre-configured
- ✅ TypeScript 5 with strict settings
- ✅ Tailwind CSS 4 fully configured
- ✅ shadcn/ui components ready to install
- ✅ ESLint 9 + Prettier 3 configured
- ✅ Dark/Light mode support built-in
- ✅ Docker support included
- ✅ Optimized folder structure

**DO NOT recreate what the starter already provides. Use and extend its existing configuration.**

## Project Overview

A mobile-first web application that enables users to interact with your resume through an AI-powered chat interface. Built by extending the nextjs-15-starter-shadcn template with real-time streaming responses, admin configuration panel, and seamless resume management.

## Technical Stack

### Core Technologies

- **Framework**: Next.js 15 with App Router
- **Runtime**: React 19 with TypeScript 5.x
- **Database**: Supabase (PostgreSQL with built-in features)
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS 4
- **AI Integration**: LangChain with OpenAI/Anthropic providers
- **PDF Processing**: LangChain PDFLoader
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Real-time**: Server-Sent Events (SSE) for chat streaming
- **File Storage**: Supabase Storage
- **IDs**: UUID (v4) generated in DB using `gen_random_uuid()`
- **Server routes runtime**: Node.js for streaming, PDF parsing, and Supabase service-role access (avoid Edge for these routes)

### Development Tools

- **Code Quality**: ESLint 9 + Prettier 3
- **Package Manager**: pnpm (recommended)
- **Type Safety**: TypeScript with strict mode

## Architecture

### Project Structure
```
chat-my-cv/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Public routes group
│   │   │   └── page.tsx        # Chat interface (main page)
│   │   ├── admin/              # Admin routes (protected)
│   │   │   ├── layout.tsx      # Admin layout with sidebar
│   │   │   ├── page.tsx        # Admin dashboard (minimal settings inline)
│   │   │   └── resume/         # Resume management (single PDF)
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # NextAuth endpoints
│   │   │   ├── chat/           # Chat endpoints
│   │   │   ├── admin/          # Admin API endpoints
│   │   │   └── resume/         # Resume processing
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/             
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── chat/               # Chat-specific components
│   │   ├── admin/              # Admin panel components
│   │   └── layout/             # Layout components
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── langchain.ts        # LangChain setup with PDFLoader
│   │   ├── encryption.ts       # API key encryption
│   │   └── utils.ts            # Utility functions
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   └── middleware.ts           # Next.js middleware for auth
├── public/                     # Static assets
├── .env.local                  # Environment variables
├── components.json             # shadcn/ui configuration
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
```

## Core Features

### 1. Public Chat Interface

- **Main Route**: `/` (homepage)
- **Features**:
  - Real-time streaming AI responses using SSE
  - Mobile-responsive chat interface
  - Conversation history stored in localStorage (primary) with async DB archival
  - Rate limiting per IP address using Upstash Ratelimit (configured via env)
  - Suggested questions for easy interaction
  - Dark/light mode support

### 2. Admin Panel (MVP scope)

- **Routes**: `/admin/*` (protected with NextAuth)
- **Features**:
  - Single admin login (env-based credentials)
  - Upload one PDF resume and preview parsed text
  - LLM provider selection (OpenAI or Anthropic) and API key entry (encrypted at rest)
  - Toggle active resume

### 3. Resume Processing

- **Pipeline**:
  - Upload PDF files only
  - Extract text content using LangChain PDFLoader
  - Store full text in Supabase database
  - Use full content as context for AI responses (no chunking in MVP)
  - Optional: Add vector embeddings with Supabase Vector (post-MVP; reintroduce chunking then)

## Database Schema (Supabase)

```sql
-- Ensure UUID generation function is available
create extension if not exists pgcrypto;

-- configuration table stores app settings and encrypted secrets
create table if not exists public.configuration (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  encrypted boolean not null default false,
  updated_at timestamptz not null default now()
);

-- resume table stores the uploaded PDF metadata and extracted text
create table if not exists public.resume (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  content text not null,
  file_size integer not null,
  mime_type text not null default 'application/pdf',
  file_url text,
  uploaded_at timestamptz not null default now(),
  is_active boolean not null default true
);

create index if not exists resume_uploaded_at_idx on public.resume (uploaded_at desc);

-- chat session/message tables for async archival (UI remains localStorage-first)
create table if not exists public.chat_session (
  id uuid primary key default gen_random_uuid(),
  client_id text unique not null,            -- from localStorage
  created_at timestamptz not null default now(),
  user_agent text,
  ip_hash text                               -- optional: salted hash of IP
);

create table if not exists public.chat_message (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_session(id) on delete cascade,
  client_message_id text not null,           -- client-side UUID for dedupe
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  seq integer not null default 0,            -- client sequence per session
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  latency_ms integer,
  created_at timestamptz not null default now(),
  unique (session_id, client_message_id)
);

create index if not exists chat_message_session_created_idx on public.chat_message (session_id, created_at);
create index if not exists chat_message_session_seq_idx on public.chat_message (session_id, seq);
```

## API Routes

### Public API
```typescript
// Chat endpoints
GET  /api/chat/stream           // SSE connection for streamed chat
GET  /api/chat/suggestions      // Get suggested questions

// Resume endpoint
GET  /api/resume/current        // Get current resume context

// Ingest endpoint (async archival; non-blocking for UI)
POST /api/ingest/messages       // Batch insert of chat messages by client/session (returns 202 quickly)
```

### Admin API (Protected)
```typescript
// Authentication (handled by NextAuth)
// Configured in [...nextauth]/route.ts using env-based single admin credentials

// Configuration
GET  /api/admin/config          // Get all configuration
PUT  /api/admin/config/llm      // Update LLM settings
POST /api/admin/config/test     // Test LLM connection

// Resume management
POST /api/admin/resume/upload   // Upload new resume
GET  /api/admin/resume          // Get resume details
DELETE /api/admin/resume        // Delete resume
```

## UI Components (shadcn/ui)

### Components to Install (MVP)
```bash
# Minimal shadcn/ui set for MVP
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add toast
```

### Custom Components
```
components/
├── chat/
│   ├── ChatInterface.tsx       # Main chat container
│   ├── MessageList.tsx         # Scrollable message list
│   ├── MessageBubble.tsx       # Individual message
│   ├── ChatInput.tsx           # Input with send button
│   ├── StreamingIndicator.tsx  # Typing animation
│   └── SuggestedQuestions.tsx  # Quick action buttons
├── admin/
│   ├── AdminSidebar.tsx        # Navigation sidebar
│   ├── ConfigForm.tsx          # LLM configuration form
│   ├── ResumeUploader.tsx      # Drag-and-drop uploader
│   └── ResumePreview.tsx       # Resume content preview
└── layout/
    ├── Header.tsx               # App header with theme toggle
    ├── MobileNav.tsx            # Mobile navigation
    └── Footer.tsx               # Simple footer
```

## Implementation Approach

### Phase 1: Foundation (Day 1)
1. Clone Next.js starter template
2. Set up Supabase project (hosted or local)
3. Apply database schema in Supabase (run the SQL from "Database Schema")
4. Configure NextAuth with credentials provider
5. Install minimal shadcn/ui components
6. Set up basic layouts

### Phase 2: Admin Panel (Day 2-3)
1. Create admin authentication flow (env-based single admin)
2. Build minimal admin dashboard layout
3. Implement LLM configuration (provider + API key) and toggle active resume
4. Add resume upload and preview functionality (single PDF)

### Phase 3: Chat Interface (Day 4-5)
1. Build chat UI components
2. Implement SSE endpoint for streaming responses
3. Set up LangChain with resume context (use full resume content; no chunking in MVP)
4. Add client-side session management via localStorage (no server persistence)
5. Implement rate limiting with Upstash Ratelimit (per IP, configured via env)

### Phase 4: Polish & Testing (Day 6)
1. Mobile responsiveness testing
2. Dark mode refinement
3. Error handling
4. Performance optimization
5. Basic deployment preparation

## Key Features

- ✅ Mobile-first responsive design
- ✅ AI chat with SSE streaming
- ✅ Admin configuration panel
- ✅ PDF resume upload and management
- ✅ LLM provider selection (OpenAI/Anthropic)
- ✅ Rate limiting per IP/session (Upstash Ratelimit)
- ✅ Dark/light mode support
- ✅ TypeScript with strict mode
- ✅ Supabase integration (Database, Auth, Storage)
- ✅ Real-time updates
- ✅ Secure API key encryption

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-project-url.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Admin credentials (env-based single admin)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password"

# Encryption key for API keys
ENCRYPTION_KEY="32-character-key-for-encryption"

# File uploads
MAX_FILE_SIZE="10485760" # 10MB in bytes

# Rate limiting (Upstash Ratelimit)
UPSTASH_REDIS_REST_URL="https://us1-your-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-rest-token"
# Optional overrides for limiter behavior
RATE_LIMIT_MAX="30"            # requests per window
RATE_LIMIT_WINDOW_SECONDS="600" # 10 minutes

# Optional: salt for IP hashing in chat_session (avoid storing raw IPs)
IP_HASH_SALT="random-secret-salt"
```

## Development Commands

```bash
# Setup
pnpm install

# Development
pnpm dev                   # Start Next.js dev server

# Build
pnpm build                 # Production build
pnpm start                 # Start production server

# Database
# Apply SQL via Supabase Dashboard (SQL editor) or Supabase CLI

# Code quality
pnpm lint                  # Run ESLint
pnpm format               # Run Prettier
```

## Success Metrics

### Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Performance Score > 90

### Functionality
- Admin can configure LLM provider ✓
- Admin can upload resume ✓
- Users can chat with AI about resume ✓
- Streaming responses work smoothly ✓
- Rate limiting prevents abuse ✓
- Mobile experience is excellent ✓

### Code Quality
- TypeScript strict mode ✓
- No any types ✓
- ESLint passing ✓
- Consistent code style ✓

## Deployment Considerations

### Recommended Platforms
- **Vercel**: Optimal for Next.js (automatic optimizations)
- **Supabase**: Hosted database, auth, and storage
- **Railway/Render**: Alternative hosting options
- **Self-hosted**: Docker container option

### Production Checklist
- [ ] Environment variables configured
- [ ] Database schema applied in Supabase
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured (optional)

## Future Enhancements (Post-MVP)

1. **Vector Embeddings**: Semantic search with Supabase Vector
2. **Multi-user Support**: Multiple admin accounts with roles
3. **Analytics Dashboard**: Detailed usage metrics and insights
4. **Conversation Export**: Download chat history as PDF/JSON
5. **Custom Prompts**: Admin-configurable AI behavior
6. **Webhook Integration**: Notify on certain events
7. **API Access**: Public API for third-party integration
8. **Multiple Resumes**: Support for different resume versions
9. **Voice Input**: Speech-to-text for chat input
10. **Multi-language**: Support for multiple languages

## Technical Requirements

### Supabase Features to Utilize
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Can integrate with NextAuth or use Supabase Auth directly
- **Storage**: For PDF resume files with automatic CDN
- **Realtime**: For live updates (optional enhancement)
- **Vector Store**: For semantic search (future enhancement)

### Security and Access Control
- Enable RLS on `configuration`, `resume`, `chat_session`, `chat_message`. Default deny-all policies.
- All reads/writes go through server route handlers using `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS).
- Keep the Storage bucket for resumes private; serve files via signed URLs only if needed.

### SSE Streaming Implementation
- Use Next.js route handlers (Node runtime) to return a ReadableStream for token-by-token responses
- Implement client-side reconnection logic and backoff
- Keep messages mirrored in localStorage for session continuity
- Stream tokens as they arrive from the LLM via LangChain

### Async Conversation Archival
- UI remains localStorage-first; persistence is performed in parallel via `POST /api/ingest/messages`.
- Correlate sessions with a stable `client_id` stored in localStorage; dedupe messages via `client_message_id`.
- The ingest endpoint upserts `chat_session` by `client_id` and batch-inserts `chat_message` rows (unique `(session_id, client_message_id)`), responding 202 quickly.
- Assistant message logging should happen server-side after the SSE stream completes to avoid extra client calls.

### PDF Processing with LangChain
```typescript
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

const loader = new PDFLoader(filePath);
const docs = await loader.load();
const content = docs.map(doc => doc.pageContent).join("\n");

// MVP: use full content as context (ensure prompt stays within model token limits)
```

## Notes

- Prioritizes simplicity and speed of development
- Leverages Supabase's built-in features for faster development
- Uses Next.js native features wherever possible
- Focuses on core functionality without over-engineering
- Designed to be deployed and functional within a week
- Maintains professional quality while ensuring maintainability
