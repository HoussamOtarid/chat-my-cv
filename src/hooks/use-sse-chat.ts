'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createSSEClient, SSEState } from '@/lib/sse-client';
import type { SSEClient, FetchSSEClient } from '@/lib/sse-client';
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
    const handleMessage = useCallback((event: ChatStreamEvent) => {
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
    }, [options]);

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

    const handleError = useCallback((error: Error) => {
        setConnectionState(SSEState.ERROR);
        setIsStreaming(false);
        const errorMessage = error.message || 'Connection error';
        setError(errorMessage);
        options.onError?.(errorMessage);
    }, [options]);

    /**
     * Send a message to the chat endpoint
     */
    const sendMessage = useCallback((
        message: string,
        clientId: string,
        clientMessageId: string,
        sessionId?: string
    ) => {
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
            clientMessageId,
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
            retryBackoff: 2,
        });

        // Start connection
        if (sseClientRef.current instanceof Promise) {
            void (sseClientRef.current as any).connect();
        } else {
            sseClientRef.current.connect();
        }
    }, [handleMessage, handleConnect, handleDisconnect, handleError, options.maxRetries, options.retryDelay]);

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
        abort,
    };
}

/**
 * Alternative hook using POST method
 */
export function useSSEChatPost(options: UseSSEChatOptions = {}): UseSSEChatReturn {
    const [isStreaming, setIsStreaming] = useState(false);
    const [connectionState, setConnectionState] = useState<SSEState>(SSEState.DISCONNECTED);
    const [error, setError] = useState<string | null>(null);
    const [currentResponse, setCurrentResponse] = useState('');
    
    const abortControllerRef = useRef<AbortController | null>(null);
    const responseBufferRef = useRef<string>('');

    /**
     * Send a message using POST with streaming response
     */
    const sendMessage = useCallback(async (
        message: string,
        clientId: string,
        clientMessageId: string,
        sessionId?: string
    ) => {
        // Abort previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Reset state
        setError(null);
        setIsStreaming(true);
        setCurrentResponse('');
        setConnectionState(SSEState.CONNECTING);
        responseBufferRef.current = '';

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify({
                    message,
                    clientId,
                    clientMessageId,
                    sessionId,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Response body is empty');
            }

            setConnectionState(SSEState.CONNECTED);

            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                
                // Process complete messages
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const event: ChatStreamEvent = JSON.parse(line.slice(6));
                            
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
                                    setConnectionState(SSEState.DISCONNECTED);
                                    const completeMessage = responseBufferRef.current;
                                    options.onComplete?.(completeMessage);
                                    
                                    return;
                                }
                                    
                                case 'error': {
                                    throw new Error(event.error || 'Stream error');
                                }
                            }
                        } catch (error) {
                            console.error('Failed to parse SSE message:', error);
                        }
                    }
                }
            }

            setIsStreaming(false);
            setConnectionState(SSEState.DISCONNECTED);

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Request was aborted
                return;
            }

            setIsStreaming(false);
            setConnectionState(SSEState.ERROR);
            const errorMessage = error instanceof Error ? error.message : 'Connection failed';
            setError(errorMessage);
            options.onError?.(errorMessage);
        }
    }, [options]);

    /**
     * Abort the current streaming
     */
    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
        setConnectionState(SSEState.DISCONNECTED);
    }, []);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, []);

    return {
        sendMessage,
        isStreaming,
        connectionState,
        error,
        currentResponse,
        abort,
    };
}