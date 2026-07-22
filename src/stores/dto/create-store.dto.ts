import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateStoreDto {
  @IsUUID()
  ownerUserId: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  addressLine: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  deliveryRadiusKm?: number;
}