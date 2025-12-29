/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Enable ES modules
    experimental: {
        serverActions: {
            bodySizeLimit: '1mb',
        },
    },
}

module.exports = nextConfig

