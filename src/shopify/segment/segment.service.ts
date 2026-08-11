import { Injectable } from '@nestjs/common';
import { ShopifyAuthService } from '../shopify-auth.service';

@Injectable()
export class SegmentService {
  constructor(private readonly authService: ShopifyAuthService) {}

  /**
   * Fetch customer segments from Shopify Admin GraphQL API
   */
  async getSegments(): Promise<any[]> {
    const token = await this.authService.getAccessToken();
    const graphqlUrl = this.authService.getGraphqlUrl();

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
          `[SegmentService] Failed to query segments (HTTP ${response.status}): ${errorText}`,
        );
        throw new Error(
          `Shopify GraphQL API request failed with HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.errors) {
        console.error(
          '[SegmentService] GraphQL errors returned for segments:',
          JSON.stringify(result.errors, null, 2),
        );
        throw new Error(`Shopify GraphQL query errors: ${JSON.stringify(result.errors)}`);
      }

      const edges = result?.data?.segments?.edges || [];
      return edges.map((edge: any) => edge.node);
    } catch (error: any) {
      console.error(`[SegmentService] getSegments error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch all customer members of a given segment ID with cursor-based pagination
   */
  async getSegmentMembers(segmentId: string): Promise<any[]> {
    const token = await this.authService.getAccessToken();
    const graphqlUrl = this.authService.getGraphqlUrl();

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
          console.warn('[SegmentService] Rate limited (HTTP 429), retrying in 2 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[SegmentService] Failed to query customerSegmentMembers (HTTP ${response.status}): ${errorText}`,
          );
          throw new Error(
            `Shopify GraphQL API request failed with HTTP ${response.status}: ${errorText || response.statusText}`,
          );
        }

        const result = await response.json();

        if (result.errors) {
          console.error(
            '[SegmentService] GraphQL errors returned for customerSegmentMembers:',
            JSON.stringify(result.errors, null, 2),
          );
          throw new Error(`Shopify GraphQL query errors: ${JSON.stringify(result.errors)}`);
        }

        const connection = result?.data?.customerSegmentMembers;
        if (!connection) {
          console.error('[SegmentService] customerSegmentMembers response missing data:', result);
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
      console.error(`[SegmentService] getSegmentMembers error: ${error.message}`);
      throw error;
    }
  }
}
