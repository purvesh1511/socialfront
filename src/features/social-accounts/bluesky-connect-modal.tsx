"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";
import { applyApiErrors } from "@/hooks/use-api-form-errors";
import { accountsService } from "@/services/accounts.service";
import { toast } from "@/stores/toast.store";
import { accountKeys } from "./hooks";

const schema = z.object({
  identifier: z.string().trim().min(1, "Enter your handle or email."),
  password: z.string().min(1, "Enter an app password."),
});
type Values = z.infer<typeof schema>;

export function BlueskyConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: Values) =>
      accountsService.connectWithCredentials("bluesky", values.identifier, values.password),
  });
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <Modal open={open} onClose={onClose} title="Connect Bluesky">
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          mutation.mutate(values, {
            onSuccess: ({ message }) => {
              toast.success(message);
              reset();
              void queryClient.invalidateQueries({ queryKey: accountKeys.all });
              onClose();
            },
            onError: (error) => applyApiErrors(error, setError),
          }),
        )}
      >
        <p className="text-sm text-slate-600">
          Use an <strong>app password</strong> from Bluesky → Settings → Privacy and security → App
          passwords. Your main password is never needed, and the app password is not stored.
        </p>
        <Input
          label="Handle or email"
          placeholder="you.bsky.social"
          error={errors.identifier?.message}
          {...register("identifier")}
        />
        <Input
          label="App password"
          type="password"
          autoComplete="off"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Connect
          </Button>
        </div>
      </form>
    </Modal>
  );
}
