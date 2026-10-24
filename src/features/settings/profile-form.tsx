"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button, Card, Input, Select } from "@/components/ui";
import { TIMEZONES } from "@/constants/navigation";
import { authKeys } from "@/features/auth/hooks";
import { applyApiErrors } from "@/hooks/use-api-form-errors";
import { profileService } from "@/services/profile.service";
import { toast } from "@/stores/toast.store";
import type { AuthUser } from "@/types/user";
import { profileSchema, type ProfileInput } from "@/validations/profile";

const timezoneOptions = TIMEZONES.map((zone) => ({ value: zone, label: zone }));

export function ProfileForm({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({ mutationFn: profileService.update });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email, timezone: user.timezone },
  });

  const onSubmit = handleSubmit((values) =>
    mutation.mutate(values, {
      onSuccess: ({ data, message }) => {
        queryClient.setQueryData(authKeys.me, data);
        reset({ name: data.name, email: data.email, timezone: data.timezone });
        toast.success(message);
      },
      onError: (error) => applyApiErrors(error, setError),
    }),
  );

  return (
    <Card title="Profile information" description="Update your name, email address and timezone.">
      <form onSubmit={onSubmit} className="grid gap-4 sm:max-w-lg" noValidate>
        <Input
          label="Name"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          hint="Changing your email requires verifying the new address."
          error={errors.email?.message}
          {...register("email")}
        />
        <Select
          label="Timezone"
          options={timezoneOptions}
          error={errors.timezone?.message}
          {...register("timezone")}
        />
        <div>
          <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
