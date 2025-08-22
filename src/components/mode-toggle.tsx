'use client';

import * as React from 'react';

import { useTheme } from 'next-themes';

import { Button } from '@/registry/new-york-v4/ui/button';

import { MoonIcon, SunIcon } from 'lucide-react';

export function ModeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Prevent hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    // Show nothing during hydration to prevent mismatch
    if (!mounted) {
        return (
            <Button variant='ghost' className='h-8 w-8 px-0' disabled>
                <div className='h-4 w-4' />
                <span className='sr-only'>Toggle theme</span>
            </Button>
        );
    }

    // Show the appropriate icon based on current theme
    const isDark = resolvedTheme === 'dark';

    return (
        <Button 
            variant='ghost' 
            className='h-8 w-8 px-0' 
            onClick={toggleTheme}
        >
            {isDark ? (
                <MoonIcon className='h-4 w-4 transition-transform duration-200 hover:scale-110' />
            ) : (
                <SunIcon className='h-4 w-4 transition-transform duration-200 hover:scale-110' />
            )}
            <span className='sr-only'>Toggle theme</span>
        </Button>
    );
}
