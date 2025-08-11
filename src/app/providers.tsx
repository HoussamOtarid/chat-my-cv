'use client';

import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/registry/new-york-v4/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider attribute='class'>
                {children}
                <Toaster />
            </ThemeProvider>
        </SessionProvider>
    );
}
