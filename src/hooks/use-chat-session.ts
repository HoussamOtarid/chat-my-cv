'use client';

import { useCallback, useEffect } from 'react';

import { useMessageArchival } from '@/lib/message-archival';
import type { ChatMessage } from '@/types';

import { useSessionStorage } from './use-session-storage';

/**
 * Combined hook for chat session with automatic archival
 */
export function useChatSession() {
    const {
        clientId,
        sessionId,
        messages,
        isLoading,
        addUserMessage: addUserMessageBase,
        addAssistantMessage: addAssistantMessageBase,
        addSystemMessage: addSystemMessageBase,
        updateMessage,
        removeMessage,
        clearSession: clearSessionBase,
        getRecentMessages,
        isSessionExpired,
        generateMessageId,
        exportSession,
        importSession
    } = useSessionStorage();

    const { queueMessage, queueMessages, flush, getQueueSize, getStatus } = useMessageArchival();

    // Archive message after adding
    const addUserMessage = useCallback(
        (content: string): ChatMessage => {
            const message = addUserMessageBase(content);
            queueMessage(message, clientId, sessionId);
            
            return message;
        },
        [addUserMessageBase, queueMessage, clientId, sessionId]
    );

    const addAssistantMessage = useCallback(
        (content: string): ChatMessage => {
            const message = addAssistantMessageBase(content);
            queueMessage(message, clientId, sessionId);
            
            return message;
        },
        [addAssistantMessageBase, queueMessage, clientId, sessionId]
    );

    const addSystemMessage = useCallback(
        (content: string): ChatMessage => {
            const message = addSystemMessageBase(content);
            queueMessage(message, clientId, sessionId); 
            
            return message;
        },
        [addSystemMessageBase, queueMessage, clientId, sessionId]
    );

    // Clear session and flush remaining messages
    const clearSession = useCallback(() => {
        // Flush any pending messages before clearing
        void flush(clientId, sessionId);
        clearSessionBase();
    }, [clearSessionBase, flush, clientId, sessionId]);

    // Auto-flush on session changes
    useEffect(() => {
        if (sessionId) {
            // Flush when session ID changes
            void flush(clientId, sessionId);
        }
    }, [sessionId, flush, clientId]);

    // Archive existing messages on load
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            // Queue all existing messages for archival
            queueMessages(messages, clientId, sessionId);
        }
        // Only run once on initial load
    }, [isLoading]);

    return {
        // Session info
        clientId,
        sessionId,
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

        // Archival status
        archivalStatus: getStatus,
        archivalQueueSize: getQueueSize,
        flushArchival: () => flush(clientId, sessionId)
    };
}
