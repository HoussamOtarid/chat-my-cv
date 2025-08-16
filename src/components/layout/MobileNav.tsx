'use client';

import React, { useEffect } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/registry/new-york-v4/ui/sheet';

import { Home, MessageSquare, Settings, Sparkles } from 'lucide-react';

interface MobileNavProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    className?: string;
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
}

const navItems: NavItem[] = [
    {
        href: '/',
        label: 'Home',
        icon: <Home className='h-5 w-5' />,
        description: 'Welcome page'
    },
    {
        href: '/chat',
        label: 'Chat with Resume',
        icon: <MessageSquare className='h-5 w-5' />,
        description: 'AI-powered chat interface'
    },
    {
        href: '/admin/login',
        label: 'Admin Panel',
        icon: <Settings className='h-5 w-5' />,
        description: 'Admin login and settings'
    }
];

/**
 * Mobile navigation drawer component
 */
export function MobileNav({ open, onOpenChange, className }: MobileNavProps) {
    const pathname = usePathname();

    // Close mobile nav when route changes
    useEffect(() => {
        onOpenChange(false);
    }, [pathname, onOpenChange]);

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === href;
        }

        return pathname.startsWith(href);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side='left' className={cn('w-[300px] sm:w-[400px]', className)}>
                <SheetHeader>
                    <SheetTitle className='flex items-center space-x-2'>
                        <Sparkles className='h-6 w-6 text-primary' />
                        <span>Chat My CV</span>
                    </SheetTitle>
                </SheetHeader>

                <nav className='mt-8 space-y-2'>
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className='block'>
                            <Button
                                variant={isActive(item.href) ? 'secondary' : 'ghost'}
                                className='w-full justify-start'
                                size='lg'>
                                <span className='mr-3'>{item.icon}</span>
                                <div className='flex flex-col items-start'>
                                    <span className='font-medium'>{item.label}</span>
                                    {item.description && (
                                        <span className='text-xs text-muted-foreground'>{item.description}</span>
                                    )}
                                </div>
                            </Button>
                        </Link>
                    ))}
                </nav>

                <div className='absolute bottom-8 left-0 right-0 px-6'>
                    <div className='rounded-lg bg-muted p-4'>
                        <p className='text-sm text-muted-foreground'>
                            <strong>Tip:</strong> You can ask the AI anything about the resume, including experience,
                            skills, and qualifications.
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}