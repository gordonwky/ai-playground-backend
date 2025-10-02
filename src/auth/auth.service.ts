// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async register(email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hash },
    });
    return this.signToken(user.id, user.plan);
  }

async login(email: string, password: string) {
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedException('Invalid credentials');
  }
  return {
    token: this.signToken(user.id, user.plan),
    userId: user.id,
  };
}


  


  private signToken(userId: string, plan: string) {
    return this.jwt.sign({ sub: userId, plan });
  }
}
