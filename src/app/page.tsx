'use client';

import Link from 'next/link';

import { AppLayout } from '@/components/layout';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { MessageSquare, Shield, Sparkles } from 'lucide-react';

const features = [
    {
        icon: MessageSquare,
        title: 'Natural Conversations',
        description: 'Ask questions about professional experience, skills, and achievements in natural language'
    },
    {
        icon: Sparkles,
        title: 'AI-Powered',
        description: 'Get instant insights powered by advanced AI from OpenAI, Anthropic, and more'
    },
    {
        icon: Shield,
        title: 'Secure & Private',
        description: 'Resume data is encrypted and stored securely with role-based access control'
    }
];

export default function Page() {
    return (
        <AppLayout>
            <div className='from-background to-muted/20 flex h-full flex-1 flex-col bg-gradient-to-b'>
                <div className='container mx-auto flex-1 px-4 py-8 sm:py-16'>
                    <div className='mx-auto max-w-4xl space-y-6 text-center sm:space-y-8'>
                        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
                            Chat My CV
                        </h1>
                        
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
                            {features.map((feature, index) => {
                                const Icon = feature.icon;

                                return (
                                    <Card 
                                        key={index}
                                        className='group transition-all hover:-translate-y-1 hover:shadow-lg'>
                                        <CardHeader className='text-center'>
                                            <div className='bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg'>
                                                <Icon className='text-primary h-6 w-6' />
                                            </div>
                                            <CardTitle className='text-lg'>
                                                {feature.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className='text-center'>
                                                {feature.description}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}