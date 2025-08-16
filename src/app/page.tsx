'use client';

import Link from 'next/link';

import { AppLayout } from '@/components/layout';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { MessageSquare, Shield, Sparkles } from 'lucide-react';

export default function Page() {
    return (
        <AppLayout>
            <div className='from-background to-secondary/20 bg-gradient-to-b'>
                <div className='container mx-auto px-4 py-16'>
                <div className='mx-auto max-w-4xl space-y-8 text-center'>
                    <h1 className='text-5xl font-bold tracking-tight'>Chat My CV</h1>
                    <p className='text-muted-foreground text-xl'>
                        Intelligent conversational interface for your professional resume
                    </p>

                    <div className='flex justify-center gap-4 pt-8'>
                        <Button asChild size='lg'>
                            <Link href='/chat'>Start Chatting</Link>
                        </Button>
                        <Button asChild variant='outline' size='lg'>
                            <Link href='/admin/login'>Admin Login</Link>
                        </Button>
                    </div>

                    <div className='grid gap-6 pt-16 md:grid-cols-3'>
                        <Card>
                            <CardHeader>
                                <MessageSquare className='text-primary mb-2 h-10 w-10' />
                                <CardTitle>Natural Conversations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Ask questions about professional experience, skills, and achievements in natural
                                    language
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Sparkles className='text-primary mb-2 h-10 w-10' />
                                <CardTitle>AI-Powered</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Powered by advanced language models from OpenAI, Anthropic, or Google AI
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Shield className='text-primary mb-2 h-10 w-10' />
                                <CardTitle>Secure & Private</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Your resume data is encrypted and stored securely with role-based access control
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            </div>
        </AppLayout>
    );
}
