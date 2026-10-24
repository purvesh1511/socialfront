import { Badge } from "@/components/ui";
import { POST_STATUS_LABELS, POST_STATUS_TONES } from "@/constants/social";
import type { PostStatus } from "@/types/social";

export function PostStatusBadge({ status }: { status: PostStatus }) {
  return <Badge tone={POST_STATUS_TONES[status]}>{POST_STATUS_LABELS[status]}</Badge>;
}
