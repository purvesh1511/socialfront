import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "SocialSaaS";

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description: "Plan, schedule and analyse your social media from one place.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
