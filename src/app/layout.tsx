import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import localFont from 'next/font/local';

import '@/app/globals.css';
import { Providers } from '@/app/providers';
import ErrorBoundary from '@/components/error-boundary';
import { StructuredData } from '@/components/seo/structured-data';
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
    title: {
        default: 'Chat My CV - AI-Powered Resume Conversations',
        template: '%s | Chat My CV'
    },
    description:
        'Intelligent conversational interface for exploring professional backgrounds. Ask questions about experience, skills, and achievements through natural AI-powered chat.',
    keywords: ['resume', 'CV', 'AI chat', 'professional profile', 'career', 'OpenAI', 'Anthropic', 'chat interface'],
    authors: [{ name: 'Chat My CV' }],
    creator: 'Chat My CV',
    publisher: 'Chat My CV',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1
        }
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://chatmycv.com',
        siteName: 'Chat My CV',
        title: 'Chat My CV - AI-Powered Resume Conversations',
        description:
            'Explore professional backgrounds through intelligent AI conversations. Ask questions and get instant insights about experience, skills, and achievements.'
    },
    twitter: {
        card: 'summary',
        title: 'Chat My CV - AI-Powered Resume Conversations',
        description: 'Explore professional backgrounds through intelligent AI conversations.',
        creator: '@chatmycv'
    },
    icons: {
        icon: '/favicon.ico'
    },
    manifest: '/site.webmanifest',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Chat My CV'
    },
    formatDetection: {
        telephone: false,
        date: false,
        address: false,
        email: false,
        url: false
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://chatmycv.com'),
    alternates: {
        canonical: '/'
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
        yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION
    }
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#000000' }
    ]
};

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        <html suppressHydrationWarning lang='en'>
            <head>
                <StructuredData />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground overscroll-none antialiased`}>
                <Providers>
                    <ErrorBoundary level='page' showDetails={process.env.NODE_ENV === 'development'}>
                        {children}
                    </ErrorBoundary>
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
};

export default Layout;
