# Supabase Database Setup

## Running Migrations

### Option 1: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `migrations/001_initial_schema.sql`
4. Paste and run the SQL

### Option 2: Using Supabase CLI

1. Install Supabase CLI:

**macOS (using Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Using npx (no installation):**
```bash
npx supabase <command>
```

**Or install as dev dependency:**
```bash
pnpm add -D supabase
```

2. Link your project:
```bash
supabase link --project-ref your-project-ref
# or with npx: npx supabase link --project-ref your-project-ref
```

3. Run migrations:
```bash
supabase db push
# or with npx: npx supabase db push
```

## Database Schema

### Tables

- **configuration**: Application settings and encrypted API keys
- **resume**: PDF resumes and extracted content  
- **chat_session**: Chat sessions with client tracking
- **chat_message**: Chat messages with deduplication

### Security

All tables have Row Level Security (RLS) enabled with deny-all policies. Access is only allowed through the service role key, ensuring all database operations go through our API routes.

### Indexes

Optimized indexes for:
- Configuration key lookups
- Active resume queries
- Session lookups by client_id
- Message queries by session
- Chronological sorting

## Important Notes

- All IDs use UUID with `gen_random_uuid()`
- Timestamps use `TIMESTAMPTZ` for timezone awareness
- Unique constraint on `(session_id, client_message_id)` prevents duplicate messages
- Only one resume should be active at a time