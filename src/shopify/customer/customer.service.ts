import { Injectable } from '@nestjs/common';
import { ShopifyAuthService } from '../shopify-auth.service';

@Injectable()
export class CustomerService {
  constructor(private readonly authService: ShopifyAuthService) {}

  /**
   * Fetch first 10 customers from Shopify Admin GraphQL API
   */
  async getCustomers(): Promise<any> {
    const token = await this.authService.getAccessToken();
    const graphqlUrl = this.authService.getGraphqlUrl();

    const query = `
      query GetCustomers {
        customers(first: 250) {
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
          `[CustomerService] Failed to query GraphQL API (HTTP ${response.status}): ${errorText}`,
        );
        throw new Error(
          `Shopify GraphQL API request failed with HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.errors) {
        console.error(
          '[CustomerService] GraphQL errors returned:',
          JSON.stringify(result.errors, null, 2),
        );
        throw new Error(
          `Shopify GraphQL query errors: ${JSON.stringify(result.errors)}`,
        );
      }

      const edges = result?.data?.customers?.edges || [];

      return { customers: edges.map((edge: any) => edge.node) };
    } catch (error: any) {
      console.error(`[CustomerService] getCustomers error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for a customer by email address via Shopify Admin GraphQL API
   */
  async getCustomerByEmail(email: string): Promise<any> {
    const token = await this.authService.getAccessToken();
    const graphqlUrl = this.authService.getGraphqlUrl();

    const query = `
      query GetCustomerByEmail($searchQuery: String!) {
        customers(first: 1, query: $searchQuery) {
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

    const variables = {
      searchQuery: `email:${email}`,
    };

    try {
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[CustomerService] Failed to query GraphQL API (HTTP ${response.status}): ${errorText}`,
        );
        throw new Error(
          `Shopify GraphQL API request failed with HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.errors) {
        console.error(
          '[CustomerService] GraphQL errors returned:',
          JSON.stringify(result.errors, null, 2),
        );
        throw new Error(
          `Shopify GraphQL query errors: ${JSON.stringify(result.errors)}`,
        );
      }

      const edges = result?.data?.customers?.edges || [];
      if (edges.length === 0) {
        return null;
      }

      return edges[0].node;
    } catch (error: any) {
      console.error(
        `[CustomerService] getCustomerByEmail error: ${error.message}`,
      );
      throw error;
    }
  }
}
