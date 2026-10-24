"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import { Button, Card, ErrorState, Input, Loading } from "@/components/ui";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { AiAssistMenu } from "@/features/ai/ai-assist-menu";
import { COMPOSER_PREFILL_KEY } from "@/features/ai/ai-labels";
import { SubmitForApprovalModal } from "@/features/approvals/submit-for-approval-modal";
import { LibraryPicker } from "@/features/library/library-picker";
import { useCurrentUser, usePermission } from "@/features/auth/hooks";
import { usePlatforms, useSocialAccounts } from "@/features/social-accounts/hooks";
import { toApiError } from "@/lib/api-error";
import { isoToLocalInput, localInputToIso } from "@/lib/calendar";
import { accountIssues, extractHashtags, validateForPlatform } from "@/lib/post-validation";
import { approvalsService } from "@/services/approvals.service";
import { postsService } from "@/services/posts.service";
import { toast } from "@/stores/toast.store";
import type {
  ApprovalAction,
  Media,
  Platform,
  Post,
  PostAction,
  PostInput,
  SocialAccount,
} from "@/types/social";
import { AccountSelector } from "./account-selector";
import { CharacterMeter } from "./character-meter";
import { MediaUploader } from "./media-uploader";
import { PlatformCustomizer, type Variant } from "./platform-customizer";
import { PostPreview } from "./post-preview";

interface ComposerState {
  content: string;
  linkUrl: string;
  media: Media[];
  selected: number[];
  variants: Record<number, Variant>;
  scheduledAt: string;
}

function initialState(post?: Post): ComposerState {
  return {
    content: post?.content ?? "",
    linkUrl: post?.link_url ?? "",
    media: post?.media ?? [],
    selected: post?.targets.map((target) => target.social_account_id) ?? [],
    variants: Object.fromEntries(
      post?.targets.map((target) => [
        target.social_account_id,
        { content: target.content ?? "", options: target.options ?? {} },
      ]) ?? [],
    ),
    scheduledAt: isoToLocalInput(post?.scheduled_at ?? null),
  };
}

export function Composer({ post }: { post?: Post }) {
  const accounts = useSocialAccounts();
  const platforms = usePlatforms();

  if (accounts.isLoading || platforms.isLoading) return <Loading />;
  if (accounts.error || platforms.error) {
    return (
      <ErrorState
        error={accounts.error ?? platforms.error}
        onRetry={() => void accounts.refetch()}
      />
    );
  }

  return (
    <ComposerForm post={post} accounts={accounts.data ?? []} platforms={platforms.data ?? []} />
  );
}

