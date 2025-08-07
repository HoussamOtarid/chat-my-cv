'use client';

import { Button } from '@/registry/new-york-v4/ui/button';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
    return (
        <form
            action={async () => {
                await signOut({ callbackUrl: '/admin/login' });
            }}>
            <Button type='submit' variant='ghost' className='w-full justify-start'>
                <LogOut className='mr-2 h-4 w-4' />
                Sign Out
            </Button>
        </form>
    );
}
