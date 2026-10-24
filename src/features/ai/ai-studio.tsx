"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Button, Card, ConfirmDialog, EmptyState, Input, Loading, Select } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { usePlatforms } from "@/features/social-accounts/hooks";
import { errorMessage, toApiError } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { humanize } from "@/lib/format";
import { aiService } from "@/services/ai.service";
import { toast } from "@/stores/toast.store";
import type { AiFeature, AiResult, BrandVoice } from "@/types/insights";
import { AI_FEATURES, AI_TONES, COMPOSER_PREFILL_KEY } from "./ai-labels";

export function AiStudio() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const platforms = usePlatforms();
  const options = useQuery({ queryKey: ["ai", "options"], queryFn: aiService.options });
  const voices = useQuery({ queryKey: ["ai", "brand-voices"], queryFn: aiService.brandVoices });
  const [feature, setFeature] = useState<AiFeature>("caption");
  const [text, setText] = useState("");
  const [tone, setTone] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [count, setCount] = useState(3);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [results, setResults] = useState<AiResult[]>([]);

  const config = AI_FEATURES.find((f) => f.value === feature) ?? AI_FEATURES[0];
  const usage = options.data?.usage;

  const generate = useMutation({
    mutationFn: () =>
      aiService.generate({
        feature,
        [config.input]: text,
        tone: tone || null,
        brand_voice_id: voiceId ? Number(voiceId) : null,
        platforms: feature === "adapt" ? selectedPlatforms : undefined,
        count: ["caption", "variations", "ideas"].includes(feature) ? count : undefined,
      }),
    onSuccess: ({ data }) => {
      setErrors({});
      setResults(data.results);
      if (data.usage)
        queryClient.setQueryData(["ai", "options"], { ...options.data, usage: data.usage });
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setErrors(apiError.errors);
      toast.error(apiError.message);
    },
  });

  const openInComposer = (value: string) => {
    try {
      sessionStorage.setItem(COMPOSER_PREFILL_KEY, value);
    } catch {
      // Storage unavailable: fall back to copying.
      void navigator.clipboard.writeText(value);
    }
    router.push(`${ROUTES.posts.create}?prefill=1`);
  };

  return (
    <>
      <PageHeader
        title="AI Studio"
        description="Draft, rewrite and adapt posts. Always review suggestions before publishing."
        actions={
          usage && (
            <span className="text-sm text-slate-500">
              {usage.remaining} of {usage.limit} requests left this month
            </span>
          )
        }
      />
      {usage && !usage.configured && (
        <p role="alert" className="mb-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          The AI assistant isn&apos;t configured yet. Ask an administrator to add an AI provider
          key.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                generate.mutate();
              }}
            >
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">
                  What do you need?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {AI_FEATURES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={feature === option.value}
                      onClick={() => setFeature(option.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-sm",
                        feature === option.value
                          ? "border-brand-500 bg-brand-50 text-brand-800"
                          : "border-slate-200 text-slate-700 hover:border-slate-300",
                      )}
                    >
                      <span className="block font-medium">{option.label}</span>
                      <span className="block text-xs text-slate-500">{option.description}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-1">
                <label htmlFor="ai-input" className="block text-sm font-medium text-slate-700">
                  {config.input === "topic" ? "Topic or idea" : "Your post"}
                </label>
                <textarea
                  id="ai-input"
                  rows={config.input === "topic" ? 3 : 6}
                  maxLength={config.input === "topic" ? 500 : 5000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    config.input === "topic"
                      ? "e.g. New Laravel service launched"
                      : "Paste the post to work on"
                  }
                  className="focus:border-brand-500 focus:ring-brand-100 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                />
                {(errors.text ?? errors.topic) && (
                  <p className="text-sm text-red-600">{(errors.text ?? errors.topic)?.[0]}</p>
                )}
              </div>
              {feature === "adapt" && (
                <fieldset>
                  <legend className="mb-1 text-sm font-medium text-slate-700">Networks</legend>
                  <div className="flex flex-wrap gap-2">
                    {(platforms.data ?? []).map((p) => (
                      <label
                        key={p.key}
                        className="flex items-center gap-1.5 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          className="accent-brand-600"
                          checked={selectedPlatforms.includes(p.key)}
                          onChange={(e) =>
                            setSelectedPlatforms((current) =>
                              e.target.checked
                                ? [...current, p.key]
                                : current.filter((k) => k !== p.key),
                            )
                          }
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                  {errors.platforms && (
                    <p className="mt-1 text-sm text-red-600">Choose at least one network.</p>
                  )}
                </fieldset>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Tone"
                  placeholder="Default"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  options={AI_TONES.map((t) => ({ value: t, label: humanize(t) }))}
                />
                <Select
                  label="Brand voice"
                  placeholder={voices.data?.some((v) => v.is_default) ? "Default voice" : "None"}
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  options={(voices.data ?? []).map((v) => ({ value: String(v.id), label: v.name }))}
                />
              </div>
              {["caption", "variations", "ideas"].includes(feature) && (
                <Select
                  label="How many"
                  value={String(count)}
                  onChange={(e) => setCount(Number(e.target.value))}
                  options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
                />
              )}
              <Button
                type="submit"
                className="w-full"
                loading={generate.isPending}
                disabled={!text.trim() || usage?.configured === false}
              >
                Generate
              </Button>
            </form>
          </Card>
          <BrandVoices voices={voices.data ?? []} isLoading={voices.isLoading} />
        </div>
        <section aria-label="Suggestions" aria-live="polite" className="space-y-3 lg:col-span-3">
          {generate.isPending ? (
            <Loading label="Writing suggestions…" />
          ) : results.length === 0 ? (
            <EmptyState
              title="Suggestions appear here"
              description="Pick a task, add your text or topic, and press Generate."
            />
          ) : (
            results.map((result) => (
              <Card key={result.id} title={result.label ?? undefined}>
                <p className="text-sm whitespace-pre-wrap text-slate-800">{result.text}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(result.text)
                        .then(() => toast.success("Copied."))
                    }
                  >
                    Copy
                  </Button>
                  <Button size="sm" onClick={() => openInComposer(result.text)}>
                    Use in a new post
                  </Button>
                </div>
              </Card>
            ))
          )}
        </section>
      </div>
    </>
  );
}

function BrandVoices({ voices, isLoading }: { voices: BrandVoice[]; isLoading: boolean }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<BrandVoice> | null>(null);
  const [deleting, setDeleting] = useState<BrandVoice | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["ai", "brand-voices"] });

  const save = useMutation({
    mutationFn: (voice: Partial<BrandVoice>) =>
      aiService.saveBrandVoice(
        {
          name: voice.name ?? "",
          description: voice.description ?? "",
          is_default: Boolean(voice.is_default),
        },
        voice.id,
      ),
    onSuccess: ({ message }) => {
      toast.success(message);
      setEditing(null);
      void refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => aiService.deleteBrandVoice(id),
    onSuccess: () => {
      setDeleting(null);
      void refresh();
    },
  });

  return (
    <Card
      title="Brand voices"
      description="Describe how your brand writes; the default voice is used automatically."
      actions={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setEditing({ is_default: voices.length === 0 })}
        >
          Add
        </Button>
      }
    >
      {isLoading ? (
        <Loading />
      ) : (
        <ul className="space-y-2">
          {voices.map((voice) => (
            <li
              key={voice.id}
              className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-800">
                  {voice.name}{" "}
                  {voice.is_default && (
                    <span className="text-brand-700 text-xs font-normal">(default)</span>
                  )}
                </p>
                <p className="line-clamp-2 text-slate-600">{voice.description}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(voice)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Delete ${voice.name}`}
                  onClick={() => setDeleting(voice)}
                >
                  ✕
                </Button>
              </div>
            </li>
          ))}
          {voices.length === 0 && <li className="text-sm text-slate-500">No brand voices yet.</li>}
        </ul>
      )}
      {editing && (
        <form
          className="mt-4 space-y-3 border-t border-slate-100 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(editing);
          }}
        >
          <Input
            label="Name"
            maxLength={100}
            value={editing.name ?? ""}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
          />
          <div className="space-y-1">
            <label htmlFor="voice-description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="voice-description"
              rows={3}
              maxLength={1000}
              placeholder="e.g. Warm and concise. Short sentences, no jargon, one emoji at most."
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="accent-brand-600"
              checked={Boolean(editing.is_default)}
              onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })}
            />
            Use by default
          </label>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={save.isPending}>
              Save
            </Button>
          </div>
        </form>
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete brand voice?"
        description={`“${deleting?.name ?? ""}” will no longer be available.`}
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  );
}
