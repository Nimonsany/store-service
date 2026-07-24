import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';

import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreStatusDto } from './dto/update-store-status.dto';
import { StoreQueryDto } from './dto/store-query.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create(
    @Headers('x-user-id')
    userId: string | undefined,

    @Headers('x-user-role')
    role: string | undefined,

    @Body()
    dto: CreateStoreDto,
  ) {
    if (!userId || !role) {
      throw new UnauthorizedException('User identity is missing');
    }

    return this.storesService.create(userId, role, dto);
  }

  @Get()
  findAll(@Query() query: StoreQueryDto) {
    return this.storesService.findAll(query);
  }

  @Get('active/ids')
  findActiveStoreIds() {
    return this.storesService.findActiveStoreIds();
  }

  @Get(':id/public-access')
  verifyPublicAccess(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    id: string,
  ) {
    return this.storesService.verifyPublicAccess(id);
  }

  @Get(':id/manage-access')
  verifyManageAccess(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    id: string,
    @Headers('x-user-id') userId: string | undefined,
    @Headers('x-user-role') role: string | undefined,
  ) {
    if (!userId || !role) {
      throw new UnauthorizedException('User identity is missing');
    }

    return this.storesService.verifyManageAccess(id, userId, role);
  }

  @Get('management/all')
  findForManagement(
    @Headers('x-user-role')
    role: string | undefined,

    @Query()
    query: StoreQueryDto,
  ) {
    if (role !== 'ADMIN') {
      throw new UnauthorizedException('Administrator access is required');
    }

    return this.storesService.findForManagement(query);
  }

  @Get('owner/me')
  findMyStores(
    @Headers('x-user-id')
    userId: string | undefined,

    @Headers('x-user-role')
    role: string | undefined,

    @Query()
    query: StoreQueryDto,
  ) {
    if (!userId || (role !== 'STORE_OWNER' && role !== 'ADMIN')) {
      throw new UnauthorizedException('Store owner access is required');
    }

    return this.storesService.findMyStores(userId, query);
  }

  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    id: string,
  ) {
    return this.storesService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
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
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    id: string,

    @Headers('x-user-id')
    userId: string | undefined,

    @Headers('x-user-role')
    role: string | undefined,

    @Body()
    dto: UpdateStoreDto,
  ) {
    if (!userId || !role) {
      throw new UnauthorizedException('User identity is missing');
    }

    return this.storesService.update(id, userId, role, dto);
  }

  @Delete(':id')
  remove(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    id: string,

    @Headers('x-user-id')
    userId: string | undefined,

    @Headers('x-user-role')
    role: string | undefined,
  ) {
    if (!userId || !role) {
      throw new UnauthorizedException('User identity is missing');
    }

    return this.storesService.remove(id, userId, role);
  }
}