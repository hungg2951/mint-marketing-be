import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SendTemplateEmailDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsNotEmpty()
  to: string | string[];

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @IsOptional()
  @IsString()
  subject?: string;
}