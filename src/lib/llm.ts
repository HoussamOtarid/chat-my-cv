import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage } from '@langchain/core/messages';
import type { LLMConfig } from '@/types';

// Default model configurations
const DEFAULT_MODELS = {
    openai: 'gpt-5',
    anthropic: 'claude-sonnet-4-20250514',
} as const;

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4000;

// Model token limits (context window)
const MODEL_LIMITS = {
    'gpt-5': 128000,                      // 128K context
    'gpt-5-mini': 128000,                 // 128K context  
    'gpt-5-nano': 128000,                 // 128K context
    'gpt-4-1': 1000000,                   // 1M context
    'gpt-4-1-mini': 1000000,              // 1M context
    'gpt-4-1-nano': 1000000,              // 1M context
    'gpt-4o': 128000,                     // 128K context
    'gpt-4o-mini': 128000,                // 128K context
    'gpt-4-turbo': 128000,                // 128K context
    'gpt-3.5-turbo': 16385,               // 16K context
    
    // Anthropic models (as of 2025)
    'claude-opus-4-1-20250805': 200000,      // 200K context
    'claude-opus-4-20250514': 200000,       // 200K context
    'claude-sonnet-4-20250514': 200000,      // 200K context (1M beta available)
    'claude-3-7-sonnet-20250219': 200000,    // 200K context
    'claude-3-5-haiku-20241022': 200000,     // 200K context  
    'claude-3-haiku-20240307': 200000,       // 200K context
} as const;

export type ModelName = keyof typeof MODEL_LIMITS;

// Maximum output tokens per model
const MODEL_MAX_OUTPUT = {
    'gpt-5': 32768,                          // 32K output
    'gpt-5-mini': 32768,                     // 32K output
    'gpt-5-nano': 32768,                     // 32K output
    'gpt-4-1': 32768,                        // 32K output
    'gpt-4-1-mini': 32768,                   // 32K output
    'gpt-4-1-nano': 32768,                   // 32K output
    'gpt-4o': 16384,                         // 16K output
    'gpt-4o-mini': 16384,                    // 16K output
    'gpt-4-turbo': 4096,                     // 4K output
    'gpt-3.5-turbo': 4096,                   // 4K output
    
    // Anthropic models (as of 2025)
    'claude-opus-4-1-20250805': 32000,       // 32K output
    'claude-sonnet-4-20250514': 64000,       // 64K output
    'claude-3-7-sonnet-20250219': 64000,     // 64K output
    'claude-3-5-haiku-20241022': 8192,       // 8K output
    'claude-3-haiku-20240307': 4096,         // 4K output
} as const;

/**
 * Get the token limit for a specific model
 */
export function getModelTokenLimit(model: string): number {
    return MODEL_LIMITS[model as ModelName] || 128000;
}

/**
 * Get the max output tokens for a specific model
 */
export function getModelMaxOutput(model: string): number {
    return MODEL_MAX_OUTPUT[model as keyof typeof MODEL_MAX_OUTPUT] || 4096;
}

/**
 * Create a chat model instance based on configuration
 */
export function createChatModel(config: LLMConfig): BaseChatModel {
    const {
        provider,
        apiKey,
        model = DEFAULT_MODELS[provider],
        temperature = DEFAULT_TEMPERATURE,
        maxTokens = DEFAULT_MAX_TOKENS,
    } = config;

    // Validate API key
    if (!apiKey) {
        throw new Error(`API key is required for ${provider}`);
    }

    // Common configuration
    const baseConfig = {
        temperature,
        maxTokens,
        streaming: true,
        verbose: process.env.NODE_ENV === 'development',
    };

    switch (provider) {
        case 'openai':
            return new ChatOpenAI({
                ...baseConfig,
                openAIApiKey: apiKey,
                modelName: model,
                // OpenAI specific options
                topP: 1,
                frequencyPenalty: 0,
                presencePenalty: 0,
            });

        case 'anthropic':
            return new ChatAnthropic({
                ...baseConfig,
                anthropicApiKey: apiKey,
                modelName: model,
                // Anthropic specific options
                anthropicApiUrl: process.env.ANTHROPIC_API_URL,
            });

        default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
    }
}

/**
 * Stream handler for processing LLM responses
 */
export class StreamHandler {
    private tokens: string[] = [];
    private onToken?: (token: string) => void;
    private onComplete?: (fullText: string) => void;
    private onError?: (error: Error) => void;

    constructor(options: {
        onToken?: (token: string) => void;
        onComplete?: (fullText: string) => void;
        onError?: (error: Error) => void;
    }) {
        this.onToken = options.onToken;
        this.onComplete = options.onComplete;
        this.onError = options.onError;
    }

