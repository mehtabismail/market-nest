import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

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
    await this.persist(userId, addresses);
    return { addresses };
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const current = await this.listAddresses(userId);
    const index = current.addresses.findIndex((a) => a.id === addressId);
    if (index < 0) throw new NotFoundException('Address not found');

    const existing = current.addresses[index];
    const addresses = [...current.addresses];
    addresses[index] = {
      ...existing,
      ...dto,
      // Explicit null clears an optional line2; undefined leaves it alone.
      line2: dto.line2 === undefined ? existing.line2 : (dto.line2 ?? undefined),
      id: existing.id,
      createdAt: existing.createdAt,
    };

    await this.persist(userId, addresses);
    return { addresses };
  }

  async removeAddress(userId: string, addressId: string) {
    const current = await this.listAddresses(userId);
    const addresses = current.addresses.filter((a) => a.id !== addressId);
    // Idempotent: deleting an absent id is a success, not a 404 — same pattern
    // as wishlist remove, so a double-tap cannot 500.
    if (addresses.length === current.addresses.length) {
      return { addresses };
    }
    await this.persist(userId, addresses);
    return { addresses };
  }

  private async persist(userId: string, addresses: SavedAddress[]) {
    await this.prisma.profile.update({
      where: { id: userId },
      data: { addresses: addresses as unknown as Prisma.InputJsonValue },
    });
  }
}
