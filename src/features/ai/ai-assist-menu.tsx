"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Dropdown, Loading, Modal } from "@/components/ui";
import { toApiError } from "@/lib/api-error";
import { aiService } from "@/services/ai.service";
import { toast } from "@/stores/toast.store";
import type { AiFeature, AiResult } from "@/types/insights";

interface AiAssistMenuProps {
  text: string;
  platforms: string[];
  onReplace: (text: string) => void;
  onAppend: (text: string) => void;
  /** Called with one result per network key for "Adapt per network". */
  onAdapt: (byPlatform: Record<string, string>) => void;
}

const ACTIONS: { feature: AiFeature; label: string }[] = [
  { feature: "rewrite", label: "Rewrite" },
  { feature: "shorten", label: "Shorten" },
  { feature: "expand", label: "Expand" },
  { feature: "variations", label: "Suggest variations" },
  { feature: "hashtags", label: "Add hashtags" },
  { feature: "adapt", label: "Adapt per network" },
];

/** Composer "AI" menu working on the current text. */
export function AiAssistMenu({ text, platforms, onReplace, onAppend, onAdapt }: AiAssistMenuProps) {
  const [results, setResults] = useState<{ feature: AiFeature; items: AiResult[] } | null>(null);

  const run = useMutation({
    mutationFn: (feature: AiFeature) =>
      aiService.generate({
        feature,
        text,
        platforms: feature === "adapt" ? platforms : undefined,
        count: feature === "variations" ? 3 : undefined,
      }),
    onSuccess: ({ data }, feature) => {
      if (feature === "adapt") {
        onAdapt(
          Object.fromEntries(
            data.results.filter((r) => r.label).map((r) => [r.label as string, r.text]),
          ),
        );
        toast.success(
          "Added a tailored version for each network. Review them under “Customise per network”.",
        );
        return;
      }
      setResults({ feature, items: data.results });
    },
    onError: (error) => toast.error(toApiError(error).message),
  });

  const disabledReason = !text.trim() ? "Write some text first" : null;

  return (
    <>
      <Dropdown
        label="AI assist"
        align="left"
        trigger={<span className="text-brand-700 text-sm font-medium">✨ AI assist</span>}
        items={ACTIONS.map((action) => ({
          label: action.label,
          disabled:
            Boolean(disabledReason) ||
            run.isPending ||
            (action.feature === "adapt" && platforms.length === 0),
          onSelect: () => run.mutate(action.feature),
        }))}
      />
      {run.isPending && (
        <span className="sr-only" role="status">
          Generating…
        </span>
      )}
      <Modal
        open={results !== null || (run.isPending && run.variables !== "adapt")}
        onClose={() => setResults(null)}
        title="AI suggestions"
      >
        {run.isPending ? (
          <Loading label="Writing suggestions…" />
        ) : (
          <ul className="space-y-3">
            {results?.items.map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                {item.label && (
                  <p className="mb-1 text-xs font-semibold text-slate-500">{item.label}</p>
                )}
                <p className="text-sm whitespace-pre-wrap text-slate-800">{item.text}</p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    if (results?.feature === "hashtags") onAppend(item.text);
                    else onReplace(item.text);
                    setResults(null);
                  }}
                >
                  {results?.feature === "hashtags" ? "Add to post" : "Use this"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
