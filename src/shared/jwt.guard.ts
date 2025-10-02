// jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers["authorization"];
    if (!authHeader) return false;

    const [, token] = authHeader.split(" ");
    try {
      const payload = await this.jwt.verifyAsync(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return false;

      // Quota check
      if (user.quotaUsed >= user.quotaMax) {
        throw new ForbiddenException("Quota exceeded");
      }

      req.user = user;
      return true;
    } catch {
      return false;
    }
  }
}
