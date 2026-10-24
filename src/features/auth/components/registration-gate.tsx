"use client";

import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui";
import { settingsService } from "@/services/settings.service";
import { RegisterForm } from "./register-form";

/** Shows the registration form only while registration is enabled in system settings. */
export function RegistrationGate() {
  const settings = useQuery({ queryKey: ["settings", "public"], queryFn: settingsService.public });

  if (settings.isLoading) return <Loading />;
  if (settings.data?.registration_enabled === false) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
        New registrations are currently closed.
      </p>
    );
  }

  return <RegisterForm />;
}
