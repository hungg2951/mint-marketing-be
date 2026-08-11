import { Injectable } from '@nestjs/common';

@Injectable()
export class ShopifyAuthService {
  /**
   * Resolve and sanitize the store domain from environment variables.
   */
  getStoreDomain(): string {
    const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || '';
    return rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  /**
   * Resolve the Shopify API version from environment variables.
   */
  getApiVersion(): string {
    return process.env.SHOPIFY_API_VERSION || '2024-01';
  }

  /**
   * Build the GraphQL Admin API URL.
   */
  getGraphqlUrl(): string {
    const storeDomain = this.getStoreDomain();
    const apiVersion = this.getApiVersion();
    return `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;
  }

  /**
   * Request access token using Shopify Client Credentials Grant flow
   * POST https://{SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token
   */
  async getAccessToken(): Promise<string> {
    const storeDomain = this.getStoreDomain();
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!storeDomain || !clientId || !clientSecret) {
      const missing = [
        !storeDomain && 'SHOPIFY_STORE_DOMAIN',
        !clientId && 'SHOPIFY_CLIENT_ID',
        !clientSecret && 'SHOPIFY_CLIENT_SECRET',
      ]
        .filter(Boolean)
        .join(', ');
      const msg = `Missing required Shopify environment variable(s): ${missing}`;
      console.error(`[ShopifyAuthService] ${msg}`);
      throw new Error(msg);
    }

    const tokenUrl = `https://${storeDomain}/admin/oauth/access_token`;

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[ShopifyAuthService] Failed to obtain access token (HTTP ${response.status}): ${errorText}`,
        );
        throw new Error(
          `Shopify authentication failed with HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const data = (await response.json()) as { access_token?: string };
      if (!data.access_token) {
        console.error('[ShopifyAuthService] Access token response missing access_token field:', data);
        throw new Error('Access token missing from Shopify OAuth response');
      }

      return data.access_token;
    } catch (error: any) {
      console.error(`[ShopifyAuthService] getAccessToken error: ${error.message}`);
      throw error;
    }
  }
}
