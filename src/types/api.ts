// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}

// ============================================
// Chat API Types
// ============================================

export interface ChatStreamRequest {
    message: string;
    sessionId?: string;
    clientId: string;
    clientMessageId: string;
}

export interface ChatStreamEvent {
    type: 'token' | 'done' | 'error';
    content?: string;
    error?: string;
}

export interface ChatSuggestion {
    id: string;
    text: string;
    category?: string;
}

// ============================================
// Resume API Types
// ============================================

export interface ResumeUploadResponse {
    id: string;
    filename: string;
    fileSize: number;
    contentLength: number;
}

export interface ResumeContent {
    content: string;
    filename: string;
    uploadedAt: string;
}

// ============================================
// Configuration API Types
// ============================================

export interface ConfigurationUpdate {
    key: string;
    value: unknown;
    encrypted?: boolean;
}

export interface LLMTestRequest {
    provider: 'openai' | 'anthropic';
    apiKey: string;
    testMessage?: string;
}

export interface LLMTestResponse {
    success: boolean;
    provider: string;
    model?: string;
    response?: string;
    error?: string;
}

// ============================================
// Rate Limit Types
// ============================================

export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}
