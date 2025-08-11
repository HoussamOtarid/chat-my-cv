'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/new-york-v4/ui/avatar';
import { Card } from '@/registry/new-york-v4/ui/card';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Button } from '@/registry/new-york-v4/ui/button';
import { toast } from '@/hooks/use-toast';
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

    // Format the message content - preserve newlines and code blocks
    const formatContent = (content: string) => {
        // Split by code blocks (```...```)
        const parts = content.split(/(```[\s\S]*?```)/g);
        
        return parts.map((part, index) => {
            if (part.startsWith('```')) {
                // Code block
                const codeContent = part.slice(3, -3);
                const [language, ...codeLines] = codeContent.split('\n');
                const code = codeLines.join('\n');
                
                return (
                    <pre key={index} className="bg-muted p-4 rounded-md overflow-x-auto my-2">
                        <code className={`language-${language || 'plaintext'}`}>
                            {code || codeContent}
                        </code>
                    </pre>
                );
            } else {
                // Regular text - preserve line breaks
                return (
                    <span key={index} className="whitespace-pre-wrap break-words">
                        {part}
                    </span>
                );
            }
        });
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
                    <div className="relative">
                        {formatContent(message.content)}
                        
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