export function StructuredData() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Chat My CV',
        description: 'AI-powered resume conversations for exploring professional backgrounds',
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://chatmycv.houss.am',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        creator: {
            '@type': 'Person',
            name: 'Houssam',
            url: 'https://houss.am'
        },
        featureList: [
            'AI-powered chat interface',
            'Resume text extraction',
            'Natural language processing',
            'Multiple LLM provider support',
            'Real-time streaming responses',
            'Dark mode support',
            'Mobile responsive design'
        ],
        softwareVersion: '1.0.0',
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString()
    };

    return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}
