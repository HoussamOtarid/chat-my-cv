'use client';

import * as React from 'react';

import { useTheme } from 'next-themes';

import { Button } from '@/registry/new-york-v4/ui/button';

import { MoonIcon, SunIcon } from 'lucide-react';

export function ModeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Prevent hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant='ghost' className='h-8 w-8 px-0' disabled>
                <SunIcon className='h-4 w-4' />
                <span className='sr-only'>Toggle theme</span>
            </Button>
        );
    }

    return (
        <Button 
            variant='ghost' 
            className='h-8 w-8 px-0' 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
            <SunIcon className='h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
            <MoonIcon className='absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
            <span className='sr-only'>Toggle theme</span>
        </Button>
    );
}
