const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/api\.tzkt\.io\/.*/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "tzkt-api-cache",
                expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 5 * 60, // 5 minutes for API calls
                },
                networkTimeoutSeconds: 10,
            },
        },
        {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
                cacheName: "images-cache",
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours for images
                },
            },
        },
        {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
                cacheName: "google-fonts-cache",
                expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year for fonts
                },
            },
        },
        {
            urlPattern: /\/_next\/static\/.*/i,
            handler: "CacheFirst",
            options: {
                cacheName: "static-cache",
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year for static assets
                },
            },
        },
        {
            urlPattern: /\/.*/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "pages-cache",
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours for pages
                },
                networkTimeoutSeconds: 3,
            },
        },
    ],
    fallbacks: {
        document: "/_offline",
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ["lucide-react"],
    },
    outputFileTracingRoot: __dirname,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "ipfs.fileship.xyz",
                pathname: "/**",
            },
        ],
    },
};

module.exports = withPWA(nextConfig);
