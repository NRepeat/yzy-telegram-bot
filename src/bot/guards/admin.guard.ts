import { prisma } from '../../lib/prisma';
import { MyContext } from '../types';

export class AdminGuard {
  async checkAdmin(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user?.is_admin === true;
  }

  middleware() {
    return async (ctx: MyContext, next: () => Promise<void>) => {
      if (ctx.from && await this.checkAdmin(ctx.from.id)) {
        await next();
      } else {
        await ctx.reply('You are not authorized to perform this action.');
      }
    };
  }
}
