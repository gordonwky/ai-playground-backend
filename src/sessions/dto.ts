export type StartSessionDto = {
  userId: string;
  prompt: string;
  models: { provider: string; model: string }[];
};
