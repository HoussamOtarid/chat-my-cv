# AI Resume Chat - Implementation Plan

## ⚠️ CRITICAL: This project MUST use nextjs-15-starter-shadcn

**Starting Point**: https://github.com/siddharthamaity/nextjs-15-starter-shadcn

The starter already provides:
- Next.js 15, TypeScript 5, Tailwind CSS 4
- ESLint 9 + Prettier 3 configured
- shadcn/ui ready to use
- Dark/Light mode support
- Docker configuration
- Proper project structure

**DO NOT recreate what the starter provides. Use and extend it.**

## Overview

This plan breaks down the implementation into 4 main phases with granular, commitable steps. Each step represents a logical unit of work that can be committed independently with a clear, descriptive message.

---

## Phase 1: Foundation & Setup

### 1.1 Project Initialization
**Step 1** - Clone and setup nextjs-15-starter-shadcn
- Clone https://github.com/siddharthamaity/nextjs-15-starter-shadcn
- Remove the .git folder from cloned starter
- Copy all starter files to our project root
- Run `pnpm install` to install starter dependencies
- Verify the starter works by running `pnpm dev`
- **DO NOT** modify any starter configurations unless necessary
- **Commit**: `init: setup project with nextjs-15-starter-shadcn template`

**Step 2** - Configure development environment
- Create `.env.local.example` with all required variables
- The starter already has proper `.gitignore`
- The starter already has VSCode settings
- Only add project-specific environment variables
- **Commit**: `chore: configure environment variables for project`

**Step 3** - Install core dependencies
- Add Supabase client libraries
- Add NextAuth.js v5
- Use native Web Crypto (AES-GCM) for encryption/decryption (no extra dep)
- Pin exact package versions to reduce churn (Next.js, React, Tailwind, Auth.js)
- **Commit**: `deps: add core dependencies and configure native Web Crypto`

### 1.2 Supabase Setup
**Step 4** - Initialize Supabase configuration
- Create Supabase client utilities (`src/lib/supabase.ts`)
- Add server and browser client factories
- Configure service role client for admin operations
- **Commit**: `feat: setup Supabase client configuration`

**Step 5** - Create database schema
- Create SQL file with all tables (`configuration`, `resume`, `chat_session`, `chat_message`)
- Add indexes and constraints (including `(session_id, client_message_id)` unique)
- Enable RLS with deny-all policies on all tables
- All DB access happens via server route handlers using `SUPABASE_SERVICE_ROLE_KEY`
- **Commit**: `db: add database schema with tables, indexes, and RLS policies`

### 1.3 TypeScript & Project Structure
**Step 6** - Setup TypeScript types
- Create base type definitions (`src/types/index.ts`)
- Add database types from Supabase
- Configure strict TypeScript settings
- **Commit**: `types: add TypeScript definitions and strict config`

**Step 7** - Create project structure
- Setup folder structure as per specs
- Add barrel exports for each module
- Create placeholder files for major components
- **Commit**: `chore: establish project folder structure`

---

## Phase 2: Authentication & Admin Foundation

### 2.1 NextAuth Configuration
**Step 8** - Setup NextAuth.js
- Configure credentials provider with env-based admin
- Create auth utilities (`src/lib/auth.ts`)
- Add session types and callbacks
- **Commit**: `feat: configure NextAuth with credentials provider`

**Step 9** - Create auth API routes
- Add `app/api/auth/[...nextauth]/route.ts`
- Configure session handling
- Add CSRF protection
- **Commit**: `feat: add NextAuth API routes and session handling`

**Step 10** - Implement auth middleware
- Create `src/middleware.ts` for protected routes
- Configure admin route protection
- Add redirect logic for unauthenticated users
- **Commit**: `feat: add authentication middleware for admin routes`

### 2.2 Admin Layout & UI
**Step 11** - Install shadcn/ui components
- Initialize shadcn/ui with `components.json`
- Install essential components (button, card, form, input, label, dialog)
- Configure Tailwind CSS
- **Commit**: `ui: setup shadcn/ui with essential components`

**Step 12** - Create admin layout
- Build `app/admin/layout.tsx` with sidebar
- Add navigation structure
- Implement responsive design
- **Commit**: `feat: create admin layout with navigation`

**Step 13** - Build login page
- Create login form component
- Add form validation
- Implement error handling
- **Commit**: `feat: add admin login page with form validation`

### 2.3 Configuration Management
**Step 14** - Create encryption utilities
- Implement encryption/decryption functions (`src/lib/encryption.ts`)
- Add key validation
- Create tests for encryption
- **Commit**: `feat: add encryption utilities for sensitive data`

**Step 15** - Build configuration API routes
- Create `app/api/admin/config/route.ts` for GET/PUT
- Add LLM provider configuration endpoint
- Implement configuration validation
- **Commit**: `feat: add admin configuration API endpoints`

