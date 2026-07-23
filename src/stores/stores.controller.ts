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
import { UpdateStoreStatusDto } from './dto/update-store-status.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

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

  @Get('active/ids')
  findActiveStoreIds() {
    return this.storesService.findActiveStoreIds();
  }

  @Get(':id/public-access')
  verifyPublicAccess(@Param('id') id: string) {
    return this.storesService.verifyPublicAccess(id);
  }


  @Get(':id/manage-access')
  verifyManageAccess(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string | undefined,
    @Headers('x-user-role') role: string | undefined,
  ) {
    if (!userId || !role) {
      throw new UnauthorizedException('User identity is missing');
    }

    return this.storesService.verifyManageAccess(id, userId, role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id')
    id: string,

    @Headers('x-user-role')
    role: string | undefined,

    @Body()
    dto: UpdateStoreStatusDto,
  ) {
    if (!role) {
      throw new UnauthorizedException('User role is missing');
    }

    return this.storesService.updateStatus(id, role, dto);
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
