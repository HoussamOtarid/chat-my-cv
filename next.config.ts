import type { NextConfig } from 'next';

import initializeBundleAnalyzer from '@next/bundle-analyzer';

// https://www.npmjs.com/package/@next/bundle-analyzer
const withBundleAnalyzer = initializeBundleAnalyzer({
    enabled: process.env.BUNDLE_ANALYZER_ENABLED === 'true'
});

// https://nextjs.org/docs/pages/api-reference/next-config-js
const nextConfig: NextConfig = {
    output: 'standalone',
    outputFileTracingIncludes: {
        "/*": ["./registry/**/*"],
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
        ],
    },
    // Performance optimizations
    experimental: {
        optimizeCss: true,
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
        ],
    },
    // Optimize production builds
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },
    // Enable SWC minification
    swcMinify: true,
    // Optimize for production
    productionBrowserSourceMaps: false,
    poweredByHeader: false,
};

export default withBundleAnalyzer(nextConfig);
