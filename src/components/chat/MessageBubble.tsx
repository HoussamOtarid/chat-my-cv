'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/new-york-v4/ui/avatar';
import { Card } from '@/registry/new-york-v4/ui/card';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Button } from '@/registry/new-york-v4/ui/button';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/types';

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
                description: 'The message has been copied to your clipboard.',
            });
            
            // Reset the copy state after 2 seconds
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            toast({
                title: 'Failed to copy',
                description: 'Unable to copy the message. Please try again.',
                variant: 'destructive',
            });
        }
    };


    if (isSystem) {
        // System messages are displayed as notices
        return (
            <div className={cn('flex justify-center my-4', className)}>
                <Card className="bg-muted/50 border-muted px-4 py-2 max-w-md">
                    <p className="text-sm text-muted-foreground text-center">
                        {message.content}
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex gap-3 mb-4',
                isUser ? 'justify-end' : 'justify-start',
                className
            )}
        >
            {/* Avatar for assistant messages */}
            {isAssistant && (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
                    <AvatarFallback>
                        <Bot className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Message bubble */}
            <div
                className={cn(
                    'group relative max-w-[70%] md:max-w-[60%]',
                    isUser && 'flex flex-col items-end'
                )}
            >
                <div
                    className={cn(
                        'rounded-lg px-4 py-2.5 text-sm',
                        isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted border border-border',
                        isStreaming && 'animate-pulse'
                    )}
                >
                    <div className="relative prose prose-sm dark:prose-invert max-w-none">
                        {isUser ? (
                            // User messages render as plain text
                            <p className="mb-0">{message.content}</p>
                        ) : (
                            // Assistant messages render as markdown
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Custom component overrides for better styling
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                                    li: ({ children }) => <li className="mb-1">{children}</li>,
                                    code: ({ className, children }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const isInline = !match;
                                        
                                        if (isInline) {
                                            return <code className="px-1 py-0.5 rounded bg-muted text-sm">{children}</code>;
                                        }
                                        return (
                                            <code className={cn("block p-3 rounded-md bg-muted overflow-x-auto text-sm", className)}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    pre: ({ children }) => <pre className="mb-2 overflow-x-auto">{children}</pre>,
                                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-2">
                                            {children}
                                        </blockquote>
                                    ),
                                    a: ({ href, children }) => (
                                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                                            {children}
                                        </a>
                                    ),
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )}
                        
                        {/* Streaming indicator */}
                        {isStreaming && isAssistant && (
                            <span className="inline-block w-1 h-4 bg-current animate-blink ml-1" />
                        )}
                    </div>
                </div>

                {/* Copy button for assistant messages */}
                {isAssistant && !isStreaming && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'absolute -right-10 top-0 h-8 w-8',
                            'opacity-0 group-hover:opacity-100 transition-opacity'
                        )}
                        onClick={handleCopy}
                    >
                        {isCopied ? (
                            <Check className="h-3 w-3" />
                        ) : (
                            <Copy className="h-3 w-3" />
                        )}
                        <span className="sr-only">Copy message</span>
                    </Button>
                )}

                {/* Timestamp */}
                <div
                    className={cn(
                        'text-xs text-muted-foreground mt-1 px-1',
                        isUser ? 'text-right' : 'text-left'
                    )}
                >
                    {new Date(message.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                    })}
                </div>
            </div>

            {/* Avatar for user messages */}
            {isUser && (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src="/user-avatar.png" alt="User" />
                    <AvatarFallback>
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}