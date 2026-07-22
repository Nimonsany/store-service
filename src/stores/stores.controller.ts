import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
  ) {}

  @Post()
  create(
    @Headers('x-user-id') ownerUserId: string | undefined,
    @Body() dto: CreateStoreDto,
  ) {
    if (!ownerUserId) {
      throw new UnauthorizedException('User identity is missing');
    }

    return this.storesService.create(ownerUserId, dto);
  }

  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string | undefined,
    @Headers('x-user-role') role: string | undefined,
    @Body() dto: UpdateStoreDto,
  ) {
    if (!userId || !role) {
      throw new UnauthorizedException('User identity is missing');
    }

    return this.storesService.update(id, userId, role, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string | undefined,
    @Headers('x-user-role') role: string | undefined,
  ) {
    if (!userId || !role) {
      throw new UnauthorizedException('User identity is missing');
    }

    return this.storesService.remove(id, userId, role);
  }
}