import type { Metadata } from "next";
import { QueuePage } from "@/features/queue/queue-page";

export const metadata: Metadata = { title: "Queue" };

export default function Page() {
  return <QueuePage />;
}
