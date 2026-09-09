/**
 * Retell AI SDK Client
 *
 * Provides a singleton Retell client instance for voice call operations.
 * Mirrors the initialization pattern from src/lib/ai/claude.ts.
 */

import Retell from 'retell-sdk';

let retellClient: Retell | null = null;

/**
 * Get or create the Retell SDK client instance
 */
export function getRetellClient(): Retell {
  if (!retellClient) {
    const apiKey = process.env.RETELL_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('RETELL_API_KEY is not configured');
    }
    retellClient = new Retell({ apiKey });
  }
  return retellClient;
}
