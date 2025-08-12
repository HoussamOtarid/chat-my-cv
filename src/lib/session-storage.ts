'use client';

import type { ChatMessage, ChatSession } from '@/types';

/**
 * Storage keys for localStorage
 */
const STORAGE_KEYS = {
    CLIENT_ID: 'chat_client_id',
    SESSION: 'chat_session',
    MESSAGE_HISTORY: 'chat_messages',
    LAST_ACTIVITY: 'chat_last_activity',
} as const;

/**
 * Generate a stable UUID v4
 */
export function generateUUID(): string {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Fallback to manual UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        
        return v.toString(16);
    });
}

/**
 * Get or create a stable client ID
 * This ID persists across sessions to correlate conversations
 */
export function getClientId(): string {
    if (typeof window === 'undefined') {
        return generateUUID();
    }

    try {
        let clientId = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
        
        if (!clientId) {
            clientId = generateUUID();
            localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId);
        }
        
        return clientId;
    } catch (error) {
        console.error('Failed to access localStorage for client ID:', error);
        
        // Return a session-based ID if localStorage fails
        return generateUUID();
    }
}

/**
 * Generate a unique message ID for deduplication
 */
export function generateMessageId(): string {
    return generateUUID();
}

/**
 * Session storage manager for chat conversations
 */
export class SessionStorage {
    private static instance: SessionStorage;
    private clientId: string;
    private session: ChatSession | null = null;
    private messageHistory: ChatMessage[] = [];
    private maxMessages = 100; // Limit stored messages to prevent localStorage overflow

    private constructor() {
        this.clientId = getClientId();
        this.loadSession();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): SessionStorage {
        if (!SessionStorage.instance) {
            SessionStorage.instance = new SessionStorage();
        }
        
return SessionStorage.instance;
    }

