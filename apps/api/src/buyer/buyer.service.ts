import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

export interface SavedAddress extends CreateAddressDto {
  id: string;
  createdAt: string;
}

@Injectable()
export class BuyerService {
  constructor(private readonly prisma: PrismaService) {}

  async listAddresses(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { addresses: true },
    });

    const addresses = Array.isArray(profile?.addresses)
      ? (profile.addresses as unknown as SavedAddress[])
      : [];

    return { addresses };
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    const current = await this.listAddresses(userId);
    const address: SavedAddress = {
      ...dto,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const addresses = [address, ...current.addresses];
    await this.prisma.profile.update({
      where: { id: userId },
      data: { addresses: addresses as unknown as Prisma.InputJsonValue },
    });

    return { addresses };
  }
}
