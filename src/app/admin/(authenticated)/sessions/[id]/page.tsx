'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';

import { ArrowLeft, Bot, Copy, User } from 'lucide-react';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/chat';

interface Message {
    id: string;
    clientMessageId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
}

interface SessionDetails {
    id: string;
    clientId: string;
    ipHash: string | null;
    createdAt: string;
    messages: Message[];
}

export default function SessionDetailPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const [session, setSession] = useState<SessionDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sessionId) {
            fetchSessionDetails();
        }
    }, [sessionId]);

    const fetchSessionDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/sessions/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                setSession(data);
            } else {
                console.error('Failed to fetch session details');
            }
        } catch (error) {
            console.error('Error fetching session:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Copied to clipboard');
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    if (loading) {
        return (
            <div className='container mx-auto max-w-6xl space-y-6 px-4 py-8'>
                <Skeleton className='h-10 w-48' />
                <Skeleton className='h-32 w-full' />
                <Skeleton className='h-96 w-full' />
            </div>
        );
    }

    if (!session) {
        return (
            <div className='container mx-auto max-w-6xl space-y-6 px-4 py-8'>
                <div className='text-center py-12'>
                    <h2 className='text-2xl font-semibold mb-2'>Session not found</h2>
                    <p className='text-muted-foreground mb-4'>
                        The session you're looking for doesn't exist.
                    </p>
                    <Button asChild>
                        <Link href='/admin/sessions'>
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Back to Sessions
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className='container mx-auto max-w-6xl space-y-6 px-4 py-8'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>Session Details</h1>
                    <p className='text-muted-foreground'>
                        Viewing conversation from {formatDate(session.createdAt)}
                    </p>
                </div>
                <Button variant='outline' asChild>
                    <Link href='/admin/sessions'>
                        <ArrowLeft className='mr-2 h-4 w-4' />
                        Back to Sessions
                    </Link>
                </Button>
            </div>

            {/* Session Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Session Information</CardTitle>
                    <CardDescription>Metadata for this chat session</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='grid gap-4 md:grid-cols-2'>
                        <div>
                            <p className='text-sm font-medium text-muted-foreground'>Session ID</p>
                            <div className='flex items-center gap-2'>
                                <p className='font-mono text-sm'>{session.id}</p>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => copyToClipboard(session.id)}
                                >
                                    <Copy className='h-3 w-3' />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <p className='text-sm font-medium text-muted-foreground'>Client ID</p>
                            <div className='flex items-center gap-2'>
                                <p className='font-mono text-sm'>{session.clientId}</p>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => copyToClipboard(session.clientId)}
                                >
                                    <Copy className='h-3 w-3' />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <p className='text-sm font-medium text-muted-foreground'>Started</p>
                            <p className='text-sm'>{formatDate(session.createdAt)}</p>
                        </div>
                        <div>
                            <p className='text-sm font-medium text-muted-foreground'>Total Messages</p>
                            <p className='text-sm'>{session.messages.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Messages */}
            <Card>
                <CardHeader>
                    <CardTitle>Conversation</CardTitle>
                    <CardDescription>
                        {session.messages.length} messages in this session
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {session.messages.length === 0 ? (
                        <div className='text-center py-8 text-muted-foreground'>
                            No messages in this session
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {session.messages.map((message) => (
                                <div 
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* Avatar for assistant messages */}
                                    {message.role === 'assistant' && (
                                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted'>
                                            <Bot className='h-4 w-4' />
                                        </div>
                                    )}
                                    
                                    {/* Message bubble */}
                                    <div className={`group relative max-w-[70%] ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                                        <div 
                                            className={`rounded-lg px-4 py-2.5 text-sm ${
                                                message.role === 'user' 
                                                    ? 'bg-primary text-primary-foreground' 
                                                    : 'bg-muted border border-border'
                                            }`}
                                        >
                                            {message.role === 'user' ? (
                                                // User messages as plain text (matching MessageBubble behavior)
                                                <p className='mb-0'>{message.content}</p>
                                            ) : (
                                                // Assistant messages with markdown
                                                <div className='prose prose-sm max-w-none dark:prose-invert'>
                                                    <MarkdownRenderer content={message.content} />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Time and copy button */}
                                        <div className='mt-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                            <span className='text-xs text-muted-foreground'>
                                                {formatTime(message.createdAt)}
                                            </span>
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                className='h-6 px-2'
                                                onClick={() => copyToClipboard(message.content)}
                                            >
                                                <Copy className='h-3 w-3' />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {/* Avatar for user messages */}
                                    {message.role === 'user' && (
                                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10'>
                                            <User className='h-4 w-4' />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}