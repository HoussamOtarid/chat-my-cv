# AI Resume Chat

An intelligent chat interface that allows visitors to interact with your resume through natural conversation, powered by AI.

## Features

- 💬 **Interactive Chat** - Ask questions about experience, skills, and background
- 🤖 **AI-Powered** - Leverages OpenAI or Anthropic for intelligent responses
- 📄 **PDF Resume Support** - Upload and parse PDF resumes automatically
- 🔒 **Admin Panel** - Secure configuration and resume management
- 📱 **Mobile-First** - Responsive design that works on all devices
- 🌙 **Dark Mode** - Built-in light/dark theme support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui components with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: LangChain with OpenAI/Anthropic
- **Auth**: NextAuth.js
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd chat-my-cv
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/          # Next.js app router pages
├── components/   # React components
├── lib/          # Utility functions and configurations
└── types/        # TypeScript type definitions
```

## License

MIT