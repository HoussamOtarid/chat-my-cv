'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { SSEState, createSSEClient } from '@/lib/sse-client';
import type { FetchSSEClient, SSEClient } from '@/lib/sse-client';
import type { ChatStreamEvent } from '@/types/api';

export interface UseSSEChatOptions {
    onToken?: (token: string) => void;
    onComplete?: (message: string) => void;
    onError?: (error: string) => void;
    maxRetries?: number;
    retryDelay?: number;
}

export interface UseSSEChatReturn {
    sendMessage: (message: string, clientId: string, clientMessageId: string, sessionId?: string) => void;
    isStreaming: boolean;
    connectionState: SSEState;
    error: string | null;
    currentResponse: string;
    abort: () => void;
}

/**
 * React hook for handling SSE chat streaming
 */
export function useSSEChat(options: UseSSEChatOptions = {}): UseSSEChatReturn {
    const [isStreaming, setIsStreaming] = useState(false);
    const [connectionState, setConnectionState] = useState<SSEState>(SSEState.DISCONNECTED);
    const [error, setError] = useState<string | null>(null);
    const [currentResponse, setCurrentResponse] = useState('');

    const sseClientRef = useRef<SSEClient | FetchSSEClient | null>(null);
    const responseBufferRef = useRef<string>('');

    /**
     * Handle incoming SSE messages
     */
    const handleMessage = useCallback(
        (event: ChatStreamEvent) => {
            switch (event.type) {
                case 'token': {
                    if (event.content) {
                        responseBufferRef.current += event.content;
                        setCurrentResponse(responseBufferRef.current);
                        options.onToken?.(event.content);
                    }
                    break;
                }

                case 'done': {
                    setIsStreaming(false);
                    const completeMessage = responseBufferRef.current;
                    options.onComplete?.(completeMessage);
                    break;
                }

                case 'error': {
                    setIsStreaming(false);
                    const errorMessage = event.error || 'An error occurred';
                    setError(errorMessage);
                    options.onError?.(errorMessage);
                    break;
                }
            }
        },
        [options]
    );

    /**
     * Handle connection state changes
     */
    const handleConnect = useCallback(() => {
        setConnectionState(SSEState.CONNECTED);
        setError(null);
    }, []);

    const handleDisconnect = useCallback(() => {
        setConnectionState(SSEState.DISCONNECTED);
        setIsStreaming(false);
    }, []);

    const handleError = useCallback(
        (error: Error) => {
            setConnectionState(SSEState.ERROR);
            setIsStreaming(false);
            const errorMessage = error.message || 'Connection error';
            setError(errorMessage);
            options.onError?.(errorMessage);
        },
        [options]
    );

    /**
     * Send a message to the chat endpoint
     */
    const sendMessage = useCallback(
        (message: string, clientId: string, clientMessageId: string, sessionId?: string) => {
            // Clean up previous connection
            if (sseClientRef.current) {
                sseClientRef.current.close();
                sseClientRef.current = null;
            }

            // Reset state
            setError(null);
            setIsStreaming(true);
            setCurrentResponse('');
            responseBufferRef.current = '';

            // Create new SSE client
            const params: Record<string, string> = {
                message,
                clientId,
                clientMessageId
            };

            if (sessionId) {
                params.sessionId = sessionId;
            }

            sseClientRef.current = createSSEClient({
                url: '/api/chat/stream',
                params,
                onMessage: handleMessage,
                onConnect: handleConnect,
                onDisconnect: handleDisconnect,
                onError: handleError,
                maxRetries: options.maxRetries ?? 3,
                retryDelay: options.retryDelay ?? 1000,
                retryBackoff: 2
            });

            // Start connection
            if (sseClientRef.current instanceof Promise) {
                void (sseClientRef.current as any).connect();
            } else {
                sseClientRef.current.connect();
            }
        },
        [handleMessage, handleConnect, handleDisconnect, handleError, options.maxRetries, options.retryDelay]
    );

    /**
     * Abort the current streaming
     */
    const abort = useCallback(() => {
        if (sseClientRef.current) {
            sseClientRef.current.close();
            sseClientRef.current = null;
        }
        setIsStreaming(false);
        setConnectionState(SSEState.DISCONNECTED);
    }, []);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (sseClientRef.current) {
                sseClientRef.current.close();
                sseClientRef.current = null;
            }
        };
    }, []);

    return {
        sendMessage,
        isStreaming,
        connectionState,
        error,
        currentResponse,
        abort
    };
}

