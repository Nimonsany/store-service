import { IsEnum } from 'class-validator';
import { StoreStatus } from '@prisma/client';

export class UpdateStoreStatusDto {
  @IsEnum(StoreStatus)
  status: StoreStatus;
}