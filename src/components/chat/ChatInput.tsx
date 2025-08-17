'use client';

import React, { FormEvent, KeyboardEvent, useCallback, useRef, useState } from 'react';

import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Textarea } from '@/registry/new-york-v4/ui/textarea';

import { AlertCircle, Loader2, Mic, Paperclip, Send } from 'lucide-react';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
    className?: string;
    showAttachButton?: boolean;
    showVoiceButton?: boolean;
}

export function ChatInput({
    onSendMessage,
    isLoading = false,
    disabled = false,
    placeholder = 'Type your message...',
    maxLength = 4000,
    className,
    showAttachButton = false,
    showVoiceButton = false
}: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [rows, setRows] = useState(1);
    const maxRows = 5;

    // Auto-resize textarea based on content
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';

        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const minHeight = lineHeight;
        const maxHeight = lineHeight * maxRows;
        const scrollHeight = textarea.scrollHeight;

        // Calculate new height
        const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
        textarea.style.height = `${newHeight}px`;

        // Update rows for visual feedback
        const newRows = Math.min(Math.max(Math.ceil(scrollHeight / lineHeight), 1), maxRows);
        setRows(newRows);
    }, [maxRows]);

    // Handle message change
    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newMessage = e.target.value;

        // Check max length
        if (newMessage.length <= maxLength) {
            setMessage(newMessage);
            setCharCount(newMessage.length);
            adjustTextareaHeight();
        } else {
            toast({
                title: 'Message too long',
                description: `Maximum message length is ${maxLength} characters`,
                variant: 'destructive'
            });
        }
    };

    // Validate message
    const validateMessage = (msg: string): { valid: boolean; error?: string } => {
        const trimmedMessage = msg.trim();

        if (!trimmedMessage) {
            return { valid: false, error: 'Message cannot be empty' };
        }

        if (trimmedMessage.length > maxLength) {
            return { valid: false, error: `Message exceeds ${maxLength} characters` };
        }

        // Check for spam patterns (basic example)
        const spamPatterns = [
            /(.)\1{20,}/g, // Same character repeated 20+ times
            /(.)(.)\1\2{10,}/g // Pattern repeated 10+ times
        ];

        for (const pattern of spamPatterns) {
            if (pattern.test(trimmedMessage)) {
                return { valid: false, error: 'Message appears to be spam' };
            }
        }

        return { valid: true };
    };

    // Handle send message
    const handleSend = useCallback(() => {
        const validation = validateMessage(message);

        if (!validation.valid) {
            if (validation.error) {
                toast({
                    title: 'Invalid message',
                    description: validation.error,
                    variant: 'destructive'
                });
            }

            return;
        }

        // Send the message
        onSendMessage(message.trim());

        // Clear the input
        setMessage('');
        setCharCount(0);
        setRows(1);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [message, onSendMessage, maxLength]);

    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Send on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            handleSend();
        }

        // Clear on Escape
        if (e.key === 'Escape') {
            setMessage('');
            setCharCount(0);
            setRows(1);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.blur();
            }
        }
    };

    // Handle form submission
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        handleSend();
    };

    // Handle composition events for IME support
    const handleCompositionStart = () => setIsComposing(true);
    const handleCompositionEnd = () => setIsComposing(false);

    // Focus textarea on mount
    React.useEffect(() => {
        if (textareaRef.current && !disabled) {
            textareaRef.current.focus();
        }
    }, [disabled]);

    const isDisabled = disabled || isLoading;
    const showCharCount = charCount > maxLength * 0.8; // Show when 80% of limit reached

    return (
        <div className={cn('bg-background border-t', className)}>
            <form onSubmit={handleSubmit} className='p-3 sm:p-4'>
                <div className='flex flex-col gap-2'>
                    {/* Character count warning */}
                    {showCharCount && (
                        <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                            <AlertCircle className='h-3 w-3' />
                            <span>
                                {charCount} / {maxLength} characters
                            </span>
                        </div>
                    )}

                    {/* Input area */}
                    <div className='flex gap-1.5 sm:gap-2'>
                        <div className='relative flex-1'>
                            <Textarea
                                ref={textareaRef}
                                value={message}
                                onChange={handleMessageChange}
                                onKeyDown={handleKeyDown}
                                onCompositionStart={handleCompositionStart}
                                onCompositionEnd={handleCompositionEnd}
                                placeholder={isLoading ? 'Waiting for response...' : placeholder}
                                disabled={isDisabled}
                                rows={rows}
                                className={cn(
                                    'resize-none pr-2',
                                    'focus-visible:ring-1',
                                    'transition-all duration-200',
                                    'min-h-[44px] sm:min-h-[40px]', // Better touch target on mobile
                                    'text-base sm:text-sm', // Prevent zoom on iOS
                                    isDisabled && 'cursor-not-allowed opacity-50'
                                )}
                                aria-label='Chat message input'
                            />
                        </div>

                        {/* Action buttons */}
                        <div className='flex flex-col gap-1'>
                            {/* Send button */}
                            <Button
                                type='submit'
                                size='icon'
                                disabled={isDisabled || !message.trim()}
                                className='h-10 w-10 touch-manipulation sm:h-9 sm:w-9'
                                aria-label='Send message'>
                                {isLoading ? (
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                    <Send className='h-4 w-4' />
                                )}
                            </Button>

                            {/* Optional attachment button */}
                            {showAttachButton && !isLoading && (
                                <Button
                                    type='button'
                                    size='icon'
                                    variant='ghost'
                                    disabled={isDisabled}
                                    className='h-9 w-9'
                                    onClick={() => {
                                        toast({
                                            title: 'Attachments',
                                            description: 'File attachments will be available in a future update'
                                        });
                                    }}
                                    aria-label='Attach file'>
                                    <Paperclip className='h-4 w-4' />
                                </Button>
                            )}

                            {/* Optional voice button */}
                            {showVoiceButton && !isLoading && (
                                <Button
                                    type='button'
                                    size='icon'
                                    variant='ghost'
                                    disabled={isDisabled}
                                    className='h-9 w-9'
                                    onClick={() => {
                                        toast({
                                            title: 'Voice input',
                                            description: 'Voice input will be available in a future update'
                                        });
                                    }}
                                    aria-label='Voice input'>
                                    <Mic className='h-4 w-4' />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Help text */}
                    <div className='text-muted-foreground flex items-center justify-between text-[10px] sm:text-xs'>
                        <span className='hidden sm:inline'>Press Enter to send, Shift+Enter for new line</span>
                        <span className='sm:hidden'>Tap send or press Enter</span>
                        {isLoading && (
                            <span className='flex items-center gap-1'>
                                <Loader2 className='h-3 w-3 animate-spin' />
                                AI is responding...
                            </span>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
