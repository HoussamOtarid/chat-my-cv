export * from './database';
export * from './auth';
export * from './api';
export * from './utils';

// ============================================
// Application Types
// ============================================

// Base LLM configuration
interface BaseLLMConfig {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

// Direct API configuration
interface DirectOpenAIConfig extends BaseLLMConfig {
    provider: 'openai';
    apiKey: string;
}

interface DirectAnthropicConfig extends BaseLLMConfig {
    provider: 'anthropic';
    apiKey: string;
}

// Azure OpenAI configuration
interface AzureOpenAIConfig extends BaseLLMConfig {
    provider: 'azure-openai';
    azureEndpoint: string;
    azureApiKey: string;
    azureDeploymentName: string;
    azureApiVersion?: string;
}

// AWS Bedrock configuration
interface BedrockAnthropicConfig extends BaseLLMConfig {
    provider: 'bedrock-anthropic';
    awsRegion: string;
    awsAccessKeyId: string;
    awsSecretAccessKey: string;
    awsSessionToken?: string;
}

// OpenAI-compatible endpoints (Ollama, LM Studio, etc.)
interface OpenAICompatibleConfig extends BaseLLMConfig {
    provider: 'openai-compatible';
    baseUrl: string;
    apiKey?: string;  // Optional as some local services don't require auth
    defaultHeaders?: Record<string, string>;
}

export type LLMConfig = 
    | DirectOpenAIConfig 
    | DirectAnthropicConfig 
    | AzureOpenAIConfig 
    | BedrockAnthropicConfig
    | OpenAICompatibleConfig;

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
    fileUrl?: string;
    storagePath?: string;
    uploadedAt: Date;
    isActive: boolean;
}

export interface StorageFile {
    name: string;
    id: string;
    created_at: string;
    updated_at: string;
    size?: number;
}

export interface StorageUploadResult {
    success: boolean;
    path?: string;
    url?: string;
    error?: {
        message: string;
        details?: any;
    };
}
