import { Injectable, MessageEvent} from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import type { StartSessionDto } from './dto';
import { LLMProvider } from './provider.interface';
import { OpenAILikeProvider } from './providers/openai-like.provider';

@Injectable()
export class SessionsService {
  private providers: Record<string, LLMProvider> = {};

  constructor(private prisma: PrismaService) {
    if (process.env.OPENAI_API_KEY) {
      this.providers['openai'] = new OpenAILikeProvider(
        'openai',
        process.env.OPENAI_API_KEY,
        'https://api.openai.com/v1'
      );
    }
    if (process.env.OPENROUTER_API_KEY) {
      this.providers['openrouter'] = new OpenAILikeProvider(
        'openrouter',
        process.env.OPENROUTER_API_KEY,
        'https://openrouter.ai/api/v1'
      );
    }
  }

  getProvider(name: string): LLMProvider {
    const provider = this.providers[name];
    if (!provider) throw new Error(`Provider ${name} not configured`);
    return provider;
  }

  async startSession(dto: StartSessionDto) {
    const session = await this.prisma.session.create({
      data: { userId: dto.userId, prompt: dto.prompt },
    });

    await this.prisma.modelRun.createMany({
      data: dto.models.map(m => ({
        sessionId: session.id,
        provider: m.provider,
        model: m.model,
        status: 'queued',
      })),
    });

    return { sessionId: session.id };
  }

async getSession(id: string) {
  return this.prisma.session.findUnique({
    where: { id },
    include: { 
      runs: true,
      user: true, 
    },
  });
}


  async listSessions(userId?: string, limit = 20) {
    return this.prisma.session.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { runs: true },
    });
  }

async *streamSession(sessionId: string): AsyncIterable<MessageEvent> {
  const session = await this.getSession(sessionId);
  if (!session) {
    yield { data: { type: 'error', message: 'Session not found' } };
    return;
  }

  const tasks = session.runs.map(run =>
    this.runModel(run, session.prompt)
  );

  for await (const ev of this.mergeStreams(tasks)) {
    yield { data: ev };
  }

  //  sentinel event
  yield { data: { type: 'all-complete', t: Date.now() } };
}


private async *runModel(run: any, prompt: string): AsyncIterable<any> {
  const provider = this.getProvider(run.provider);

  try {
    const session = await this.prisma.session.findUnique({
      where: { id: run.sessionId },
      include: { user: true },
    });
    if (!session) throw new Error('Session not found');

    await this.prisma.user.update({
      where: { id: session.userId },
      data: { quotaUsed: { increment: 1 } },
    });

    await this.prisma.modelRun.update({
      where: { id: run.id },
      data: { status: 'streaming' },
    });

    let fullResponse = '';

    for await (const ev of provider.streamChat({ model: run.model, prompt })) {
      if (ev.type === 'delta') {
        fullResponse += ev.delta;
      }
      yield { ...ev, runId: run.id };
    }

    // count characters
    const chars = fullResponse.length;

    // count cost (example: $0.0001 per character)
    const cost = chars * 0.0001;

    await this.prisma.modelRun.update({
      where: { id: run.id },
      data: {
        status: 'complete',
        responseMd: fullResponse,
        chars,
        cost,
      },
    });

  } catch (e: any) {
    await this.prisma.modelRun.update({
      where: { id: run.id },
      data: { status: 'error' },
    });
    yield { type: 'error', model: run.model, runId: run.id, t: Date.now(), message: e.message };
  }
}


private async *mergeStreams(iterables: AsyncIterable<any>[]) {
  const readers = iterables.map(it => it[Symbol.asyncIterator]());

  while (readers.length > 0) {
    const results = await Promise.allSettled(
      readers.map((r, i) =>
        r.next().then(res => ({ res, i }))
      )
    );

    for (let i = results.length - 1; i >= 0; i--) {
      const r = results[i];
      if (r.status === 'fulfilled') {
        if (r.value.res.done) {
          readers.splice(i, 1);
        } else {
          yield r.value.res.value;
        }
      } else {
        readers.splice(i, 1);
      }
    }
  }
}



}
