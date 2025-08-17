'use client';

import { ThemeProvider } from 'next-themes';

import { Toaster } from '@/registry/new-york-v4/ui/toaster';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                {children}
                <Toaster />
            </ThemeProvider>
        </SessionProvider>
    );
}
