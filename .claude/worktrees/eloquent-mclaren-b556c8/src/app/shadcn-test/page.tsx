"use client";

// ⚠️ THROWAWAY TEST PAGE — DELETE BEFORE MERGE (Sprint 1 shadcn verification only).
// Purpose: confirm the shadcn CLI-installed Button renders and that toggling the
// `dark` class on <html> visibly changes its appearance (acceptance criteria P1.3).

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ShadcnTestPage() {
  const [dark, setDark] = useState(false);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6 p-10">
      <h1 className="text-2xl font-bold">shadcn/ui — dark-mode verification</h1>
      <p className="text-muted-foreground">
        Current mode: <strong>{dark ? "dark" : "light"}</strong>
      </p>

      <div className="flex flex-wrap gap-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>

      <Button onClick={toggleDark} variant="outline">
        Toggle dark class on &lt;html&gt;
      </Button>
    </div>
  );
}
