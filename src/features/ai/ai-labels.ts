import type { AiFeature } from "@/types/insights";

export const AI_FEATURES: {
  value: AiFeature;
  label: string;
  description: string;
  input: "text" | "topic";
}[] = [
  {
    value: "caption",
    label: "Write captions",
    description: "Captions from a topic or idea",
    input: "topic",
  },
  { value: "ideas", label: "Content ideas", description: "Post ideas for a theme", input: "topic" },
  {
    value: "rewrite",
    label: "Rewrite",
    description: "Improve wording, same message",
    input: "text",
  },
  { value: "shorten", label: "Shorten", description: "Make it about half as long", input: "text" },
  { value: "expand", label: "Expand", description: "Add detail and context", input: "text" },
  { value: "hashtags", label: "Hashtags", description: "Relevant hashtags", input: "text" },
  {
    value: "variations",
    label: "Variations",
    description: "Different angles on a post",
    input: "text",
  },
  {
    value: "adapt",
    label: "Adapt per network",
    description: "One version per network, within limits",
    input: "text",
  },
];

export const AI_TONES = [
  "professional",
  "friendly",
  "casual",
  "witty",
  "inspirational",
  "persuasive",
  "informative",
  "enthusiastic",
];

/** Hand-off key used to open the composer with AI-generated text. */
export const COMPOSER_PREFILL_KEY = "composer:prefill";
