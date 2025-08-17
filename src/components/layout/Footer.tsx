import React from 'react';

import Link from 'next/link';

import { cn } from '@/lib/utils';

import { Github, Linkedin, Mail, Twitter } from 'lucide-react';

interface FooterProps {
    className?: string;
    showSocial?: boolean;
    showLinks?: boolean;
    minimal?: boolean;
}

interface FooterLink {
    href: string;
    label: string;
    external?: boolean;
}

interface SocialLink {
    href: string;
    label: string;
    icon: React.ReactNode;
}

const footerLinks: FooterLink[] = [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: 'https://github.com', label: 'GitHub', external: true }
];

const socialLinks: SocialLink[] = [
    { href: 'https://github.com', label: 'GitHub', icon: <Github className='h-4 w-4' /> },
    { href: 'https://linkedin.com', label: 'LinkedIn', icon: <Linkedin className='h-4 w-4' /> },
    { href: 'https://twitter.com', label: 'Twitter', icon: <Twitter className='h-4 w-4' /> },
    { href: 'mailto:contact@example.com', label: 'Email', icon: <Mail className='h-4 w-4' /> }
];

/**
 * Footer component with links and social media
 */
export function Footer({ className, showSocial = false, showLinks = false, minimal = true }: FooterProps) {
    const currentYear = new Date().getFullYear();

    if (minimal) {
        return (
            <footer className={cn('border-t py-4 text-center', className)}>
                <div className='container'>
                    <p className='text-muted-foreground text-sm'>
                        <span className='hidden sm:inline'>
                            © {currentYear} Chat My CV. Powered by AI. All rights reserved.
                        </span>
                        <span className='sm:hidden'>© {currentYear} Chat My CV</span>
                    </p>
                </div>
            </footer>
        );
    }

    return (
        <footer className={cn('border-t', className)}>
            <div className='container py-8 md:py-12'>
                <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
                    {/* Brand Section */}
                    <div className='space-y-3'>
                        <h3 className='text-lg font-semibold'>Chat My CV</h3>
                        <p className='text-muted-foreground text-sm'>
                            Intelligent conversational interface for your professional resume. Powered by advanced AI
                            technology.
                        </p>
                    </div>

                    {/* Quick Links */}
                    {showLinks && (
                        <div className='space-y-3'>
                            <h4 className='text-sm font-semibold'>Quick Links</h4>
                            <ul className='space-y-2'>
                                {footerLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            target={link.external ? '_blank' : undefined}
                                            rel={link.external ? 'noopener noreferrer' : undefined}
                                            className='text-muted-foreground hover:text-foreground text-sm transition-colors'>
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Social Links */}
                    {showSocial && (
                        <div className='space-y-3'>
                            <h4 className='text-sm font-semibold'>Connect</h4>
                            <div className='flex space-x-3'>
                                {socialLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='text-muted-foreground hover:text-foreground transition-colors'
                                        aria-label={link.label}>
                                        {link.icon}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Legal Section */}
                    <div className='space-y-3'>
                        <h4 className='text-sm font-semibold'>Legal</h4>
                        <p className='text-muted-foreground text-sm'>
                            This is an AI-powered application. Responses are generated automatically and may not always
                            be accurate.
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className='mt-8 border-t pt-8'>
                    <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
                        <p className='text-muted-foreground text-sm'>
                            © {currentYear} Chat My CV. All rights reserved.
                        </p>
                        <p className='text-muted-foreground text-sm'>
                            Built with Next.js • Powered by AI • Open Source
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
