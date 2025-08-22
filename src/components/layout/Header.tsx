'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';
import { Button } from '@/registry/new-york-v4/ui/button';

import { Github, Menu, MessagesSquare, X } from 'lucide-react';

interface HeaderProps {
    className?: string;
    showBranding?: boolean;
    showNavigation?: boolean;
    showThemeToggle?: boolean;
    onMobileMenuToggle?: () => void;
    isMobileMenuOpen?: boolean;
}

interface NavLink {
    href: string;
    label: string;
    external?: boolean;
}

const navLinks: NavLink[] = [
    { href: '/', label: 'Home' },
    { href: '/chat', label: 'Chat' },
    { href: '/admin/login', label: 'Admin' }
];

/**
 * Header component with responsive navigation and branding
 */
export function Header({
    className,
    showBranding = true,
    showNavigation = true,
    showThemeToggle = true,
    onMobileMenuToggle,
    isMobileMenuOpen = false
}: HeaderProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === href;
        }

        return pathname.startsWith(href);
    };

    return (
        <header
            className={cn(
                'bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur',
                className
            )}>
            <div className='container mx-auto flex h-14 items-center px-4 md:px-6'>
                {/* Logo/Branding */}
                {showBranding && (
                    <Link href='/' className='hover:text-primary flex items-center space-x-2 transition-colors'>
                        <MessagesSquare className='text-primary h-6 w-6' />
                        <span className='hidden text-lg font-bold font-heading sm:inline'>Chat My CV</span>
                    </Link>
                )}

                {/* Desktop Navigation */}
                {showNavigation && (
                    <nav className='ml-6 hidden items-center space-x-1 md:flex'>
                        {navLinks.map((link) => (
                            <Button
                                key={link.href}
                                variant={isActive(link.href) ? 'secondary' : 'ghost'}
                                size='sm'
                                asChild
                                className='h-9'>
                                <Link href={link.href} target={link.external ? '_blank' : undefined}>
                                    {link.label}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                )}

                {/* Right Side Actions */}
                <div className='ml-auto flex items-center space-x-2'>
                    {/* GitHub Link */}
                    <Button
                        variant='ghost'
                        size='icon'
                        asChild
                        className='hover:text-primary'
                        aria-label='View source on GitHub'>
                        <Link 
                            href='https://github.com/HoussamOtarid/chat-my-cv' 
                            target='_blank' 
                            rel='noopener noreferrer'>
                            <Github className='h-5 w-5' />
                        </Link>
                    </Button>

                    {/* Theme Toggle */}
                    {showThemeToggle && <ModeToggle />}

                    {/* Mobile Menu Toggle */}
                    {showNavigation && (
                        <Button
                            variant='ghost'
                            size='icon'
                            className='md:hidden'
                            onClick={onMobileMenuToggle}
                            aria-label='Toggle menu'
                            aria-expanded={isMobileMenuOpen}>
                            {isMobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