    /**
     * Load session from localStorage
     */
    private loadSession(): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            // Load session
            const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION);
            if (sessionData) {
                this.session = JSON.parse(sessionData);
                // Convert timestamp strings back to Date objects
                if (this.session) {
                    this.session.createdAt = new Date(this.session.createdAt);
                }
            }

            // Load message history
            const messagesData = localStorage.getItem(STORAGE_KEYS.MESSAGE_HISTORY);
            if (messagesData) {
                const messages = JSON.parse(messagesData);
                // Convert timestamp strings back to Date objects
                this.messageHistory = messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                }));
            }
        } catch (error) {
            console.error('Failed to load session from localStorage:', error);
            this.clearSession();
        }
    }

    /**
     * Save session to localStorage
     */
    private saveSession(): void {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            // Save session
            if (this.session) {
                localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(this.session));
            }

            // Save message history (with size limit)
            const messagesToSave = this.messageHistory.slice(-this.maxMessages);
            localStorage.setItem(STORAGE_KEYS.MESSAGE_HISTORY, JSON.stringify(messagesToSave));

            // Update last activity
            localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString());
        } catch (error) {
            console.error('Failed to save session to localStorage:', error);
            
            // If localStorage is full, try to clear old messages
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                this.trimMessageHistory();
                
                // Try again with trimmed history
                try {
                    const messagesToSave = this.messageHistory.slice(-Math.floor(this.maxMessages / 2));
                    localStorage.setItem(STORAGE_KEYS.MESSAGE_HISTORY, JSON.stringify(messagesToSave));
                } catch (retryError) {
                    console.error('Failed to save even after trimming:', retryError);
                }
            }
        }
    }

    /**
     * Get current client ID
     */
    getClientId(): string {
        return this.clientId;
    }

    /**
     * Get or create session
     */
    getSession(): ChatSession {
        if (!this.session) {
            this.session = {
                id: generateUUID(),
                clientId: this.clientId,
                messages: [],
                createdAt: new Date(),
            };
            this.saveSession();
        }
        
return this.session;
    }

    /**
     * Get session ID (if exists)
     */
    getSessionId(): string | undefined {
        return this.session?.id;
    }

    /**
     * Add a message to history
     */
    addMessage(message: Omit<ChatMessage, 'id'>): ChatMessage {
        const fullMessage: ChatMessage = {
            ...message,
            id: generateMessageId(),
        };

        this.messageHistory.push(fullMessage);
        
        // Update session messages
        if (this.session) {
            this.session.messages = this.messageHistory;
        }

        this.saveSession();
        
return fullMessage;
    }

    /**
     * Get message history
     */
    getMessages(): ChatMessage[] {
        return [...this.messageHistory];
    }

    /**
     * Get recent messages (for context window)
     */
    getRecentMessages(count = 10): ChatMessage[] {
        return this.messageHistory.slice(-count);
    }

    /**
     * Clear specific message
     */
    removeMessage(messageId: string): void {
        this.messageHistory = this.messageHistory.filter(msg => msg.id !== messageId);
        
        if (this.session) {
            this.session.messages = this.messageHistory;
        }
        
        this.saveSession();
    }

    /**
     * Update message content (e.g., for streaming)
     */
    updateMessage(messageId: string, content: string): void {
        const message = this.messageHistory.find(msg => msg.id === messageId);
        if (message) {
            message.content = content;
            this.saveSession();
        }
    }

    /**
     * Trim message history to prevent overflow
     */
    trimMessageHistory(keepCount?: number): void {
        const limit = keepCount || Math.floor(this.maxMessages / 2);
        this.messageHistory = this.messageHistory.slice(-limit);
        
        if (this.session) {
            this.session.messages = this.messageHistory;
        }
        
        this.saveSession();
    }

    /**
     * Clear session and start fresh
     */
    clearSession(): void {
        this.session = null;
        this.messageHistory = [];
        
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(STORAGE_KEYS.SESSION);
                localStorage.removeItem(STORAGE_KEYS.MESSAGE_HISTORY);
                localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
                // Keep client ID for continuity
            } catch (error) {
                console.error('Failed to clear localStorage:', error);
            }
        }
    }

    /**
     * Get last activity timestamp
     */
    getLastActivity(): Date | null {
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
            
return lastActivity ? new Date(lastActivity) : null;
        } catch (error) {
            console.error('Failed to get last activity:', error);
            
return null;
        }
    }

    /**
     * Check if session is expired (e.g., after 24 hours of inactivity)
     */
    isSessionExpired(maxInactivityHours = 24): boolean {
        const lastActivity = this.getLastActivity();
        if (!lastActivity) {
            return false;
        }

        const now = new Date();
        const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
        
return hoursSinceActivity > maxInactivityHours;
    }

    /**
     * Export session data (for debugging or backup)
     */
    exportSession(): string {
        return JSON.stringify({
            clientId: this.clientId,
            session: this.session,
            messages: this.messageHistory,
            lastActivity: this.getLastActivity(),
        }, null, 2);
    }

    /**
     * Import session data
     */
    importSession(jsonData: string): boolean {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.clientId) {
                this.clientId = data.clientId;
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, this.clientId);
                }
            }

            if (data.session) {
                this.session = {
                    ...data.session,
                    createdAt: new Date(data.session.createdAt),
                };
            }

            if (data.messages) {
                this.messageHistory = data.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                }));
            }

            this.saveSession();
            
return true;
        } catch (error) {
            console.error('Failed to import session:', error);
            
return false;
        }
    }

    /**
     * Get storage size estimate
     */
    getStorageSize(): number {
        if (typeof window === 'undefined') {
            return 0;
        }

        try {
            let size = 0;
            for (const key of Object.values(STORAGE_KEYS)) {
                const value = localStorage.getItem(key);
                if (value) {
                    size += value.length + key.length;
                }
            }
            
return size;
        } catch (error) {
            console.error('Failed to calculate storage size:', error);
            
return 0;
        }
    }
}

/**
 * Default session storage instance
 */
export const sessionStorage = typeof window !== 'undefined' 
    ? SessionStorage.getInstance() 
    : null;

/**
 * React hook for session storage
 */
export function useSessionStorage() {
    if (typeof window === 'undefined') {
        // Return mock for SSR
        return {
            clientId: '',
            sessionId: undefined as string | undefined,
            messages: [] as ChatMessage[],
            addMessage: () => ({} as ChatMessage),
            updateMessage: () => {},
            removeMessage: () => {},
            getRecentMessages: () => [] as ChatMessage[],
            clearSession: () => {},
            isSessionExpired: () => false,
        };
    }

    const storage = SessionStorage.getInstance();
    
    return {
        clientId: storage.getClientId(),
        sessionId: storage.getSessionId(),
        messages: storage.getMessages(),
        addMessage: storage.addMessage.bind(storage),
        updateMessage: storage.updateMessage.bind(storage),
        removeMessage: storage.removeMessage.bind(storage),
        getRecentMessages: storage.getRecentMessages.bind(storage),
        clearSession: storage.clearSession.bind(storage),
        isSessionExpired: storage.isSessionExpired.bind(storage),
    };
}
