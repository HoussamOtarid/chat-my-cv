'use client';

import Link from 'next/link';

import { AppLayout } from '@/components/layout';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { MessageSquare, Shield, Sparkles } from 'lucide-react';

export default function Page() {
    return (
        <AppLayout>
            <div className='flex h-full flex-1 flex-col from-background via-background to-muted/30 bg-gradient-to-b'>
                <div className='container mx-auto flex-1 px-4 py-16'>
                    <div className='mx-auto max-w-4xl space-y-8 text-center'>
                        <h1 className='text-5xl font-bold tracking-tight'>Chat My CV</h1>
                        <p className='text-muted-foreground text-xl'>
                            Intelligent conversational interface for exploring professional backgrounds
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
                            <CardHeader className='text-center'>
                                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
                                    <MessageSquare className='h-8 w-8 text-primary' />
                                </div>
                                <CardTitle>Natural Conversations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className='text-center'>
                                    Ask questions about professional experience, skills, and achievements in natural
                                    language
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className='text-center'>
                                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
                                    <Sparkles className='h-8 w-8 text-primary' />
                                </div>
                                <CardTitle>AI-Powered</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className='text-center'>
                                    Get instant insights powered by advanced AI from OpenAI, Anthropic, and more
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className='text-center'>
                                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
                                    <Shield className='h-8 w-8 text-primary' />
                                </div>
                                <CardTitle>Secure & Private</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className='text-center'>
                                    Resume data is encrypted and stored securely with role-based access control
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
