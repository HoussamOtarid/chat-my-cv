import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Chat Interface',
    description:
        'Ask questions about professional experience, skills, education, and achievements. Get instant AI-powered insights from the resume.',
    openGraph: {
        title: 'Chat with Resume - Chat My CV',
        description:
            'Engage in intelligent conversations about professional background. Ask anything and get detailed insights.',
        type: 'website'
    }
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return children;
}
