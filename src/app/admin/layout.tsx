import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard',
    description: 'Admin dashboard for Chat My CV. Manage resume content and AI configuration.',
    robots: {
        index: false,
        follow: false
    }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return children;
}
