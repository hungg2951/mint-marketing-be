import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { SendEmailDto } from './dto/send-email.dto';
import { SendTemplateEmailDto } from './dto/send-template-email.dto';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.RESEND_FROM_EMAIL || '';

    if (!this.apiKey || !this.fromEmail) {
      const missing = [
        !this.apiKey && 'RESEND_API_KEY',
        !this.fromEmail && 'RESEND_FROM_EMAIL',
      ]
        .filter(Boolean)
        .join(', ');
      const msg = `Missing required Resend environment variable(s): ${missing}`;
      console.error(`[MailService] ${msg}`);
      throw new Error(msg);
    }

    this.resend = new Resend(this.apiKey);
  }

  async sendEmail(dto: SendEmailDto): Promise<any> {
    const { to, subject, html, text } = dto;

    if (!html && !text) {
      throw new Error('Either html or text content must be provided');
    }

    try {
      const payload = html
        ? { from: this.fromEmail, to, subject, html }
        : { from: this.fromEmail, to, subject, text: text as string };

      const { data, error } = await this.resend.emails.send(payload);

      if (error) {
        console.error('[MailService] Resend API error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error(`[MailService] sendEmail error: ${error.message}`);
      throw error;
    }
  }

  async listTemplates(): Promise<any> {
    try {
      const response = await fetch('https://api.resend.com/templates', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[MailService] Failed to fetch templates (HTTP ${response.status}): ${errorText}`,
        );
        throw new Error(
          `Failed to fetch templates: HTTP ${response.status}: ${errorText}`,
        );
      }

      return await response.json();
    } catch (error: any) {
      console.error(`[MailService] listTemplates error: ${error.message}`);
      throw error;
    }
  }

  async sendTemplateEmail(dto: SendTemplateEmailDto): Promise<any> {
    const { templateId, to, variables, subject } = dto;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject,
          template: {
            id: templateId,
            variables: variables || {},
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[MailService] Failed to send template email (HTTP ${response.status}): ${errorText}`,
        );
        throw new Error(
          `Failed to send template email: HTTP ${response.status}: ${errorText}`,
        );
      }

      return await response.json();
    } catch (error: any) {
      console.error(`[MailService] sendTemplateEmail error: ${error.message}`);
      throw error;
    }
  }
}
