import type { ApiEnvelope } from "@/types/api";
import type { Media } from "@/types/social";
import { apiClient, send } from "./api-client";

export const mediaService = {
  upload: async (file: File, onProgress?: (percent: number) => void): Promise<Media> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<ApiEnvelope<Media>>("/customer/media", form, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return data.data;
  },
  remove: (id: number) => send<null>("delete", `/customer/media/${id}`),
};
