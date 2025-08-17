'use client';

import Link from 'next/link';

import { AppLayout } from '@/components/layout';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { MessageSquare, Shield, Sparkles } from 'lucide-react';

export default function Page() {
    return (
        <AppLayout>
            <div className='from-background via-background to-muted/30 flex h-full flex-1 flex-col bg-gradient-to-b'>
                <div className='container mx-auto flex-1 px-4 py-8 sm:py-16'>
                    <div className='mx-auto max-w-4xl space-y-6 text-center sm:space-y-8'>
                        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>Chat My CV</h1>
                        <p className='text-muted-foreground px-4 text-base sm:px-0 sm:text-lg md:text-xl'>
                            Intelligent conversational interface for exploring professional backgrounds
                        </p>

                        <div className='flex flex-col justify-center gap-3 px-4 pt-4 sm:flex-row sm:gap-4 sm:px-0 sm:pt-8'>
                            <Button asChild size='lg' className='w-full sm:w-auto'>
                                <Link href='/chat'>Start Chatting</Link>
                            </Button>
                            <Button asChild variant='outline' size='lg' className='w-full sm:w-auto'>
                                <Link href='/admin/login'>Admin Login</Link>
                            </Button>
                        </div>

                        <div className='grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2 sm:gap-6 sm:pt-16 md:grid-cols-3'>
                            <Card>
                                <CardHeader className='text-center'>
                                    <div className='bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                                        <MessageSquare className='text-primary h-8 w-8' />
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
                                    <div className='bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                                        <Sparkles className='text-primary h-8 w-8' />
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
                                    <div className='bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                                        <Shield className='text-primary h-8 w-8' />
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
