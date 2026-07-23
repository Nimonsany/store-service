import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { StoreStatus } from '@prisma/client';

export enum StoreSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  CITY = 'city',
}

export enum StoreSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class StoreQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(StoreStatus)
  status?: StoreStatus;

  @IsOptional()
  @IsEnum(StoreSortBy)
  sortBy: StoreSortBy =
    StoreSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(StoreSortOrder)
  sortOrder: StoreSortOrder =
    StoreSortOrder.DESC;
}