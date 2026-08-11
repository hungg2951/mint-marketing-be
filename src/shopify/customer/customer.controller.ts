import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('shopify')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('customers')
  async getCustomers() {
    try {
      const result = await this.customerService.getCustomers();
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to fetch customers from Shopify',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('customers/search')
  async searchCustomerByEmail(@Query('email') email: string) {
    try {
      if (!email) {
        throw new HttpException(
          {
            success: false,
            error: 'Query parameter "email" is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const customer = await this.customerService.getCustomerByEmail(email);

      if (!customer) {
        return {
          success: true,
          data: null,
          message: `No customer found with email: ${email}`,
        };
      }

      return {
        success: true,
        data: customer,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to search customer from Shopify',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