function ComposerForm({
  post,
  accounts,
  platforms,
}: {
  post?: Post;
  accounts: SocialAccount[];
  platforms: Platform[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ComposerState>(() => initialState(post));
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const { data: me } = useCurrentUser();
  const needsApproval = Boolean(me?.requires_post_approval);
  const canSchedule = usePermission(PERMISSIONS.schedulePosts) && !needsApproval;
  const canPublish = usePermission(PERMISSIONS.publishPosts) && !needsApproval;
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const canUseAi = usePermission(PERMISSIONS.useAi);
  const canUseLibrary = usePermission(PERMISSIONS.manageContentLibrary);
  const searchParams = useSearchParams();

  const selectedAccounts = accounts.filter((account) => state.selected.includes(account.id));
  const platformFor = (account: SocialAccount) =>
    platforms.find((p) => p.key === account.platform.key);
  const selectedPlatforms = Array.from(
    new Set(selectedAccounts.map(platformFor).filter((p): p is Platform => p !== undefined)),
  );

  const clientErrors = useMemo(() => {
    const errors: Record<number, string[]> = {};
    for (const account of selectedAccounts) {
      const platform = platformFor(account);
      const issue = accountIssues(account);
      const text = state.variants[account.id]?.content || state.content;
      const messages = [
        ...(issue ? [issue] : []),
        ...(platform ? validateForPlatform(text, state.media, platform) : []),
      ];
      if (messages.length) errors[account.id] = messages;
    }
    return errors;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derived from state and the account lists
  }, [state, accounts, platforms]);

  const errorsByAccount = useMemo(() => {
    const merged: Record<number, string[]> = { ...clientErrors };
    for (const [key, messages] of Object.entries(serverErrors)) {
      const match = key.match(/^targets\.(\d+)$/);
      if (match)
        merged[Number(match[1])] = Array.from(
          new Set([...(merged[Number(match[1])] ?? []), ...messages]),
        );
    }
    return merged;
  }, [clientErrors, serverErrors]);

  const generalErrors = Object.entries(serverErrors)
    .filter(([key]) => !/^targets\.\d+$/.test(key))
    .flatMap(([, messages]) => messages);
  const blocked = selectedAccounts.length === 0 || Object.keys(clientErrors).length > 0;

  const mutation = useMutation({
    mutationFn: (input: PostInput) =>
      post ? postsService.update(post.id, input) : postsService.create(input),
    onSuccess: ({ data, message }) => {
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
      router.push(ROUTES.posts.detail(data.id));
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setServerErrors(apiError.errors);
      toast.error(apiError.message);
    },
  });

  const buildInput = (action: PostAction): PostInput => ({
    content: state.content,
    link_url: state.linkUrl.trim() || null,
    media_ids: state.media.map((item) => item.id),
    targets: state.selected.map((id) => ({
      social_account_id: id,
      content: state.variants[id]?.content || null,
      options: state.variants[id]?.options ?? null,
    })),
    action,
    scheduled_at: action === "schedule" ? localInputToIso(state.scheduledAt) : null,
  });

  const submit = (action: PostAction) => {
    setServerErrors({});
    if (action === "schedule" && !state.scheduledAt) {
      setServerErrors({ scheduled_at: ["Choose when to publish."] });
      return;
    }
    mutation.mutate(buildInput(action));
  };

  /** Saves the post as a draft, then submits it for review. */
  const submitForApproval = useMutation({
    mutationFn: async ({
      action,
      scheduledAt,
    }: {
      action: ApprovalAction;
      scheduledAt: string | null;
    }) => {
      const input = buildInput("draft");
      const saved = post
        ? await postsService.update(post.id, input)
        : await postsService.create(input);
      await approvalsService.submit(saved.data.id, action, scheduledAt);
      return saved.data;
    },
    onSuccess: (saved) => {
      toast.success("Post submitted for approval.");
      setApprovalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      router.push(ROUTES.posts.detail(saved.id));
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setServerErrors(apiError.errors);
      toast.error(apiError.message);
    },
  });

  const patch = (update: Partial<ComposerState>) =>
    setState((current) => ({ ...current, ...update }));
  const hashtags = extractHashtags(state.content);

  // Text handed over from AI Studio ("Use in a new post").
  useEffect(() => {
    if (post || !searchParams.get("prefill")) return;
    try {
      const prefill = sessionStorage.getItem(COMPOSER_PREFILL_KEY);
      if (prefill) {
        sessionStorage.removeItem(COMPOSER_PREFILL_KEY);
        setState((current) => ({ ...current, content: current.content || prefill }));
      }
    } catch {
      // Storage unavailable: nothing to prefill.
    }
  }, [post, searchParams]);

  return (
    <>
      <PageHeader
        title={post ? "Edit post" : "Create post"}
        description="Write once, customise per network, then schedule or publish."
      />

      {generalErrors.length > 0 && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {generalErrors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <div className="space-y-4">
              <AccountSelector
                accounts={accounts.filter((account) => !account.is_disconnected)}
                selected={state.selected}
                errorsByAccount={errorsByAccount}
                onToggle={(id) =>
                  patch({
                    selected: state.selected.includes(id)
                      ? state.selected.filter((s) => s !== id)
                      : [...state.selected, id],
                  })
                }
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="post-content"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Text
                  </label>
                  <div className="flex items-center gap-1">
                    {canUseAi && (
                      <AiAssistMenu
                        text={state.content}
                        platforms={selectedPlatforms.map((platform) => platform.key)}
                        onReplace={(content) => patch({ content })}
                        onAppend={(extra) =>
                          patch({ content: `${state.content.trimEnd()}\n\n${extra}` })
                        }
                        onAdapt={(byPlatform) =>
                          patch({
                            variants: {
                              ...state.variants,
                              ...Object.fromEntries(
                                selectedAccounts
                                  .filter((account) => byPlatform[account.platform.key])
                                  .map((account) => [
                                    account.id,
                                    {
                                      content: byPlatform[account.platform.key],
                                      options: state.variants[account.id]?.options ?? {},
                                    },
                                  ]),
                              ),
                            },
                          })
                        }
                      />
                    )}
                    {canUseLibrary && (
                      <Button size="sm" variant="ghost" onClick={() => setLibraryOpen(true)}>
                        Add from library
                      </Button>
                    )}
                  </div>
                </div>
                <textarea
                  id="post-content"
                  rows={7}
                  value={state.content}
                  onChange={(event) => patch({ content: event.target.value })}
                  placeholder="What would you like to share? Use #hashtags and @mentions."
                  className="focus:border-brand-500 focus:ring-brand-100 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CharacterMeter text={state.content} platforms={selectedPlatforms} />
                  {hashtags.length > 0 && (
                    <span className="text-xs text-slate-500">{hashtags.length} hashtag(s)</span>
                  )}
                </div>
              </div>
              <Input
                label="Link (optional)"
                type="url"
                placeholder="https://"
                value={state.linkUrl}
                onChange={(event) => patch({ linkUrl: event.target.value })}
                error={serverErrors.link_url?.[0]}
              />
              <MediaUploader media={state.media} onChange={(media) => patch({ media })} />
            </div>
          </Card>

          {selectedAccounts.length > 0 && (
            <Card
              title="Customise per network"
              description="Optional: tailor the text and settings for each account."
            >
              <PlatformCustomizer
                accounts={selectedAccounts}
                platforms={platforms}
                baseContent={state.content}
                variants={state.variants}
                onChange={(id, variant) =>
                  patch({ variants: { ...state.variants, [id]: variant } })
                }
              />
            </Card>
          )}

          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <Button
                variant="secondary"
                loading={mutation.isPending}
                onClick={() => submit("draft")}
              >
                Save draft
              </Button>
              {canSchedule && (
                <>
                  <Button
                    variant="secondary"
                    disabled={blocked || mutation.isPending}
                    onClick={() => submit("queue")}
                  >
                    Add to queue
                  </Button>
                  <div className="flex items-end gap-2">
                    <Input
                      label="Schedule for"
                      type="datetime-local"
                      value={state.scheduledAt}
                      onChange={(event) => patch({ scheduledAt: event.target.value })}
                      error={serverErrors.scheduled_at?.[0]}
                    />
                    <Button
                      disabled={blocked || mutation.isPending}
                      onClick={() => submit("schedule")}
                    >
                      Schedule
                    </Button>
                  </div>
                </>
              )}
              {canPublish && (
                <Button
                  className="ml-auto"
                  disabled={blocked || mutation.isPending}
                  onClick={() => submit("publish_now")}
                >
                  Publish now
                </Button>
              )}
              {needsApproval && (
                <Button
                  className="ml-auto"
                  disabled={blocked || mutation.isPending}
                  onClick={() => setApprovalOpen(true)}
                >
                  Submit for approval
                </Button>
              )}
            </div>
            {needsApproval && (
              <p className="mt-3 text-xs text-slate-500">
                Your posts are reviewed before they go out. Save a draft or submit it for approval.
              </p>
            )}
            {blocked && selectedAccounts.length > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                Fix the issues in the preview to schedule or publish. Drafts can be saved anytime.
              </p>
            )}
          </Card>
        </div>

        <aside className="space-y-4 lg:col-span-2" aria-label="Preview">
          <h2 className="text-sm font-semibold text-slate-700">Preview</h2>
          {selectedAccounts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Select an account to see a preview.
            </p>
          ) : (
            selectedAccounts.map((account) => (
              <div key={account.id} className="space-y-2">
                <PostPreview
                  account={account}
                  text={state.variants[account.id]?.content || state.content}
                  media={state.media}
                  linkUrl={state.linkUrl}
                  title={state.variants[account.id]?.options.title}
                />
                {errorsByAccount[account.id]?.map((message) => (
                  <p key={message} className="text-xs text-red-600">
                    {message}
                  </p>
                ))}
              </div>
            ))
          )}
        </aside>
      </div>
      <LibraryPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onMedia={(media) => patch({ media: [...state.media, media] })}
        onText={(text) =>
          patch({ content: state.content ? `${state.content.trimEnd()}\n\n${text}` : text })
        }
      />
      <SubmitForApprovalModal
        open={approvalOpen}
        loading={submitForApproval.isPending}
        initialScheduledAt={state.scheduledAt ? localInputToIso(state.scheduledAt) : null}
        onClose={() => setApprovalOpen(false)}
        onSubmit={(action, scheduledAt) => submitForApproval.mutate({ action, scheduledAt })}
      />
    </>
  );
}
