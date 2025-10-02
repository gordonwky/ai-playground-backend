import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Sse,
  MessageEvent,
  Req
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { SessionsService } from './sessions.service';
import type { StartSessionDto } from './dto';
import { JwtAuthGuard } from '../shared/jwt.guard';
import { UseGuards } from '@nestjs/common';


@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}
  
  @UseGuards(JwtAuthGuard)
  @Post()
  start(@Body() dto: StartSessionDto) {
    return this.sessionsService.startSession(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.sessionsService.getSession(id);
  }

  @Get()
  list(@Query('userId') userId?: string, @Query('limit') limit = '20') {
    return this.sessionsService.listSessions(userId, parseInt(limit, 10));
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    const asyncGen = this.sessionsService.streamSession(id);

    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          for await (const ev of asyncGen) {
            subscriber.next({ data: JSON.stringify(ev) }); // 👈 flatten 成 JSON
          }
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();
    });
  }
}
