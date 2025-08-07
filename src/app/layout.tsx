import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import localFont from 'next/font/local';

import { ThemeProvider } from 'next-themes';

import '@/app/globals.css';
import { Toaster } from '@/registry/new-york-v4/ui/sonner';

const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900'
});
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900'
});

export const metadata: Metadata = {
    title: 'Chat My CV',
    description: 'Intelligent conversational interface for your professional resume'
};

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        <html suppressHydrationWarning lang='en'>
            <body
                className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground overscroll-none antialiased`}>
                <ThemeProvider attribute='class'>
                    {children}
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
};

export default Layout;
