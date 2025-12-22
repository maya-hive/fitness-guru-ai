import 'server-only';
import { createTunnel } from 'tunnel-ssh';
import fs from 'fs';
import path from 'path';

/**
 * Creates an SSH tunnel to a remote MySQL server using tunnel-ssh
 * @returns {Promise<{tunnel: import('net').Server, localPort: number, sshClient: import('ssh2').Client}>}
 */
export async function createSSHTunnel() {
    // Validate required SSH configuration
    if (!process.env.DB_SSH_HOST) {
        throw new Error('DB_SSH_HOST is required for SSH tunneling');
    }
    if (!process.env.DB_SSH_USER) {
        throw new Error('DB_SSH_USER is required for SSH tunneling');
    }

    // Build SSH config (sshOptions)
    const sshOptions = {
        host: process.env.DB_SSH_HOST,
        port: parseInt(process.env.DB_SSH_PORT || '22'),
        username: process.env.DB_SSH_USER,
        readyTimeout: 20000,
        tryKeyboard: false,
    };

    // Handle authentication - prefer private key over password
    let hasAuth = false;

    // Option 1: Private key from file path
    if (process.env.DB_SSH_PRIVATE_KEY_PATH) {
        try {
            // Handle both absolute and relative paths, including Windows paths
            let keyPath = process.env.DB_SSH_PRIVATE_KEY_PATH;

            // Expand ~ to home directory if present
            if (keyPath.startsWith('~')) {
                const homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;
                if (homeDir) {
                    keyPath = path.join(homeDir, keyPath.slice(1));
                }
            }

            // Resolve the path (handles relative paths and normalizes separators)
            keyPath = path.resolve(keyPath);

            console.log(`Looking for SSH private key at: ${keyPath}`);

            if (fs.existsSync(keyPath)) {
                sshOptions.privateKey = fs.readFileSync(keyPath);
                sshOptions.passphrase = process.env.DB_SSH_PASSPHRASE || undefined;
                hasAuth = true;
                console.log(`✓ Using SSH private key from file: ${keyPath}`);
            } else {
                const errorMsg = `SSH private key file not found: ${keyPath}`;
                console.error(errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error) {
            const errorMsg = `Error reading SSH private key file: ${error.message}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    }

    // Option 2: Private key from environment variable
    if (!hasAuth && process.env.DB_SSH_PRIVATE_KEY) {
        try {
            // Handle both raw key and base64 encoded key
            let keyContent = process.env.DB_SSH_PRIVATE_KEY;

            // Replace escaped newlines if present
            keyContent = keyContent.replace(/\\n/g, '\n');

            // Try to decode base64 if it looks like base64
            if (!keyContent.includes('BEGIN') && !keyContent.includes('PRIVATE')) {
                try {
                    keyContent = Buffer.from(keyContent, 'base64').toString('utf-8');
                } catch {
                    // Not base64, use as-is
                }
            }

            sshOptions.privateKey = Buffer.from(keyContent, 'utf-8');
            sshOptions.passphrase = process.env.DB_SSH_PASSPHRASE || undefined;
            hasAuth = true;
            console.log('Using SSH private key from environment variable');
        } catch (error) {
            console.warn(`Error processing SSH private key from env: ${error.message}`);
        }
    }

    // Validate that we have a valid authentication method (only private key supported now)
    if (!hasAuth) {
        throw new Error(
            'SSH authentication failed: No valid authentication method provided. ' +
            'Please provide DB_SSH_PRIVATE_KEY.'
        );
    }

    // Remove undefined values
    Object.keys(sshOptions).forEach(key => {
        if (sshOptions[key] === undefined) {
            delete sshOptions[key];
        }
    });

    const tunnelOptions = {
        autoClose: false // Keep tunnel open for DB pool
    };

    const serverOptions = {
        port: 0 // Random unused port
    };

    const forwardOptions = {
        dstAddr: process.env.DB_HOST || 'localhost',
        dstPort: parseInt(process.env.DB_PORT || '3306')
    };

    try {
        const [server, client] = await createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions);

        // server is the net.Server listening on localhost
        const localPort = server.address().port;
        console.log(`✓ SSH tunnel established via tunnel-ssh on localhost:${localPort}`);

        // Handle client errors to prevent crash
        client.on('error', (err) => {
            console.error('SSH Client Error:', err);
        });

        server.on('error', (err) => {
            console.error('SSH Tunnel Server Error:', err);
        });

        return {
            tunnel: server,
            localPort,
            sshClient: client
        };

    } catch (err) {
        console.error('SSH connection error:', err);
        let errorMessage = 'SSH connection failed';

        if (err.level === 'client-authentication') {
            errorMessage = 'SSH authentication failed. Please check your credentials:\n' +
                '- Verify DB_SSH_USER is correct\n' +
                '- Verify DB_SSH_PRIVATE_KEY is correct\n' +
                '- Check that the SSH server allows your authentication method\n' +
                '- Ensure the private key format is correct (OpenSSH or RSA)';
        } else if (err.code === 'ECONNREFUSED') {
            errorMessage = `Cannot connect to SSH server ${sshOptions.host}:${sshOptions.port}. Check DB_SSH_HOST and DB_SSH_PORT`;
        } else if (err.code === 'ENOTFOUND') {
            errorMessage = `SSH host not found: ${sshOptions.host}. Check DB_SSH_HOST`;
        } else if (err.code === 'ETIMEDOUT') {
            errorMessage = `SSH connection timeout to ${sshOptions.host}:${sshOptions.port}`;
        }

        console.error(errorMessage);
        throw new Error(errorMessage);
    }
}

/**
 * Closes the SSH tunnel
 */
export function closeSSHTunnel(tunnel, sshClient) {
    return new Promise((resolve) => {
        if (tunnel) {
            tunnel.close(() => {
                console.log('✓ SSH tunnel closed');
                if (sshClient) {
                    sshClient.end();
                }
                resolve();
            });
        } else {
            resolve();
        }
    });
}
