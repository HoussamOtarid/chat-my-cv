'use client';

import { useState, useEffect, useCallback } from 'react';
import { SessionStorage, generateMessageId } from '@/lib/session-storage';
import type { ChatMessage } from '@/types';

export interface UseSessionStorageReturn {
    clientId: string;
    sessionId: string | undefined;
    messages: ChatMessage[];
    isLoading: boolean;
    
    // Message operations
    addUserMessage: (content: string) => ChatMessage;
    addAssistantMessage: (content: string) => ChatMessage;
    addSystemMessage: (content: string) => ChatMessage;
    updateMessage: (messageId: string, content: string) => void;
    removeMessage: (messageId: string) => void;
    
    // Session operations
    clearSession: () => void;
    getRecentMessages: (count?: number) => ChatMessage[];
    isSessionExpired: (maxInactivityHours?: number) => boolean;
    
    // Utility
    generateMessageId: () => string;
    exportSession: () => string;
    importSession: (jsonData: string) => boolean;
}

/**
 * React hook for managing chat session storage
 */
export function useSessionStorage(): UseSessionStorageReturn {
    const [storage, setStorage] = useState<SessionStorage | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize storage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storageInstance = SessionStorage.getInstance();
            setStorage(storageInstance);
            setMessages(storageInstance.getMessages());
            setIsLoading(false);
        }
    }, []);

    // Add user message
    const addUserMessage = useCallback((content: string): ChatMessage => {
        if (!storage) {
            throw new Error('Storage not initialized');
        }

        const message = storage.addMessage({
            role: 'user',
            content,
            timestamp: new Date(),
        });

        setMessages(storage.getMessages());
        return message;
    }, [storage]);

    // Add assistant message
    const addAssistantMessage = useCallback((content: string): ChatMessage => {
        if (!storage) {
            throw new Error('Storage not initialized');
        }

        const message = storage.addMessage({
            role: 'assistant',
            content,
            timestamp: new Date(),
        });

        setMessages(storage.getMessages());
        return message;
    }, [storage]);

    // Add system message
    const addSystemMessage = useCallback((content: string): ChatMessage => {
        if (!storage) {
            throw new Error('Storage not initialized');
        }

        const message = storage.addMessage({
            role: 'system',
            content,
            timestamp: new Date(),
        });

        setMessages(storage.getMessages());
        return message;
    }, [storage]);

    // Update message
    const updateMessage = useCallback((messageId: string, content: string) => {
        if (!storage) return;

        storage.updateMessage(messageId, content);
        setMessages(storage.getMessages());
    }, [storage]);

    // Remove message
    const removeMessage = useCallback((messageId: string) => {
        if (!storage) return;

        storage.removeMessage(messageId);
        setMessages(storage.getMessages());
    }, [storage]);

    // Clear session
    const clearSession = useCallback(() => {
        if (!storage) return;

        storage.clearSession();
        setMessages([]);
    }, [storage]);

    // Get recent messages
    const getRecentMessages = useCallback((count?: number): ChatMessage[] => {
        if (!storage) return [];
        return storage.getRecentMessages(count);
    }, [storage]);

    // Check if session expired
    const isSessionExpired = useCallback((maxInactivityHours?: number): boolean => {
        if (!storage) return false;
        return storage.isSessionExpired(maxInactivityHours);
    }, [storage]);

    // Export session
    const exportSession = useCallback((): string => {
        if (!storage) return '{}';
        return storage.exportSession();
    }, [storage]);

    // Import session
    const importSession = useCallback((jsonData: string): boolean => {
        if (!storage) return false;
        
        const success = storage.importSession(jsonData);
        if (success) {
            setMessages(storage.getMessages());
        }
        return success;
    }, [storage]);

    // Return values
    return {
        clientId: storage?.getClientId() || '',
        sessionId: storage?.getSessionId(),
        messages,
        isLoading,
        
        // Message operations
        addUserMessage,
        addAssistantMessage,
        addSystemMessage,
        updateMessage,
        removeMessage,
        
        // Session operations
        clearSession,
        getRecentMessages,
        isSessionExpired,
        
        // Utility
        generateMessageId,
        exportSession,
        importSession,
    };
}

/**
 * Hook for managing streaming messages
 */
export function useStreamingMessage() {
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const [streamingContent, setStreamingContent] = useState('');
    const { updateMessage, addAssistantMessage } = useSessionStorage();

    // Start streaming a new message
    const startStreaming = useCallback(() => {
        const messageId = generateMessageId();
        setStreamingMessageId(messageId);
        setStreamingContent('');
        
        // Add placeholder message
        const message = addAssistantMessage('');
        setStreamingMessageId(message.id);
        
        return message.id;
    }, [addAssistantMessage]);

    // Append content to streaming message
    const appendContent = useCallback((content: string) => {
        if (!streamingMessageId) return;
        
        setStreamingContent(prev => {
            const newContent = prev + content;
            updateMessage(streamingMessageId, newContent);
            return newContent;
        });
    }, [streamingMessageId, updateMessage]);

    // Complete streaming
    const completeStreaming = useCallback(() => {
        setStreamingMessageId(null);
        setStreamingContent('');
    }, []);

    // Abort streaming
    const abortStreaming = useCallback(() => {
        if (streamingMessageId && streamingContent === '') {
            // Remove empty message if nothing was streamed
            // Note: removeMessage is not exposed in the base hook, 
            // so we'll just complete it
        }
        completeStreaming();
    }, [streamingMessageId, streamingContent, completeStreaming]);

    return {
        streamingMessageId,
        streamingContent,
        startStreaming,
        appendContent,
        completeStreaming,
        abortStreaming,
    };
}