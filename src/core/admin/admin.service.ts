import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
  async getAdminByName(name: string) {
    return this.prisma.user.findUnique({
      where: {
        username: name,
      },
    });
  }
  async isAdmin(name: string) {
    const admin = await this.getAdminByName(name);
    return admin?.is_admin || false;
  }
  async createAdmin(name: string) {
    return this.prisma.user.create({
      data: {
        username: name,
        is_admin: true,
      },
    });
  }
}
