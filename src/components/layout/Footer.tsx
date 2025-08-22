import React from 'react';

import { cn } from '@/lib/utils';
interface FooterProps {
    className?: string;
    showSocial?: boolean;
    showLinks?: boolean;
    minimal?: boolean;
}

/**
 * Footer component
 */
export function Footer({ className }: FooterProps) {
    const currentYear = new Date().getFullYear();
        
    return (
        <footer className={cn('border-t py-4', className)}>
            <div className='container mx-auto flex justify-center items-center'>
                <p className='text-muted-foreground text-center text-sm'>
                    <span className='hidden sm:inline'>
                        © {currentYear} Chat My CV. All rights reserved.
                    </span>
                    <span className='sm:hidden'>© {currentYear} Chat My CV</span>
                </p>
            </div>
        </footer>
    );
}
