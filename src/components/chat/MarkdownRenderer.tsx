'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={className}>
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
            {content}
        </ReactMarkdown>
        </div>
    );
}