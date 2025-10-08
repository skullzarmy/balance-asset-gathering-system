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

module.exports = nextConfig;
