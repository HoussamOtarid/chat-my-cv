'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';

import { Footer } from './Footer';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

interface AppLayoutProps {
    children: React.ReactNode;
    className?: string;
    showHeader?: boolean;
    showFooter?: boolean;
    showNavigation?: boolean;
    showThemeToggle?: boolean;
}

/**
 * Main application layout wrapper component
 * Combines Header, Footer, and MobileNav for consistent layout
 */
export function AppLayout({
    children,
    className,
    showHeader = true,
    showFooter = true,
    showNavigation = true,
    showThemeToggle = true,
}: AppLayoutProps) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const handleMobileMenuToggle = () => {
        setMobileNavOpen(!mobileNavOpen);
    };

    return (
        <div className={cn('bg-background flex h-screen flex-col overflow-hidden', className)}>
            {/* Header */}
            {showHeader && (
                <Header
                    showNavigation={showNavigation}
                    showThemeToggle={showThemeToggle}
                    onMobileMenuToggle={handleMobileMenuToggle}
                    isMobileMenuOpen={mobileNavOpen}
                />
            )}

            {/* Mobile Navigation Drawer */}
            {showNavigation && <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />}

            {/* Main Content */}
            <main className='flex flex-1 flex-col overflow-auto'>{children}</main>

            {/* Footer */}
            {showFooter && <Footer />}
        </div>
    );
}
