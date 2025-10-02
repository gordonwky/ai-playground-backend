import OpenAI from "openai";
import { LLMProvider, StreamEvent } from "../provider.interface";

export class OpenAILikeProvider implements LLMProvider {
  public name: string; 
  private client: OpenAI;

  constructor(providerName: string, apiKey: string, baseUrl?: string) {
    this.name = providerName; 
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl, // e.g. "https://api.openai.com/v1"
    });
  }

async *streamChat(opts: { model: string; prompt: string }): AsyncIterable<StreamEvent> {
  let stream: any;
  try {
    stream = await this.client.chat.completions.create({
      model: opts.model,
      messages: [{ role: "user", content: opts.prompt }],
      stream: true,
    });
  } catch (e: any) {
    // api request error
    yield {
      type: "error",
      model: opts.model,
      t: Date.now(),
      message: `OpenAI API error: ${e.message ?? e.toString()}`,
    };
    return;
  }

  try {
    for await (const event of stream) {
      if (event.choices[0]?.delta?.content) {
        yield {
          type: "delta",
          model: opts.model,
          delta: event.choices[0].delta.content,
          t: Date.now(),
        };
      }
    }
  } catch (e: any) {
    // stream error
    yield {
      type: "error",
      model: opts.model,
      t: Date.now(),
      message: `Stream error: ${e.message ?? e.toString()}`,
    };
    return;
  }

  yield { type: "end", model: opts.model, t: Date.now() };
}

}
