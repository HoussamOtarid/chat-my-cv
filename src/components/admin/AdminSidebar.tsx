'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

import { SignOutButton } from './SignOutButton';
import { FileText, LayoutDashboard, MessageSquare, Settings } from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Sessions', href: '/admin/sessions', icon: MessageSquare },
    { name: 'Resume', href: '/admin/resume', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings }
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className='bg-background flex h-full w-64 flex-col border-r'>
            <div className='flex h-16 items-center border-b px-6'>
                <h2 className='text-xl font-semibold'>Admin Panel</h2>
            </div>

            <nav className='flex-1 space-y-1 px-3 py-4'>
                {navigation.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-secondary text-foreground'
                                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                            )}>
                            <item.icon
                                className={cn(
                                    'mr-3 h-5 w-5 flex-shrink-0',
                                    isActive ? 'text-foreground' : 'text-muted-foreground'
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className='border-t p-3'>
                <SignOutButton />
            </div>
        </div>
    );
}
