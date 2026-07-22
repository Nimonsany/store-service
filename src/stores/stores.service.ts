import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
  ownerUserId: string,
  dto: CreateStoreDto,
 ) {const existingSlug = await this.prisma.store.findUnique({
      where: {
        slug: dto.slug,
      },
    });

    if (existingSlug) {
      throw new BadRequestException('Store slug already exists');
    }

    return this.prisma.store.create({
      data: {
        ownerUserId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        addressLine: dto.addressLine,
        city: dto.city,
        district: dto.district,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        deliveryRadiusKm: dto.deliveryRadiusKm,
      },
    });
  }

  async findAll() {
    return this.prisma.store.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const store = await this.prisma.store.findUnique({
      where: {
        id,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }
}