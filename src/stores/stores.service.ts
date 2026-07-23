import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreStatusDto } from './dto/update-store-status.dto';
import { Prisma } from '@prisma/client';
import { StoreQueryDto } from './dto/store-query.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerUserId: string, dto: CreateStoreDto) {
    const existingSlug = await this.prisma.store.findUnique({
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

  async findAll(query: StoreQueryDto) {
    return this.findStores(
      {
        status: 'ACTIVE',
      },
      query,
    );
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

  private async ensureOwnership(storeId: string, userId: string, role: string) {
    const store = await this.findOne(storeId);

    if (role === 'ADMIN') {
      return store;
    }

    if (store.ownerUserId !== userId) {
      throw new ForbiddenException('You can only manage your own store');
    }

    return store;
  }

  async verifyManageAccess(storeId: string, userId: string, role: string) {
    await this.ensureOwnership(storeId, userId, role);

    return {
      allowed: true,
      storeId,
    };
  }

  async update(id: string, userId: string, role: string, dto: UpdateStoreDto) {
    await this.ensureOwnership(id, userId, role);

    if (dto.slug) {
      const existingSlug = await this.prisma.store.findUnique({
        where: {
          slug: dto.slug,
        },
      });

      if (existingSlug && existingSlug.id !== id) {
        throw new BadRequestException('Store slug already exists');
      }
    }

    return this.prisma.store.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async remove(id: string, userId: string, role: string) {
    await this.ensureOwnership(id, userId, role);

    return this.prisma.store.delete({
      where: {
        id,
      },
    });
  }

  async updateStatus(id: string, role: string, dto: UpdateStoreStatusDto) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only administrators can change store status',
      );
    }

    await this.findOne(id);

    return this.prisma.store.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
      },
    });
  }

  async findActiveStoreIds() {
    const stores = await this.prisma.store.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    return {
      storeIds: stores.map((store) => store.id),
    };
  }

  async verifyPublicAccess(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: {
        id: storeId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!store || store.status !== 'ACTIVE') {
      throw new NotFoundException('Store not found');
    }

    return {
      allowed: true,
      storeId: store.id,
    };
  }

  private async findStores(
    where: Prisma.StoreWhereInput,
    query: StoreQueryDto,
  ) {
    const { page, limit, search, city, sortBy, sortOrder } = query;

    const skip = (page - 1) * limit;

    const finalWhere: Prisma.StoreWhereInput = {
      ...where,

      ...(city && {
        city: {
          equals: city,
          mode: 'insensitive',
        },
      }),

      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            slug: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            city: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [stores, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where: finalWhere,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),

      this.prisma.store.count({
        where: finalWhere,
      }),
    ]);

    return {
      data: stores,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findForManagement(query: StoreQueryDto) {
    const where: Prisma.StoreWhereInput = {
      ...(query.status && {
        status: query.status,
      }),
    };

    return this.findStores(where, query);
  }

  async findMyStores(ownerUserId: string, query: StoreQueryDto) {
    const where: Prisma.StoreWhereInput = {
      ownerUserId,

      ...(query.status && {
        status: query.status,
      }),
    };

    return this.findStores(where, query);
  }
}
