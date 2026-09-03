import { Module } from '@nestjs/common';

import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { InternalServiceGuard } from '../security/guards/internal-service.guard';

@Module({
  controllers: [StoresController],
  providers: [StoresService, InternalServiceGuard],
})
export class StoresModule {}
