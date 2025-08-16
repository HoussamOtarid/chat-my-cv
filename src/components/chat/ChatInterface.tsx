'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

// Import hooks
import { useChatSession } from '@/hooks/use-chat-session';
import { useSSEChat } from '@/hooks/use-sse-chat';
import { toast } from '@/hooks/use-toast';
import { SSEState } from '@/lib/sse-client';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card } from '@/registry/new-york-v4/ui/card';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';
// Import types
import type { ChatMessage } from '@/types';

import { ChatInput } from './ChatInput';
// Import chat components
import { MessageList } from './MessageList';
import { SuggestedQuestions } from './SuggestedQuestions';
import { AlertCircle, Loader2, RefreshCw, Sparkles, WifiOff } from 'lucide-react';

/**
 * Props for ChatInterface component
 */
interface ChatInterfaceProps {
    className?: string;
    welcomeMessage?: string;
    placeholder?: string;
    showSuggestedQuestions?: boolean;
    maxHeight?: string;
    onMessageSent?: (message: ChatMessage) => void;
    onMessageReceived?: (message: ChatMessage) => void;
}

/**
 * Loading skeleton for chat interface
 */
function ChatInterfaceSkeleton() {
    return (
        <div className='space-y-4'>
            {/* Header skeleton */}
            <div className='flex items-center justify-between border-b p-4'>
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-8 w-8 rounded-full' />
            </div>

            {/* Messages skeleton */}
            <div className='space-y-4 p-4'>
                <div className='flex justify-start'>
                    <Skeleton className='h-16 w-3/4 rounded-lg' />
                </div>
                <div className='flex justify-end'>
                    <Skeleton className='h-12 w-1/2 rounded-lg' />
                </div>
                <div className='flex justify-start'>
                    <Skeleton className='h-20 w-2/3 rounded-lg' />
                </div>
            </div>

            {/* Input skeleton */}
            <div className='border-t p-4'>
                <Skeleton className='h-20 w-full rounded-lg' />
            </div>
        </div>
    );
}

/**
 * Error state component
 */
function ChatErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
    return (
        <Alert variant='destructive' className='m-4'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Chat Error</AlertTitle>
            <AlertDescription className='space-y-2'>
                <p>{error}</p>
                {onRetry && (
                    <Button variant='outline' size='sm' onClick={onRetry} className='mt-2'>
                        <RefreshCw className='mr-1 h-3 w-3' />
                        Try Again
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}

/**
 * Empty state component
 */
function ChatEmptyState({
    welcomeMessage,
    showSuggestedQuestions,
    onSelectQuestion
}: {
    welcomeMessage?: string;
    showSuggestedQuestions?: boolean;
    onSelectQuestion: (question: string) => void;
}) {
    return (
        <div className='flex h-full min-h-[400px] flex-col items-center justify-center p-4 sm:p-8 text-center'>
            <div className='w-full max-w-md space-y-4 sm:space-y-6'>
                {/* Icon */}
                <div className='flex justify-center'>
                    <div className='bg-primary/10 rounded-full p-4'>
                        <Sparkles className='text-primary h-8 w-8' />
                    </div>
                </div>

                {/* Welcome message */}
                <div className='space-y-2'>
                    <h3 className='text-base sm:text-lg font-semibold'>{welcomeMessage || 'Start a Conversation'}</h3>
                    <p className='text-muted-foreground text-xs sm:text-sm px-2 sm:px-0'>Ask me anything about this person's qualifications and experience.</p>
                </div>

                {/* Suggested questions */}
                {showSuggestedQuestions && (
                    <div className='mt-6'>
                        <SuggestedQuestions onSelectQuestion={onSelectQuestion} maxQuestions={4} />
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Main chat interface component
 * Assembles all chat components into a complete interface
 */
export function ChatInterface({
    className,
    welcomeMessage,
    placeholder = 'Type your message...',
    showSuggestedQuestions = true,
    onMessageSent,
    onMessageReceived
}: ChatInterfaceProps) {
    // Chat session management
    const {
        clientId,
        sessionId,
        messages,
        isLoading: isSessionLoading,
        addUserMessage,
        addAssistantMessage,
        updateMessage,
        clearSession
    } = useChatSession();

    // SSE chat streaming
    const {
        sendMessage,
        isStreaming,
        connectionState,
        error: streamError,
        currentResponse
    } = useSSEChat({
        onToken: (token) => {
            // Update the current assistant message with new token
            if (currentAssistantId.current && currentAssistantResponse.current !== undefined) {
                currentAssistantResponse.current += token;
                updateMessage(currentAssistantId.current, currentAssistantResponse.current);
            }
        },
        onComplete: (fullResponse) => {
            // Finalize the assistant message
            if (currentAssistantId.current) {
                updateMessage(currentAssistantId.current, fullResponse);

                // Callback
                const message = messages.find((m) => m.id === currentAssistantId.current);
                if (message && onMessageReceived) {
                    onMessageReceived(message);
                }

                currentAssistantId.current = null;
                currentAssistantResponse.current = '';
            }
        },
        onError: (error) => {
            setError(error);
            toast({
                title: 'Chat Error',
                description: error,
                variant: 'destructive'
            });

            // Update the message to show error
            if (currentAssistantId.current) {
                const messageId = currentAssistantId.current;
                updateMessage(messageId, 'Error: Failed to get response');
                currentAssistantId.current = null;
                currentAssistantResponse.current = '';
            }
        }
    });

    // Local state
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const currentAssistantId = useRef<string | null>(null);
    const currentAssistantResponse = useRef<string>('');

    // Initialize
    useEffect(() => {
        // Simulate initialization (checking for resume, etc.)
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // Handle sending a message
    const handleSendMessage = useCallback(
        (content: string) => {
            // Clear any previous errors
            setError(null);

            // Add user message
            const userMessage = addUserMessage(content);
            const userMessageId = userMessage.id; // Use the message ID

            // Callback
            if (onMessageSent) {
                onMessageSent(userMessage);
            }

            // Create placeholder for assistant message
            const assistantMessage = addAssistantMessage('');
            currentAssistantId.current = assistantMessage.id;
            currentAssistantResponse.current = '';

            // Send message via SSE
            sendMessage(content, clientId, userMessageId, sessionId);
        },
        [addUserMessage, addAssistantMessage, updateMessage, sendMessage, clientId, sessionId, onMessageSent]
    );

    // Handle selecting a suggested question
    const handleSelectQuestion = useCallback(
        (question: string) => {
            handleSendMessage(question);
        },
        [handleSendMessage]
    );

    // Handle retry on error
    const handleRetry = useCallback(() => {
        setError(null);
        // Could implement retry logic here
    }, []);

    // Handle clear session
    const handleClearSession = useCallback(() => {
        clearSession();
        setError(null);
        currentAssistantId.current = null;
        toast({
            title: 'Chat Cleared',
            description: 'Your conversation has been cleared.'
        });
    }, [clearSession]);

    // Check for various states
    const isOffline = connectionState === SSEState.ERROR && streamError?.includes('network');
    const hasMessages = messages.length > 0;
    const showEmptyState = !hasMessages && !isStreaming && !isInitializing;
    const showSuggestions = showSuggestedQuestions && !hasMessages && !isStreaming;

    // Loading state
    if (isInitializing || isSessionLoading) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <ChatInterfaceSkeleton />
            </Card>
        );
    }

    // Error state for critical errors
    if (error && !hasMessages) {
        return (
            <Card className={cn('overflow-hidden', className)}>
                <ChatErrorState error={error} onRetry={handleRetry} />
            </Card>
        );
    }

    return (
        <div className={cn('flex h-full flex-col bg-background', className)}>
            {/* Connection status banner */}
            {isOffline && (
                <Alert className='rounded-none border-x-0 border-t-0'>
                    <WifiOff className='h-4 w-4' />
                    <AlertDescription>
                        You appear to be offline. Messages will be queued and sent when connection is restored.
                    </AlertDescription>
                </Alert>
            )}

            {/* Chat header */}
            <div className='bg-muted/30 flex items-center justify-between border-b px-3 sm:px-4 py-2 sm:py-3'>
                <div className='flex items-center gap-1.5 sm:gap-2'>
                    <Sparkles className='text-primary h-4 w-4 sm:h-5 sm:w-5' />
                    <span className='font-semibold text-sm sm:text-base'>AI Resume Chat</span>
                    {isStreaming && (
                        <span className='text-muted-foreground hidden sm:flex items-center gap-1 text-xs'>
                            <Loader2 className='h-3 w-3 animate-spin' />
                            Responding...
                        </span>
                    )}
                </div>

                {hasMessages && (
                    <Button variant='ghost' size='sm' onClick={handleClearSession} className='text-xs px-2 sm:px-3'>
                        <RefreshCw className='mr-0.5 sm:mr-1 h-3 w-3' />
                        <span className='hidden sm:inline'>Clear</span>
                        <span className='sm:hidden'>Clear</span>
                    </Button>
                )}
            </div>

            {/* Main chat area */}
            <div className='flex-1 overflow-hidden'>
                {showEmptyState ? (
                    <ChatEmptyState
                        welcomeMessage={welcomeMessage}
                        showSuggestedQuestions={showSuggestions}
                        onSelectQuestion={handleSelectQuestion}
                    />
                ) : (
                    <MessageList 
                        messages={messages} 
                        isLoading={isStreaming} 
                        streamingMessageId={currentAssistantId.current || undefined}
                        className='h-full' 
                    />
                )}
            </div>

            {/* Suggested questions (when there are messages) - now as a compact inline strip */}
            {showSuggestedQuestions && hasMessages && !isStreaming && (
                <div className='border-t px-3 sm:px-4 py-2 bg-muted/10'>
                    <div className='flex items-start sm:items-center gap-2'>
                        <Sparkles className='text-muted-foreground h-3.5 w-3.5 flex-shrink-0 mt-0.5 sm:mt-0' />
                        <div className='flex gap-1.5 sm:gap-2 flex-wrap'>
                            <SuggestedQuestions
                                onSelectQuestion={handleSelectQuestion}
                                isLoading={isStreaming}
                                maxQuestions={3}
                                className='flex gap-2'
                                compact={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Chat input */}
            <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isStreaming}
                disabled={isOffline}
                placeholder={placeholder}
                className='border-t-0'
            />
        </div>
    );
}