**Step 16** - Create admin dashboard
- Build minimal dashboard page (`app/admin/page.tsx`)
- Add configuration form for LLM settings
- Implement provider selection (OpenAI/Anthropic)
- **Commit**: `feat: create admin dashboard with LLM configuration`

---

## Phase 3: Resume Management & Processing

### 3.1 File Upload Infrastructure
**Step 17** - Setup Supabase Storage
- Configure storage bucket for resumes
- Add bucket policies for private access (serve via signed URLs only if needed)
- Create storage utilities
- **Commit**: `feat: configure Supabase Storage for resume files`

**Step 18** - Create upload API endpoint
- Build `app/api/admin/resume/upload/route.ts`
- Add file validation (PDF only, size limits)
- Implement multipart form handling
- **Commit**: `feat: add resume upload API with validation`

### 3.2 PDF Processing
**Step 19** - Setup LangChain PDF processing
- Install LangChain and PDF dependencies
- Create PDF loader utility (`src/lib/langchain.ts`)
- Add text extraction logic
- **Commit**: `deps: add LangChain and PDF processing libraries`

**Step 20** - Implement resume processing pipeline
- Extract text from uploaded PDFs
- Store content in database
- Handle processing errors
- **Commit**: `feat: implement PDF text extraction pipeline`

### 3.3 Resume Management UI
**Step 21** - Build resume upload component
- Create drag-and-drop uploader (`src/components/admin/ResumeUploader.tsx`)
- Add upload progress indicator
- Implement error handling
- **Commit**: `feat: create resume upload component with drag-and-drop`

**Step 22** - Create resume preview component
- Build preview UI (`src/components/admin/ResumePreview.tsx`)
- Display extracted text
- Add delete functionality
- **Commit**: `feat: add resume preview and management UI`

**Step 23** - Complete resume management page
- Create `app/admin/resume/page.tsx`
- Integrate upload and preview components
- Add active resume toggle
- **Commit**: `feat: complete resume management admin page`

---

## Phase 4: Chat Interface & AI Integration

### 4.1 Chat UI Components
**Step 24** - Install additional UI components
- Add remaining shadcn components (textarea, toast, select)
- Configure toast provider
- Setup theme provider
- **Commit**: `ui: add remaining shadcn components for chat interface`

**Step 25** - Build chat message components
- Create `MessageBubble.tsx` component
- Add `MessageList.tsx` with virtualization
- Implement auto-scroll behavior
- **Commit**: `feat: create chat message display components`

**Step 26** - Create chat input component
- Build `ChatInput.tsx` with textarea
- Add send button and keyboard shortcuts
- Implement input validation
- **Commit**: `feat: add chat input component with controls`

**Step 27** - Build streaming indicator
- Create typing animation component
- Add token-by-token display logic
- Implement smooth transitions
- **Commit**: `feat: add streaming indicator for AI responses`

### 4.2 LangChain & LLM Integration
**Step 28** - Setup LangChain configuration
- Create LLM provider factory
- Configure OpenAI and Anthropic clients
- Add model selection logic
- **Commit**: `feat: setup LangChain with LLM providers`

**Step 29** - Build prompt templates
- Create system prompt that always includes full resume content (no chunking, no token counting)
- Keep prompts simple; rely on localStorage history only for UI (no server-side memory optimizations)
- **Commit**: `feat: create simple prompt templates using full resume content`

### 4.3 SSE Streaming Implementation
**Step 30** - Create SSE streaming endpoint
- Build `app/api/chat/stream/route.ts` with Node.js runtime
- Implement ReadableStream for SSE; emit `token`, `done`, and `error` events
- On stream completion, log the assistant message server-side (async DB insert)
- Add error handling and cleanup
- **Commit**: `feat: implement SSE endpoint for streaming chat`

**Step 31** - Add client-side SSE handling
- Create SSE client utilities
- Implement reconnection logic with backoff
- Add message parsing and error handling
- **Commit**: `feat: add client-side SSE handling with reconnection`

### 4.4 Session & Storage Management
**Step 32** - Implement localStorage session management
- Create session utilities for client-side storage
- Add message history management (UI only)
- Implement stable `client_id` generation and persistence in localStorage
- Generate `client_message_id` (UUID) per message for dedupe
- **Commit**: `feat: add localStorage-based session management`

**Step 33** - Build async message archival
- Create `app/api/ingest/messages/route.ts`
- Respond 202 quickly and perform DB writes without blocking UI
- Upsert `chat_session` by `client_id`; enforce unique `(session_id, client_message_id)`
- Implement batch message insertion with deduplication and small client-side retry queue
- Optionally compute `ip_hash` using `IP_HASH_SALT` (avoid storing raw IP)
- **Commit**: `feat: add async message archival to database`

### 4.5 Rate Limiting
**Step 34** - Setup Upstash rate limiting
- Install Upstash Redis client
- Configure rate limiter
- Create rate limiting utilities
- **Commit**: `deps: add Upstash rate limiting`

