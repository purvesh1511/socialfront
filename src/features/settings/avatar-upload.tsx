"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { Button, Card } from "@/components/ui";
import { authKeys } from "@/features/auth/hooks";
import { errorMessage } from "@/lib/api-error";
import { profileService } from "@/services/profile.service";
import { toast } from "@/stores/toast.store";
import type { AuthUser } from "@/types/user";
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from "@/validations/profile";

export function AvatarUpload({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useMutation({
    mutationFn: profileService.uploadAvatar,
    onSuccess: ({ data, message }) => {
      queryClient.setQueryData(authKeys.me, data);
      toast.success(message);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type))
      return toast.error("Please choose a JPG, PNG or WebP image.");
    if (file.size > AVATAR_MAX_BYTES) return toast.error("Images must be 2 MB or smaller.");
    mutation.mutate(file);
  };

  return (
    <Card title="Avatar">
      <div className="flex items-center gap-4">
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- served from the API's storage host
          <img src={user.avatar_url} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <span className="bg-brand-100 text-brand-700 flex size-16 items-center justify-center rounded-full text-xl font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={AVATAR_TYPES.join(",")}
            className="sr-only"
            aria-label="Upload avatar"
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            loading={mutation.isPending}
            onClick={() => inputRef.current?.click()}
          >
            Upload new photo
          </Button>
          <p className="mt-1 text-xs text-slate-500">JPG, PNG or WebP, up to 2 MB.</p>
        </div>
      </div>
    </Card>
  );
}
