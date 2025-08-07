import { redirect } from 'next/navigation';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { authOptions } from '@/lib/auth';

import { getServerSession } from 'next-auth/next';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
        redirect('/admin/login');
    }

    return (
        <div className='flex h-screen'>
            <AdminSidebar />
            <main className='bg-background flex-1 overflow-y-auto'>
                <div className='container mx-auto px-6 py-8'>{children}</div>
            </main>
        </div>
    );
}
