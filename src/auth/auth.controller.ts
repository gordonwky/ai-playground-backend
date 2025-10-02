import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  register(@Body() dto: { email: string; password: string }) {
    return this.auth.register(dto.email, dto.password);
  }
  @Post('login')
  async login(
    @Body() dto: { email: string; password: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.login(dto.email, dto.password);

    // 👇 Set cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true,        
      sameSite: 'none',    
      maxAge: 60 * 60 * 24 * 1000, // 1 day
      path: '/',
    });


    return { token: result.token, userId: result.userId };
  }


}
