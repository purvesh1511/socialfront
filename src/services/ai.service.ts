import type { AiGeneration, AiRequestInput, AiUsage, BrandVoice } from "@/types/insights";
import { get, send } from "./api-client";

export const aiService = {
  options: () =>
    get<{ features: string[]; tones: string[]; usage: AiUsage }>("/customer/ai/options"),
  generate: (input: AiRequestInput) => send<AiGeneration>("post", "/customer/ai/generate", input),
  history: () => get<AiGeneration[]>("/customer/ai/history"),
  brandVoices: () => get<BrandVoice[]>("/customer/ai/brand-voices"),
  saveBrandVoice: (input: Omit<BrandVoice, "id">, id?: number) =>
    id
      ? send<BrandVoice>("put", `/customer/ai/brand-voices/${id}`, input)
      : send<BrandVoice>("post", "/customer/ai/brand-voices", input),
  deleteBrandVoice: (id: number) => send<null>("delete", `/customer/ai/brand-voices/${id}`),
};
