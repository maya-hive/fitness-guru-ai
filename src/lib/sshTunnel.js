import 'server-only';
import { Client } from 'ssh2';
import net from 'net';
import fs from 'fs';
import path from 'path';

/**
 * Creates an SSH tunnel to a remote MySQL server
 * @returns {Promise<{tunnel: net.Server, localPort: number, sshClient: Client}>}
 */
export async function createSSHTunnel() {
    return new Promise((resolve, reject) => {
        // Validate required SSH configuration
        if (!process.env.DB_SSH_HOST) {
            return reject(new Error('DB_SSH_HOST is required for SSH tunneling'));
        }
        if (!process.env.DB_SSH_USER) {
            return reject(new Error('DB_SSH_USER is required for SSH tunneling'));
        }

        // Build SSH config
        const sshConfig = {
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
                    sshConfig.privateKey = fs.readFileSync(keyPath);
                    sshConfig.passphrase = process.env.DB_SSH_PASSPHRASE || undefined;
                    hasAuth = true;
                    console.log(`✓ Using SSH private key from file: ${keyPath}`);
                } else {
                    const errorMsg = `SSH private key file not found: ${keyPath}`;
                    console.error(errorMsg);
                    return reject(new Error(errorMsg));
                }
            } catch (error) {
                const errorMsg = `Error reading SSH private key file: ${error.message}`;
                console.error(errorMsg);
                return reject(new Error(errorMsg));
            }
        }

        // Option 2: Private key from environment variable
        if (!hasAuth && process.env.DB_SSH_PRIVATE_KEY) {
            try {
                // Handle both raw key and base64 encoded key
                let keyContent = process.env.DB_SSH_PRIVATE_KEY;

                console.log(keyContent);

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

                sshConfig.privateKey = Buffer.from(keyContent, 'utf-8');
                sshConfig.passphrase = process.env.DB_SSH_PASSPHRASE || undefined;
                hasAuth = true;
                console.log('Using SSH private key from environment variable');
            } catch (error) {
                console.warn(`Error processing SSH private key from env: ${error.message}`);
            }
        }

        // Option 3: Password authentication (fallback)
        if (!hasAuth && process.env.DB_SSH_PASSWORD) {
            sshConfig.password = process.env.DB_SSH_PASSWORD;
            hasAuth = true;
            console.log('Using SSH password authentication');
        }

        // Validate that we have at least one authentication method
        if (!hasAuth) {
            return reject(new Error(
                'SSH authentication failed: No valid authentication method provided. ' +
                'Please provide one of: DB_SSH_PRIVATE_KEY_PATH, DB_SSH_PRIVATE_KEY, or DB_SSH_PASSWORD'
            ));
        }

        // Remove undefined values
        Object.keys(sshConfig).forEach(key => {
            if (sshConfig[key] === undefined) {
                delete sshConfig[key];
            }
        });

        const sshClient = new Client();
        const tunnel = net.createServer((localConnection) => {
            sshClient.forwardOut(
                localConnection.remoteAddress,
                localConnection.remotePort,
                process.env.DB_HOST || 'localhost',
                parseInt(process.env.DB_PORT || '3306'),
                (err, sshConnection) => {
                    if (err) {
                        localConnection.end();
                        console.error('SSH tunnel error:', err);
                        return;
                    }
                    localConnection.pipe(sshConnection).pipe(localConnection);
                }
            );
        });

        sshClient.on('ready', () => {
            console.log('✓ SSH tunnel established');
            tunnel.listen(0, '127.0.0.1', () => {
                const localPort = tunnel.address().port;
                console.log(`✓ SSH tunnel listening on localhost:${localPort}`);
                resolve({ tunnel, localPort, sshClient });
            });
        });

        sshClient.on('error', (err) => {
            console.error('SSH connection error:', err);
            let errorMessage = 'SSH connection failed';

            if (err.level === 'client-authentication') {
                errorMessage = 'SSH authentication failed. Please check your credentials:\n' +
                    '- Verify DB_SSH_USER and DB_SSH_PASSWORD are correct\n' +
                    '- Or verify DB_SSH_PRIVATE_KEY or DB_SSH_PRIVATE_KEY_PATH is correct\n' +
                    '- Check that the SSH server allows your authentication method\n' +
                    '- Ensure the private key format is correct (OpenSSH or RSA)';
            } else if (err.code === 'ECONNREFUSED') {
                errorMessage = `Cannot connect to SSH server ${sshConfig.host}:${sshConfig.port}. Check DB_SSH_HOST and DB_SSH_PORT`;
            } else if (err.code === 'ENOTFOUND') {
                errorMessage = `SSH host not found: ${sshConfig.host}. Check DB_SSH_HOST`;
            } else if (err.code === 'ETIMEDOUT') {
                errorMessage = `SSH connection timeout to ${sshConfig.host}:${sshConfig.port}`;
            }

            console.error(errorMessage);
            reject(new Error(errorMessage));
        });

        sshClient.connect(sshConfig);
    });
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
