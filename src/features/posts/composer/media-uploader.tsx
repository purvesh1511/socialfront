"use client";

import { useRef, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { IMAGE_MAX_BYTES, MEDIA_ACCEPT, VIDEO_MAX_BYTES } from "@/constants/social";
import { errorMessage } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { mediaService } from "@/services/media.service";
import { toast } from "@/stores/toast.store";
import type { Media } from "@/types/social";

const MAX_MEDIA = 10;

interface MediaUploaderProps {
  media: Media[];
  onChange: (media: Media[]) => void;
}

export function MediaUploader({ media, onChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ name: string; progress: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (files: File[]) => {
    let current = media;
    for (const file of files) {
      if (current.length >= MAX_MEDIA) {
        toast.error(`You can attach up to ${MAX_MEDIA} files.`);
        break;
      }
      const problem = checkFile(file);
      if (problem) {
        toast.error(problem);
        continue;
      }

      setUploading({ name: file.name, progress: 0 });
      try {
        const uploaded = await mediaService.upload(file, (progress) =>
          setUploading({ name: file.name, progress }),
        );
        current = [...current, uploaded];
        onChange(current);
      } catch (error) {
        toast.error(`${file.name}: ${errorMessage(error)}`);
      }
    }
    setUploading(null);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm",
          dragging ? "border-brand-500 bg-brand-50" : "border-slate-200",
        )}
      >
        {uploading ? (
          <span className="flex items-center gap-2 text-slate-600">
            <Spinner className="text-brand-600 size-4" /> Uploading {uploading.name}…{" "}
            {uploading.progress}%
          </span>
        ) : (
          <>
            <p className="text-slate-600">Drag images, GIFs or videos here</p>
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
              Choose files
            </Button>
            <p className="text-xs text-slate-400">
              JPG, PNG, WebP, GIF up to 10 MB · MP4, MOV up to 200 MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={MEDIA_ACCEPT}
          className="sr-only"
          aria-label="Upload media"
          onChange={(event) => {
            void upload(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>

      {media.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {media.map((item) => (
            <li
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
            >
              {item.type === "video" ? (
                <video src={item.url} className="size-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- user uploads on the API host
                <img src={item.url} alt={item.original_name} className="size-full object-cover" />
              )}
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white uppercase">
                {item.type}
              </span>
              <button
                type="button"
                aria-label={`Remove ${item.original_name}`}
                onClick={() => onChange(media.filter((m) => m.id !== item.id))}
                className="absolute top-1 right-1 rounded-full bg-black/60 px-1.5 text-xs text-white opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function checkFile(file: File): string | null {
  const isVideo = file.type.startsWith("video/");
  if (!MEDIA_ACCEPT.split(",").includes(file.type)) return `${file.name}: unsupported file type.`;
  if (isVideo && file.size > VIDEO_MAX_BYTES)
    return `${file.name}: videos may not be larger than 200 MB.`;
  if (!isVideo && file.size > IMAGE_MAX_BYTES)
    return `${file.name}: images may not be larger than 10 MB.`;
  return null;
}
