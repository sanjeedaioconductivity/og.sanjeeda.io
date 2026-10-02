"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

/**
 * A small message in the bottom-left corner, under the portal's sidebar —
 * "«Codex» moved to the recycle bin" and the like. It says its piece and
 * fades out on its own rather than taking a strip of the page.
 */
export default function PortalToast({
  message,
  tone = "success",
  onDismiss,
  timeout = 5000,
}: {
  message: string;
  tone?: "success" | "error";
  onDismiss: () => void;
  timeout?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, timeout);
    return () => clearTimeout(timer);
  }, [message, timeout, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-[70] max-w-[15rem] animate-[fadeInUp_0.25s_ease-out]"
    >
      <div
        className={`flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold shadow-lg ring-1 ${
          tone === "error"
            ? "bg-rose-600 text-white ring-rose-700"
            : "bg-[#0b2f5b] text-white ring-[#0b2f5b]"
        }`}
      >
        {tone === "success" && (
          <CheckCircle2 size={12} className="mt-px shrink-0 text-emerald-300" />
        )}
        <p className="min-w-0 flex-1 leading-snug">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-white/70 transition hover:text-white"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
