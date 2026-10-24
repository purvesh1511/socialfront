import { apiClient } from "@/services/api-client";

/** Filename from a Content-Disposition header (handles RFC 5987 `filename*=`). */
export function filenameFromDisposition(
  header: string | null | undefined,
  fallback: string,
): string {
  if (!header) return fallback;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded?.[1]) return decodeURIComponent(encoded[1]);
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain?.[1] ?? fallback;
}

/** Downloads an authenticated API file through the proxy and saves it in the browser. */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const response = await apiClient.get<Blob>(path, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filenameFromDisposition(
    response.headers["content-disposition"] as string | undefined,
    fallbackName,
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
