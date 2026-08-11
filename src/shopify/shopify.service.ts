import { Injectable } from '@nestjs/common';

@Injectable()
export class ShopifyService {
  /**
   * Request access token using Shopify Client Credentials Grant flow
   * POST https://{SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token
   */
  async getAccessToken(): Promise<string> {
    const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || '';
    const storeDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
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
      console.error(`[ShopifyService] ${msg}`);
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
          `[ShopifyService] Failed to obtain access token (HTTP ${response.status}): ${errorText}`,
        );
        throw new Error(
          `Shopify authentication failed with HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const data = (await response.json()) as { access_token?: string };
      if (!data.access_token) {
        console.error('[ShopifyService] Access token response missing access_token field:', data);
        throw new Error('Access token missing from Shopify OAuth response');
      }

      return data.access_token;
    } catch (error: any) {
      console.error(`[ShopifyService] getAccessToken error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch first 10 customers from Shopify Admin GraphQL API
   */
  async getCustomers(): Promise<any> {
    const token = await this.getAccessToken();
    const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || '';
    const storeDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

    const graphqlUrl = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;

    const query = `
      query GetCustomers {
        customers(first: 10) {
          edges {
            node {
              id
              email
              firstName
              lastName
              numberOfOrders
              amountSpent {
                amount
                currencyCode
              }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[ShopifyService] Failed to query GraphQL API (HTTP ${response.status}): ${errorText}`,
        );
        throw new Error(
          `Shopify GraphQL API request failed with HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.errors) {
        console.error('[ShopifyService] GraphQL errors returned:', JSON.stringify(result.errors, null, 2));
        throw new Error(`Shopify GraphQL query errors: ${JSON.stringify(result.errors)}`);
      }

      return result;
    } catch (error: any) {
      console.error(`[ShopifyService] getCustomers error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch customer segments from Shopify Admin GraphQL API
   */
  async getSegments(): Promise<any[]> {
    const token = await this.getAccessToken();
    const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || '';
    const storeDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

    const graphqlUrl = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;

    const query = `
      query GetSegments {
        segments(first: 100) {
          edges {
            node {
              id
              name
              query
              creationDate
              lastEditDate
            }
          }
        }
      }
    `;

    try {
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[ShopifyService] Failed to query segments (HTTP ${response.status}): ${errorText}`,
        );
        throw new Error(
          `Shopify GraphQL API request failed with HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.errors) {
        console.error(
          '[ShopifyService] GraphQL errors returned for segments:',
          JSON.stringify(result.errors, null, 2),
        );
        throw new Error(`Shopify GraphQL query errors: ${JSON.stringify(result.errors)}`);
      }

      const edges = result?.data?.segments?.edges || [];
      return edges.map((edge: any) => edge.node);
    } catch (error: any) {
      console.error(`[ShopifyService] getSegments error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch all customer members of a given segment ID with cursor-based pagination
   */
  async getSegmentMembers(segmentId: string): Promise<any[]> {
    const token = await this.getAccessToken();
    const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || '';
    const storeDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

    const graphqlUrl = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;

    const query = `
      query GetCustomerSegmentMembers($segmentId: ID!, $first: Int!, $after: String) {
        customerSegmentMembers(segmentId: $segmentId, first: $first, after: $after) {
          edges {
            node {
              id
              displayName
              defaultEmailAddress {
                emailAddress
              }
              numberOfOrders
              amountSpent {
                amount
                currencyCode
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    let hasNextPage = true;
    let cursor: string | null = null;
    const allMembers: any[] = [];

    try {
      while (hasNextPage) {
        const variables = {
          segmentId,
          first: 250,
          after: cursor,
        };

        const response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token,
          },
          body: JSON.stringify({ query, variables }),
        });

        if (response.status === 429) {
          console.warn('[ShopifyService] Rate limited (HTTP 429), retrying in 2 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[ShopifyService] Failed to query customerSegmentMembers (HTTP ${response.status}): ${errorText}`,
          );
          throw new Error(
            `Shopify GraphQL API request failed with HTTP ${response.status}: ${errorText || response.statusText}`,
          );
        }

        const result = await response.json();

        if (result.errors) {
          console.error(
            '[ShopifyService] GraphQL errors returned for customerSegmentMembers:',
            JSON.stringify(result.errors, null, 2),
          );
          throw new Error(`Shopify GraphQL query errors: ${JSON.stringify(result.errors)}`);
        }

        const connection = result?.data?.customerSegmentMembers;
        if (!connection) {
          console.error('[ShopifyService] customerSegmentMembers response missing data:', result);
          throw new Error('Invalid response structure for customerSegmentMembers');
        }

        const edges = connection.edges || [];
        for (const edge of edges) {
          if (edge.node) {
            allMembers.push(edge.node);
          }
        }

        const pageInfo = connection.pageInfo || {};
        hasNextPage = Boolean(pageInfo.hasNextPage);
        cursor = pageInfo.endCursor || null;

        // Rate limit check using extensions.cost.throttleStatus
        const throttleStatus = result?.extensions?.cost?.throttleStatus;
        if (throttleStatus) {
          const { currentlyAvailable, restoreRate } = throttleStatus;
          if (currentlyAvailable < 100 && restoreRate > 0) {
            const sleepMs = Math.ceil(((100 - currentlyAvailable) / restoreRate) * 1000);
            if (sleepMs > 0) {
              await new Promise((resolve) => setTimeout(resolve, sleepMs));
            }
          }
        }
      }

      return allMembers;
    } catch (error: any) {
      console.error(`[ShopifyService] getSegmentMembers error: ${error.message}`);
      throw error;
    }
  }
}
