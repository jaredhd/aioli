/**
 * @aioli/sdk — JavaScript SDK for the Aioli Design System
 *
 * Two modes:
 *   HTTP (default) — wraps the REST API, works in browser + Node.js
 *   Direct — wraps createAgentSystem() locally, Node.js only, no server needed
 *
 * Usage (HTTP):
 *   import { createAioli } from '@aioli/sdk';
 *   const aioli = await createAioli({ baseUrl: 'http://localhost:3456' });
 *   const result = await aioli.generateComponent('glassmorphic card with title');
 *
 * Usage (Direct):
 *   import { createAioli } from '@aioli/sdk';
 *   const aioli = await createAioli({ mode: 'direct', tokensPath: './tokens' });
 *   const result = await aioli.generateComponent('primary button');
 */

import { createHttpClient } from './http-client.js';

/**
 * Create an Aioli SDK client.
 *
 * @param {Object} options
 * @param {'http'|'direct'} [options.mode='http'] - Client mode
 * @param {string} [options.baseUrl='http://localhost:3456'] - REST API base URL (HTTP mode)
 * @param {string} [options.tokensPath] - Path to tokens directory (direct mode)
 * @returns {Promise<AioliClient>}
 */
export async function createAioli(options = {}) {
  const mode = options.mode || 'http';

  if (mode === 'direct') {
    const { createDirectClient } = await import('./direct-client.js');
    return createDirectClient(options);
  }

  if (mode === 'http') {
    return createHttpClient(options);
  }

  throw new Error(`Unknown mode: "${mode}". Use "http" or "direct".`);
}

// Re-export backends for direct usage
export { createHttpClient } from './http-client.js';

export default createAioli;
