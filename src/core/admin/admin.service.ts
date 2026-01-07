import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { IContext } from 'src/shared/interfaces';
import { ExtraService } from '../extra/extra.service';
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly extra: ExtraService,
  ) {}
  async getAdminByName(username: string) {
    return this.prisma.user.findUnique({
      where: {
        username,
      },
    });
  }
  async isAdmin(name: string) {
    const admin = await this.getAdminByName(name);
    return admin?.is_admin ?? false;
  }
  async authorize(ctx: IContext): Promise<boolean> {
    const { text, from } = ctx.message;
    const { username } = from;
    try {
      if (!username) {
        return false;
      }
      const key = text && text.split(' ').slice(1).join(' ');
      if (key && key !== '') {
        const secret = this.configService.get<string>('ADMIN_KEY');
        const existAdmin = await this.getAdminByName(username);
        if (existAdmin) return true;
        if (key && key === secret) {
          await this.createAdmin(username);
        }
      }
      if (!(await this.isAdmin(username))) {
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      throw new Error('Authorization error');
    }
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
