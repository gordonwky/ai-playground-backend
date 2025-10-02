import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionsModule } from './sessions/sessions.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [SessionsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
