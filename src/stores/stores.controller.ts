import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
  ) {}

  @Post()
create(
  @Headers('x-user-id')
  ownerUserId: string | undefined,

  @Body()
  dto: CreateStoreDto,
) {
  if (!ownerUserId) {
    throw new UnauthorizedException(
      'User identity is missing',
    );
  }

  return this.storesService.create(
    ownerUserId,
    dto,
  );
}

  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }
}