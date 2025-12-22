import axios, { AxiosInstance } from "axios";
import { Agent } from "https";

/**
 * HTTP Client with Connection Keep-Alive
 *
 * Singleton axios instance with connection pooling for better performance
 * in Azure Functions environment
 */

// Singleton agent for connection reuse
const httpsAgent = new Agent({
  keepAlive: true,
  keepAliveMsecs: 30000, // 30 seconds
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 120000, // 2 minutes
});

/**
 * Shared axios instance with keep-alive enabled
 */
export const axiosInstance: AxiosInstance = axios.create({
  httpsAgent,
  timeout: 120000, // 2 minutes
  headers: {
    "User-Agent": "HALO-Layer/1.0",
  },
});

/**
 * Create a new axios instance with custom configuration
 */
export function createHttpClient(config?: {
  timeout?: number;
  keepAlive?: boolean;
}): AxiosInstance {
  const agent =
    config?.keepAlive !== false
      ? new Agent({
          keepAlive: true,
          keepAliveMsecs: 30000,
          maxSockets: 50,
          maxFreeSockets: 10,
          timeout: config?.timeout || 120000,
        })
      : undefined;

  return axios.create({
    httpsAgent: agent,
    timeout: config?.timeout || 120000,
    headers: {
      "User-Agent": "HALO-Layer/1.0",
    },
  });
}

