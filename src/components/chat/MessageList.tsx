'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/registry/new-york-v4/ui/button';
import { ScrollArea } from '@/registry/new-york-v4/ui/scroll-area';
import type { ChatMessage } from '@/types';

import { MessageBubble } from './MessageBubble';
import { ArrowDown } from 'lucide-react';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading?: boolean;
    streamingMessageId?: string;
    className?: string;
    autoScroll?: boolean;
}

export function MessageList({
    messages,
    isLoading = false,
    streamingMessageId,
    className,
    autoScroll = true
}: MessageListProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const lastScrollTop = useRef(0);

    // Scroll to bottom function
    const scrollToBottom = useCallback((smooth = true) => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto',
                block: 'end'
            });
        }
    }, []);

    // Check if user is near bottom
    const isNearBottom = useCallback(() => {
        if (!scrollAreaRef.current) return true;

        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (!scrollContainer) return true;

        const threshold = 100; // pixels from bottom
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

        return scrollHeight - scrollTop - clientHeight < threshold;
    }, []);

    // Handle scroll events to detect user scrolling
    const handleScroll = useCallback(
        (e: Event) => {
            const target = e.target as HTMLElement;
            const currentScrollTop = target.scrollTop;

            // Detect if user is scrolling up
            if (currentScrollTop < lastScrollTop.current && !isNearBottom()) {
                setIsUserScrolling(true);
                setShowScrollButton(true);
            } else if (isNearBottom()) {
                setIsUserScrolling(false);
                setShowScrollButton(false);
            }

            lastScrollTop.current = currentScrollTop;
        },
        [isNearBottom]
    );

    // Set up scroll event listener
    useEffect(() => {
        const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');

        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);

            return () => {
                scrollContainer.removeEventListener('scroll', handleScroll);
            };
        }

        return undefined;
    }, [handleScroll]);

    // Auto-scroll when new messages arrive (if enabled and user isn't manually scrolling)
    useEffect(() => {
        if (autoScroll && !isUserScrolling && messages.length > 0) {
            // Use a small delay to ensure DOM is updated
            const timer = setTimeout(() => {
                scrollToBottom();
            }, 100);

            return () => clearTimeout(timer);
        }

        return undefined;
    }, [messages, autoScroll, isUserScrolling, scrollToBottom]);

    // Handle scroll button click
    const handleScrollButtonClick = () => {
        scrollToBottom();
        setIsUserScrolling(false);
        setShowScrollButton(false);
    };

    // Empty state
    if (messages.length === 0 && !isLoading) {
        return (
            <div className={cn('flex h-full items-center justify-center', className)}>
                <div className='space-y-2 text-center'>
                    <p className='text-muted-foreground'>No messages yet</p>
                    <p className='text-muted-foreground text-sm'>Start a conversation by typing a message below</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('relative h-full', className)}>
            <ScrollArea
                ref={scrollAreaRef}
                className='-webkit-overflow-scrolling-touch h-full px-3 py-3 sm:px-4 sm:py-4'>
                {/* Virtual scrolling implementation */}
                {/* For large message lists, we could use react-window or react-virtualized */}
                {/* For MVP, we'll render all messages but limit history in localStorage */}

                <div className='space-y-2 sm:space-y-3'>
                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isStreaming={streamingMessageId === message.id}
                        />
                    ))}
                </div>

                {/* Scroll anchor */}
                <div ref={bottomRef} className='h-1' />
            </ScrollArea>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <Button
                    variant='secondary'
                    size='icon'
                    className={cn(
                        'absolute right-3 bottom-3 rounded-full shadow-lg sm:right-4 sm:bottom-4',
                        'transition-all duration-200 ease-in-out',
                        'hover:scale-110',
                        'h-9 w-9 touch-manipulation sm:h-10 sm:w-10'
                    )}
                    onClick={handleScrollButtonClick}>
                    <ArrowDown className='h-4 w-4' />
                    <span className='sr-only'>Scroll to bottom</span>
                </Button>
            )}
        </div>
    );
}

// Note: Animation styles have been added to globals.css
