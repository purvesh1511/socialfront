import Image from "next/image";
import { cn } from "@/lib/cn";
import logo from "../../../assets/logo.png";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "SocialSaaS";

/** Brand wordmark; size it with a height class (width follows the aspect ratio). */
export function Logo({ className }: { className?: string }) {
  return <Image src={logo} alt={appName} priority className={cn("h-8 w-auto", className)} />;
}
