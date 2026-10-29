"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky";

export default function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked: the mailto button next to this still works.
        }
      }}
      className={`inline-flex min-h-14 cursor-pointer items-center gap-2 border-2 px-5 font-mono text-sm uppercase tracking-widest transition-colors duration-200 ${copied ? "border-sky bg-sky text-night" : "border-line text-haze hover:border-haze hover:text-white"} ${focusRing}`}
    >
      <Icon name={copied ? "check" : "copy"} className="size-4" />
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
