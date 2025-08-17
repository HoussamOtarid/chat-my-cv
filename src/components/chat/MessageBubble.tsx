'use client';

import React from 'react';

import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/new-york-v4/ui/avatar';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card } from '@/registry/new-york-v4/ui/card';
import type { ChatMessage } from '@/types';

import { Bot, Check, Copy, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
    message: ChatMessage;
    isStreaming?: boolean;
    className?: string;
}

export function MessageBubble({ message, isStreaming = false, className }: MessageBubbleProps) {
    const [isCopied, setIsCopied] = React.useState(false);
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const isSystem = message.role === 'system';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setIsCopied(true);
            toast({
                title: 'Copied to clipboard',
                description: 'The message has been copied to your clipboard.'
            });

            // Reset the copy state after 2 seconds
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            toast({
                title: 'Failed to copy',
                description: 'Unable to copy the message. Please try again.',
                variant: 'destructive'
            });
        }
    };

    if (isSystem) {
        // System messages are displayed as notices
        return (
            <div className={cn('my-4 flex justify-center', className)}>
                <Card className='bg-muted/50 border-muted max-w-md px-4 py-2'>
                    <p className='text-muted-foreground text-center text-sm'>{message.content}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className={cn('mb-3 flex gap-2 sm:mb-4 sm:gap-3', isUser ? 'justify-end' : 'justify-start', className)}>
            {/* Avatar for assistant messages */}
            {isAssistant && (
                <Avatar className='h-7 w-7 shrink-0 sm:h-8 sm:w-8'>
                    <AvatarImage src='/ai-avatar.png' alt='AI Assistant' />
                    <AvatarFallback>
                        <Bot className='h-4 w-4' />
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Message bubble */}
            <div
                className={cn(
                    'group relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%]',
                    isUser && 'flex flex-col items-end'
                )}>
                <div
                    className={cn(
                        'rounded-lg px-3 py-2 text-sm sm:px-4 sm:py-2.5',
                        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted border-border border',
                        isStreaming && 'animate-pulse'
                    )}>
                    <div className='prose prose-sm dark:prose-invert relative max-w-none'>
                        {isUser ? (
                            // User messages render as plain text
                            <p className='mb-0'>{message.content}</p>
                        ) : isAssistant && isStreaming && message.content === '' ? (
                            // Show loading dots for empty streaming assistant messages
                            <div className='flex items-center space-x-1 py-1'>
                                <div className='bg-foreground/40 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]' />
                                <div className='bg-foreground/40 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]' />
                                <div className='bg-foreground/40 h-2 w-2 animate-bounce rounded-full' />
                            </div>
                        ) : isAssistant ? (
                            // Assistant messages render as markdown
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Custom component overrides for better styling
                                    p: ({ children }) => <p className='mb-2 last:mb-0'>{children}</p>,
                                    ul: ({ children }) => <ul className='mb-2 ml-4 list-disc'>{children}</ul>,
                                    ol: ({ children }) => <ol className='mb-2 ml-4 list-decimal'>{children}</ol>,
                                    li: ({ children }) => <li className='mb-1'>{children}</li>,
                                    code: ({ className, children }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const isInline = !match;

                                        if (isInline) {
                                            return (
                                                <code className='bg-muted rounded px-1 py-0.5 text-sm'>{children}</code>
                                            );
                                        }

                                        return (
                                            <code
                                                className={cn(
                                                    'bg-muted block overflow-x-auto rounded-md p-3 text-sm',
                                                    className
                                                )}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    pre: ({ children }) => <pre className='mb-2 overflow-x-auto'>{children}</pre>,
                                    h1: ({ children }) => <h1 className='mb-2 text-lg font-bold'>{children}</h1>,
                                    h2: ({ children }) => <h2 className='mb-2 text-base font-bold'>{children}</h2>,
                                    h3: ({ children }) => <h3 className='mb-2 text-sm font-bold'>{children}</h3>,
                                    blockquote: ({ children }) => (
                                        <blockquote className='border-muted-foreground/30 my-2 border-l-4 pl-4 italic'>
                                            {children}
                                        </blockquote>
                                    ),
                                    a: ({ href, children }) => (
                                        <a
                                            href={href}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-primary underline hover:no-underline'>
                                            {children}
                                        </a>
                                    ),
                                    strong: ({ children }) => <strong className='font-semibold'>{children}</strong>,
                                    em: ({ children }) => <em className='italic'>{children}</em>
                                }}>
                                {message.content}
                            </ReactMarkdown>
                        ) : (
                            // System or other messages
                            <p className='mb-0'>{message.content}</p>
                        )}

                        {/* Streaming cursor - only show when there's content */}
                        {isStreaming && isAssistant && message.content && (
                            <span className='animate-blink ml-1 inline-block h-4 w-1 bg-current' />
                        )}
                    </div>
                </div>

                {/* Copy button for assistant messages */}
                {isAssistant && !isStreaming && (
                    <Button
                        variant='ghost'
                        size='icon'
                        className={cn(
                            'absolute top-0 -right-8 h-7 w-7 sm:-right-10 sm:h-8 sm:w-8',
                            'opacity-0 transition-opacity group-hover:opacity-100',
                            'hidden sm:flex' // Hide on mobile to avoid crowding
                        )}
                        onClick={handleCopy}>
                        {isCopied ? <Check className='h-3 w-3' /> : <Copy className='h-3 w-3' />}
                        <span className='sr-only'>Copy message</span>
                    </Button>
                )}

                {/* Timestamp */}
                <div className={cn('text-muted-foreground mt-1 px-1 text-xs', isUser ? 'text-right' : 'text-left')}>
                    {new Date(message.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                    })}
                </div>
            </div>

            {/* Avatar for user messages */}
            {isUser && (
                <Avatar className='h-7 w-7 shrink-0 sm:h-8 sm:w-8'>
                    <AvatarImage src='/user-avatar.png' alt='User' />
                    <AvatarFallback>
                        <User className='h-4 w-4' />
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}
