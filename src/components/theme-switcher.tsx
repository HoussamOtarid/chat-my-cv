'use client';

import * as React from 'react';

import { useTheme } from 'next-themes';

import { Button } from '@/registry/new-york-v4/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/registry/new-york-v4/ui/dropdown-menu';

import { Check, Laptop, Moon, Sun } from 'lucide-react';

export function ThemeSwitcher() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Prevent hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant='outline' size='icon' disabled>
                <Sun className='h-4 w-4' />
                <span className='sr-only'>Toggle theme</span>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon'>
                    <Sun className='h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
                    <Moon className='absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
                    <span className='sr-only'>Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className='mr-2 h-4 w-4' />
                    <span>Light</span>
                    {theme === 'light' && <Check className='ml-auto h-4 w-4' />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className='mr-2 h-4 w-4' />
                    <span>Dark</span>
                    {theme === 'dark' && <Check className='ml-auto h-4 w-4' />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Laptop className='mr-2 h-4 w-4' />
                    <span>System</span>
                    {theme === 'system' && <Check className='ml-auto h-4 w-4' />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}