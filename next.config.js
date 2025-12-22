const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Enable ES modules
    experimental: {
        serverActions: {
            bodySizeLimit: '1mb',
        },
    },
    webpack: (config, { isServer }) => {
        // Exclude ssh2 and native modules from client bundle
        if (!isServer) {
            // Use IgnorePlugin to completely ignore ssh2 and .node files for client builds
            config.plugins.push(
                new webpack.IgnorePlugin({
                    resourceRegExp: /^ssh2$/,
                }),
                new webpack.IgnorePlugin({
                    resourceRegExp: /\.node$/,
                })
            );

            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                stream: false,
                util: false,
                buffer: false,
                events: false,
                os: false,
                path: false,
                child_process: false,
            };

            // Exclude ssh2 from client bundle
            config.externals = config.externals || [];
            config.externals.push({
                'ssh2': 'commonjs ssh2',
            });
        } else {
            // For server builds, handle .node files properly
            config.module = config.module || {};
            config.module.rules = config.module.rules || [];
            config.module.rules.push({
                test: /\.node$/,
                use: 'node-loader',
            });
        }

        return config;
    },
}

module.exports = nextConfig

