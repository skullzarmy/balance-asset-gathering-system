/**
 * Site Configuration
 *
 * Central configuration for site-wide settings including branding,
 * metadata, and external service URLs.
 */

export const siteConfig = {
    name: "B.A.G.S.",
    subtitle: "Balance & Asset Gathering System",
    description: "Portfolio tracker for Tezos and Etherlink wallets",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

    // Copyright information
    copyright: {
        startYear: 2025,
        owner: "B.A.G.S.",
    },

    // Social/External links
    links: {
        github: "https://github.com/yourusername/bags",
    },

    // Data providers
    dataProviders: [
        {
            name: "TzKT",
            url: "https://tzkt.io",
            description: "Tezos blockchain explorer",
        },
        {
            name: "Etherlink Explorer",
            url: "https://explorer.etherlink.com",
            description: "Etherlink blockchain explorer",
        },
    ],

    // Special acknowledgments
    acknowledgments: [
        {
            name: "Fileship.xyz",
            url: "https://fileship.xyz",
            icon: "/icons/fileship.svg",
            description: "IPFS gateway service",
        },
    ],
} as const;

export type SiteConfig = typeof siteConfig;