    async handleLLMNewToken(token: string) {
        this.tokens.push(token);
        
        if (this.onToken) {
            this.onToken(token);
        }
    }

    async handleLLMEnd() {
        const fullText = this.tokens.join('');
        
        if (this.onComplete) {
            this.onComplete(fullText);
        }
    }

    async handleLLMError(error: Error) {
        if (this.onError) {
            this.onError(error);
        }
    }

    getFullText(): string {
        return this.tokens.join('');
    }

    reset(): void {
        this.tokens = [];
    }
}

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(config: Partial<LLMConfig>): { valid: boolean; error?: string } {
    if (!config.provider) {
        return { valid: false, error: 'Provider is required' };
    }

    if (!['openai', 'anthropic'].includes(config.provider)) {
        return { valid: false, error: 'Invalid provider. Must be "openai" or "anthropic"' };
    }

    if (!config.apiKey) {
        return { valid: false, error: 'API key is required' };
    }

    // Basic API key format validation
    if (config.provider === 'openai' && !config.apiKey.startsWith('sk-')) {
        return { valid: false, error: 'Invalid OpenAI API key format' };
    }

    if (config.provider === 'anthropic' && !config.apiKey.startsWith('sk-ant-')) {
        return { valid: false, error: 'Invalid Anthropic API key format' };
    }

    if (config.temperature !== undefined) {
        if (config.temperature < 0 || config.temperature > 2) {
            return { valid: false, error: 'Temperature must be between 0 and 2' };
        }
    }

    if (config.maxTokens !== undefined) {
        if (config.maxTokens < 1 || config.maxTokens > 100000) {
            return { valid: false, error: 'Max tokens must be between 1 and 100000' };
        }
    }

    return { valid: true };
}

/**
 * Test LLM connection with a simple prompt
 */
export async function testLLMConnection(config: LLMConfig): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const model = createChatModel(config);
        
        // Simple test prompt
        const response = await model.invoke([
            new HumanMessage('Say "Connection successful" in exactly three words.'),
        ]);

        if (response && response.content) {
            return {
                success: true,
                message: `Successfully connected to ${config.provider} (${config.model || DEFAULT_MODELS[config.provider]})`,
            };
        }

        return {
            success: false,
            error: 'No response from LLM',
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Parse common API errors
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            return {
                success: false,
                error: 'Invalid API key',
            };
        }

        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            return {
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
            };
        }

        if (errorMessage.includes('model') || errorMessage.includes('not found')) {
            return {
                success: false,
                error: `Model not available: ${config.model}`,
            };
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider: 'openai' | 'anthropic'): string[] {
    switch (provider) {
        case 'openai':
            return [
                'gpt-5',
                'gpt-5-mini',
                'gpt-5-nano',
                'gpt-4-1',
                'gpt-4-1-mini',
                'gpt-4-1-nano',
                'gpt-4o',
                'gpt-4o-mini',
                'gpt-4-turbo',
                'gpt-3.5-turbo',
            ];
        
        case 'anthropic':
            return [
                'claude-opus-4-1-20250805',
                'claude-opus-4-20250514',
                'claude-sonnet-4-20250514',
                'claude-3-7-sonnet-20250219',
                'claude-3-5-haiku-20241022',
                'claude-3-haiku-20240307',
            ];
        
        default:
            return [];
    }
}

/**
 * Get model display name
 */
export function getModelDisplayName(model: string): string {
    const displayNames: Record<string, string> = {
        // OpenAI (2025)
        'gpt-5': 'GPT-5 (Latest)',
        'gpt-5-mini': 'GPT-5 Mini',
        'gpt-5-nano': 'GPT-5 Nano',
        'gpt-4-1': 'GPT-4.1 (1M Context)',
        'gpt-4-1-mini': 'GPT-4.1 Mini',
        'gpt-4-1-nano': 'GPT-4.1 Nano',
        'gpt-4o': 'GPT-4o',
        'gpt-4o-mini': 'GPT-4o Mini',
        'gpt-4-turbo': 'GPT-4 Turbo',
        'gpt-3.5-turbo': 'GPT-3.5 Turbo',
        
        // Anthropic (2025)
        'claude-opus-4-1-20250805': 'Claude Opus 4.1',
        'claude-opus-4-20250514': 'Claude Opus 4',
        'claude-sonnet-4-20250514': 'Claude Sonnet 4',
        'claude-3-7-sonnet-20250219': 'Claude 3.7 Sonnet',
        'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
        'claude-3-haiku-20240307': 'Claude 3 Haiku',
    };

    return displayNames[model] || model;
}
