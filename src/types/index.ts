export * from './database';
export * from './auth';
export * from './api';
export * from './utils';

// ============================================
// Application Types
// ============================================

export interface LLMConfig {
    provider: 'openai' | 'anthropic';
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

export interface AppConfig {
    llm: LLMConfig;
    rateLimit: RateLimitConfig;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export interface ChatSession {
    id: string;
    clientId: string;
    messages: ChatMessage[];
    createdAt: Date;
}

export interface Resume {
    id: string;
    filename: string;
    content: string;
    fileSize: number;
    uploadedAt: Date;
    isActive: boolean;
}
