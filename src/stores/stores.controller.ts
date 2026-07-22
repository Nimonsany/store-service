import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
  ) {}

  @Post()
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
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