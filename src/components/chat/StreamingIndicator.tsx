'use client';

import React, { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/registry/new-york-v4/ui/avatar';

import { Bot } from 'lucide-react';

interface StreamingIndicatorProps {
    /** The text being streamed, token by token */
    streamingText?: string;
    /** Whether streaming is currently active */
    isStreaming?: boolean;
    /** Show typing dots animation when no text yet */
    showTypingAnimation?: boolean;
    /** Custom className for the container */
    className?: string;
    /** Callback when streaming completes */
    onComplete?: () => void;
}

export function StreamingIndicator({
    streamingText = '',
    isStreaming = false,
    showTypingAnimation = true,
    className,
    onComplete
}: StreamingIndicatorProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const animationFrameRef = useRef<number>(0);
    const lastUpdateRef = useRef<number>(0);
    const textRef = useRef<HTMLDivElement>(null);
    const completeCallbackRef = useRef(onComplete);

    // Update callback ref
    useEffect(() => {
        completeCallbackRef.current = onComplete;
    }, [onComplete]);

    // Token-by-token display logic with smooth animation
    useEffect(() => {
        if (!isStreaming || !streamingText) {
            // Reset when not streaming
            if (!isStreaming && displayedText && completeCallbackRef.current) {
                completeCallbackRef.current();
            }

            return;
        }

        // If new text is shorter (new message started), reset
        if (streamingText.length < displayedText.length) {
            setDisplayedText('');
            setCurrentIndex(0);
        }

        const animate = (timestamp: number) => {
            // Control animation speed (characters per second)
            const charsPerSecond = 30;
            const msPerChar = 1000 / charsPerSecond;

            if (timestamp - lastUpdateRef.current >= msPerChar) {
                if (currentIndex < streamingText.length) {
                    // Add next character(s)
                    const nextIndex = Math.min(currentIndex + 1, streamingText.length);

                    setDisplayedText(streamingText.slice(0, nextIndex));
                    setCurrentIndex(nextIndex);
                    lastUpdateRef.current = timestamp;
                }
            }

            if (currentIndex < streamingText.length) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        // Start animation
        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [streamingText, isStreaming, currentIndex, displayedText]);

    // Auto-scroll to keep new content visible
    useEffect(() => {
        if (textRef.current) {
            const element = textRef.current;
            const parent = element.parentElement;

            if (parent) {
                // Smooth scroll to show new content
                parent.scrollTo({
                    top: element.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [displayedText]);

    // Format the text content with proper line breaks and code blocks
    const formatContent = (content: string) => {
        if (!content) return null;

        // Split by code blocks (```...```)
        const parts = content.split(/(```[\s\S]*?```)/g);

        return parts.map((part, index) => {
            if (part.startsWith('```')) {
                // Code block
                const codeContent = part.slice(3, -3);
                const [language, ...codeLines] = codeContent.split('\n');
                const code = codeLines.join('\n');

                return (
                    <pre key={index} className='bg-muted my-2 overflow-x-auto rounded-md p-4'>
                        <code className={`language-${language || 'plaintext'}`}>{code || codeContent}</code>
                    </pre>
                );
            } else {
                // Regular text - preserve line breaks
                return (
                    <span key={index} className='break-words whitespace-pre-wrap'>
                        {part}
                    </span>
                );
            }
        });
    };

    // Typing dots animation
    const TypingDots = () => (
        <div className='flex items-center space-x-2 p-3'>
            <div className='flex space-x-1'>
                <div className='bg-foreground/40 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]' />
                <div className='bg-foreground/40 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]' />
                <div className='bg-foreground/40 h-2 w-2 animate-bounce rounded-full' />
            </div>
            <span className='text-muted-foreground ml-2 text-sm'>AI is thinking...</span>
        </div>
    );

    // Don't render if not streaming and no text
    if (!isStreaming && !displayedText) {
        return null;
    }

    return (
        <div className={cn('mb-4 flex gap-3', className)}>
            {/* Avatar */}
            <Avatar className='h-8 w-8 shrink-0'>
                <AvatarFallback>
                    <Bot className='h-4 w-4' />
                </AvatarFallback>
            </Avatar>

            {/* Message bubble */}
            <div className='max-w-[70%] flex-1 md:max-w-[60%]'>
                <div
                    className={cn(
                        'bg-muted border-border rounded-lg border',
                        'transition-all duration-200 ease-in-out',
                        isStreaming && 'shadow-sm'
                    )}>
                    {/* Show typing animation if no text yet */}
                    {isStreaming && !displayedText && showTypingAnimation ? (
                        <TypingDots />
                    ) : (
                        <div className='px-4 py-2.5 text-sm'>
                            <div ref={textRef} className='relative'>
                                {formatContent(displayedText)}

                                {/* Cursor for active streaming */}
                                {isStreaming && displayedText && (
                                    <span className='bg-foreground animate-blink -mb-0.5 ml-0.5 inline-block h-4 w-0.5' />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Streaming status */}
                {isStreaming && (
                    <div className='mt-1 flex items-center gap-2 px-1'>
                        <div className='flex space-x-1'>
                            <div className='h-1 w-1 animate-pulse rounded-full bg-green-500' />
                            <div className='h-1 w-1 animate-pulse rounded-full bg-green-500 [animation-delay:0.2s]' />
                            <div className='h-1 w-1 animate-pulse rounded-full bg-green-500 [animation-delay:0.4s]' />
                        </div>
                        <span className='text-muted-foreground text-xs'>Streaming response...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Standalone streaming text component for integration with existing message displays
export function StreamingText({
    text,
    isComplete = false,
    className
}: {
    text: string;
    isComplete?: boolean;
    className?: string;
}) {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        if (isComplete) {
            // Show all text immediately when complete
            setDisplayedText(text);
            indexRef.current = text.length;

            return;
        }

        // Animate text display
        const animate = () => {
            if (indexRef.current < text.length) {
                const nextIndex = Math.min(indexRef.current + 2, text.length);
                setDisplayedText(text.slice(0, nextIndex));
                indexRef.current = nextIndex;
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [text, isComplete]);

    return (
        <span className={className}>
            {displayedText}
            {!isComplete && displayedText && (
                <span className='animate-blink ml-0.5 inline-block h-4 w-0.5 bg-current' />
            )}
        </span>
    );
}
