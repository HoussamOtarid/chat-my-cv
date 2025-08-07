// ============================================
// Application Constants
// ============================================

export const APP_NAME = 'Chat My CV';
export const APP_VERSION = '1.0.0';

// API Routes
export const API_ROUTES = {
    AUTH: '/api/auth',
    CHAT: '/api/chat',
    ADMIN: '/api/admin',
    RESUME: '/api/resume',
    INGEST: '/api/ingest'
} as const;

// Rate Limiting
export const RATE_LIMIT = {
    DEFAULT_MAX_REQUESTS: 10,
    DEFAULT_WINDOW_MS: 60000 // 1 minute
} as const;

// File Upload
export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf'],
    ALLOWED_EXTENSIONS: ['.pdf']
} as const;

// Chat
export const CHAT = {
    MAX_MESSAGE_LENGTH: 4000,
    MAX_HISTORY_LENGTH: 50,
    SESSION_TIMEOUT_MS: 30 * 60 * 1000 // 30 minutes
} as const;

// LLM Settings
export const LLM = {
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 2000,
    MODELS: {
        OPENAI: 'gpt-4.1',
        ANTHROPIC: 'claude-sonnet-4-20250514'
    }
} as const;
