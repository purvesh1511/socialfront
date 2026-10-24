import { Fragment } from "react";

const TOKEN = /(https?:\/\/[^\s]+|#[\p{L}\p{N}_]+|@[\w.]+)/gu;

/** Renders post text with hashtags, mentions and links highlighted (no HTML is interpreted). */
export function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN);

  return (
    <p className="text-sm [overflow-wrap:anywhere] whitespace-pre-wrap text-slate-800">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className="text-brand-600">
            {part}
          </span>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </p>
  );
}
