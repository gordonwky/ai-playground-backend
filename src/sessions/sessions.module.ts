import { Module } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { SessionsController } from "./sessions.controller";
import { PrismaService } from "../shared/prisma.service";

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, PrismaService],
})
export class SessionsModule {}