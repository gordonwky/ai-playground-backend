export type StreamEvent =
  | { type: 'start'; model: string; t: number }
  | { type: 'delta'; model: string; delta: string; t: number }
  | { type: 'end';   model: string; t: number; usage?: { input: number; output: number }; costUsd?: number }
  | { type: 'error'; model: string; t: number; message: string };

export interface LLMProvider {
  name: string;
  streamChat(opts: { model: string; prompt: string }): AsyncIterable<StreamEvent>;
}