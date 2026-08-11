import { IsArray, IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RecipientDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class SendBulkTemplateEmailDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];
}