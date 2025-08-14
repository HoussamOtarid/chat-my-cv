'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useTheme } from 'next-themes';

import { ChatInterface } from '@/components/chat';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';

import { AlertCircle, ArrowLeft, FileText, Menu, Moon, Settings, Sparkles, Sun, X } from 'lucide-react';

/**
 * Public chat page component
 * Main interface for users to interact with the AI resume chat
 */
export default function ChatPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [hasActiveResume, setHasActiveResume] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch for theme
    useEffect(() => {
        setMounted(true);
    }, []);

    // Check if there's an active resume
    useEffect(() => {
        const checkResume = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Check if resume endpoint exists and has active resume
                const response = await fetch('/api/resume/current', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setHasActiveResume(!!data.resume);
                } else if (response.status === 404) {
                    // Endpoint doesn't exist yet or no active resume
                    setHasActiveResume(false);
                } else {
                    throw new Error('Failed to check resume status');
                }
            } catch (err) {
                console.error('Resume check error:', err);
                // Assume resume exists if we can't check (optimistic)
                setHasActiveResume(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkResume();
    }, []);

    // Handle theme toggle
    const handleThemeToggle = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Mobile menu toggle
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className='bg-background min-h-screen'>
                {/* Header Skeleton */}
                <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
                    <div className='container flex h-14 items-center'>
                        <Skeleton className='h-8 w-32' />
                        <div className='ml-auto flex items-center space-x-4'>
                            <Skeleton className='h-8 w-8 rounded-full' />
                        </div>
                    </div>
                </header>

                {/* Main Content Skeleton */}
                <main className='container mx-auto px-4 py-8'>
                    <Skeleton className='h-[600px] w-full rounded-lg' />
                </main>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className='bg-background min-h-screen'>
                <div className='container mx-auto px-4 py-16'>
                    <Alert variant='destructive' className='mx-auto max-w-2xl'>
                        <AlertCircle className='h-4 w-4' />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className='mt-4 flex justify-center'>
                        <Button onClick={() => router.push('/')}>
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // No resume state
    if (hasActiveResume === false) {
        return (
            <div className='bg-background min-h-screen'>
                <div className='container mx-auto px-4 py-16'>
                    <div className='mx-auto max-w-md space-y-6 text-center'>
                        <div className='bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full p-4'>
                            <FileText className='text-muted-foreground h-10 w-10' />
                        </div>
                        <h2 className='text-2xl font-semibold'>No Resume Available</h2>
                        <p className='text-muted-foreground'>
                            The administrator hasn't uploaded a resume yet. Please check back later or contact the site
                            owner.
                        </p>
                        <div className='flex flex-col justify-center gap-4 sm:flex-row'>
                            <Button onClick={() => router.push('/')}>
                                <ArrowLeft className='mr-2 h-4 w-4' />
                                Back to Home
                            </Button>
                            <Button variant='outline' onClick={() => router.push('/admin/login')}>
                                <Settings className='mr-2 h-4 w-4' />
                                Admin Login
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-background flex min-h-screen flex-col'>
            {/* Header */}
            <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
                <div className='container flex h-14 items-center'>
                    {/* Logo/Brand */}
                    <Link href='/' className='flex items-center space-x-2'>
                        <Sparkles className='text-primary h-6 w-6' />
                        <span className='hidden text-lg font-bold sm:inline'>Chat My CV</span>
                        <span className='text-lg font-bold sm:hidden'>CV Chat</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className='ml-auto hidden items-center space-x-4 md:flex'>
                        <Button variant='ghost' size='sm' onClick={() => router.push('/')}>
                            Home
                        </Button>
                        <Button variant='ghost' size='sm' onClick={() => router.push('/admin/login')}>
                            Admin
                        </Button>
                        {mounted && (
                            <Button variant='ghost' size='icon' onClick={handleThemeToggle} aria-label='Toggle theme'>
                                {theme === 'dark' ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5' />}
                            </Button>
                        )}
                    </nav>

                    {/* Mobile Navigation Toggle */}
                    <div className='ml-auto flex items-center space-x-2 md:hidden'>
                        {mounted && (
                            <Button variant='ghost' size='icon' onClick={handleThemeToggle} aria-label='Toggle theme'>
                                {theme === 'dark' ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5' />}
                            </Button>
                        )}
                        <Button variant='ghost' size='icon' onClick={toggleMobileMenu} aria-label='Toggle menu'>
                            {isMobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className='border-t md:hidden'>
                        <nav className='container space-y-2 py-4'>
                            <Button
                                variant='ghost'
                                className='w-full justify-start'
                                onClick={() => {
                                    router.push('/');
                                    setIsMobileMenuOpen(false);
                                }}>
                                Home
                            </Button>
                            <Button
                                variant='ghost'
                                className='w-full justify-start'
                                onClick={() => {
                                    router.push('/admin/login');
                                    setIsMobileMenuOpen(false);
                                }}>
                                Admin Login
                            </Button>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className='container mx-auto flex-1 px-4 py-4 md:py-8'>
                {/* Chat Interface Container */}
                <div className='mx-auto max-w-4xl'>
                    <ChatInterface
                        className='h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]'
                        welcomeMessage='Welcome! Ask me anything about my professional background, skills, or experience.'
                        placeholder='Type your question about the resume...'
                        showSuggestedQuestions={true}
                        maxHeight='calc(100vh - 12rem)'
                        onMessageSent={(message) => {
                            console.log('Message sent:', message);
                        }}
                        onMessageReceived={(message) => {
                            console.log('Message received:', message);
                        }}
                    />
                </div>
            </main>

            {/* Footer (minimal on mobile) */}
            <footer className='text-muted-foreground border-t py-4 text-center text-sm'>
                <div className='container'>
                    <p className='hidden sm:block'>© {new Date().getFullYear()} Chat My CV. Powered by AI.</p>
                    <p className='sm:hidden'>© {new Date().getFullYear()} Chat My CV</p>
                </div>
            </footer>
        </div>
    );
}