**Step 35** - Implement rate limiting middleware
- Add IP-based rate limiting to chat endpoint only (exclude ingest endpoint)
- Configure limits via environment variables; key on IP (optionally combine with `client_id`)
- Add rate limit headers to chat responses
- **Commit**: `feat: implement rate limiting for chat API`

### 4.6 Chat Interface Assembly
**Step 36** - Create suggested questions component
- Build `SuggestedQuestions.tsx`
- Add default questions about resume
- Implement click-to-send functionality
- **Commit**: `feat: add suggested questions component`

**Step 37** - Assemble main chat interface
- Create `ChatInterface.tsx` container
- Wire up all chat components
- Add loading and error states
- **Commit**: `feat: assemble complete chat interface`

**Step 38** - Create public chat page
- Build `app/(public)/page.tsx`
- Integrate chat interface
- Add mobile responsiveness
- **Commit**: `feat: create public chat page with full interface`

---

## Phase 5: Polish & Production Ready

### 5.1 Public API Endpoints
**Step 39** - Add resume context endpoint
- Create `app/api/resume/current/route.ts`
- Return active resume content
- Add caching headers
- **Commit**: `feat: add public endpoint for resume context`

**Step 40** - Create suggestions endpoint
- Build `app/api/chat/suggestions/route.ts`
- Return contextual questions
- Add variety to suggestions
- **Commit**: `feat: add API endpoint for chat suggestions`

### 5.2 UI Polish
**Step 41** - Add dark mode support
- Configure theme provider
- Add theme toggle component
- Ensure all components support themes
- **Commit**: `feat: implement dark mode support`

**Step 42** - Create layout components
- Build `Header.tsx` with branding
- Add `Footer.tsx` with minimal info
- Create `MobileNav.tsx` for mobile menu
- **Commit**: `feat: add layout components for header and footer`

**Step 43** - Enhance mobile experience
- Optimize touch interactions
- Add viewport meta tags
- Improve responsive breakpoints
- **Commit**: `fix: optimize mobile experience and responsiveness`

### 5.3 Error Handling & Edge Cases
**Step 44** - Add comprehensive error handling
- Create error boundary components
- Add fallback UI for failures
- Implement retry mechanisms
- **Commit**: `feat: add error boundaries and fallback UI`

**Step 45** - Handle edge cases
- Add empty states for no resume
- Handle LLM API failures gracefully
- Add connection status indicators
- **Commit**: `fix: handle edge cases and API failures`

### 5.4 Performance & SEO
**Step 46** - Optimize performance
- Add lazy loading for components
- Implement code splitting
- Optimize bundle size
- **Commit**: `perf: optimize bundle size and loading performance`

**Step 47** - Add SEO and metadata
- Configure metadata in layout
- Add Open Graph tags
- Create robots.txt and sitemap
- **Commit**: `feat: add SEO metadata and social sharing tags`

### 5.5 Testing & Documentation
**Step 48** - Add configuration for production
- Create production environment example
- Add deployment configuration
- Update build scripts
- **Commit**: `chore: add production configuration and build setup`

**Step 49** - Create user documentation
- Add README with setup instructions
- Document environment variables
- Create deployment guide
- **Commit**: `docs: add setup and deployment documentation`

**Step 50** - Final testing and fixes
- Test all critical paths
- Fix any remaining bugs
- Ensure TypeScript has no errors
- **Commit**: `fix: final bug fixes and testing cleanup`

---

## Summary

### Phase Distribution
- **Phase 1 (Foundation)**: 7 commits - Core setup and infrastructure
- **Phase 2 (Auth & Admin)**: 9 commits - Authentication and admin panel
- **Phase 3 (Resume)**: 7 commits - Resume upload and processing
- **Phase 4 (Chat)**: 15 commits - Chat interface and AI integration  
- **Phase 5 (Polish)**: 12 commits - Polish, optimization, and production readiness

### Total: 50 commits

### Estimated Timeline
- **Phase 1**: 0.5 days
- **Phase 2**: 1.5 days
- **Phase 3**: 1 day
- **Phase 4**: 2 days
- **Phase 5**: 1 day

**Total**: ~6 days of focused development

### Key Milestones
1. **After Phase 1**: Basic project structure ready
2. **After Phase 2**: Admin can login and configure settings
3. **After Phase 3**: Resume upload and processing working
4. **After Phase 4**: Full chat functionality operational
5. **After Phase 5**: Production-ready application

### Development Tips
- Test each phase thoroughly before moving to the next
- Keep commits atomic and focused on single features
- Run linting and type checking after each phase
- Deploy to staging after Phase 3 for early testing
- Consider feature flags for gradual rollout

### Risk Mitigation
- **LLM API Issues**: Test with both providers early (Phase 2)
- **SSE Complexity**: Have fallback to polling if needed
- **Rate Limiting**: Test with actual Upstash early
- **PDF Processing**: Test with various PDF formats
- **Mobile Performance**: Test on real devices after Phase 4
