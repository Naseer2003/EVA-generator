import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  tenantName?: string;  // Creates a new tenant if provided
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
