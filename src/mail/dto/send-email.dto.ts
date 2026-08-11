import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class SendEmailDto {
  @IsNotEmpty()
  to: string | string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsString()
  text?: string;
}