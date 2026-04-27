"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<DeferredInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as DeferredInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  if (dismissed || !installEvent) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-medium text-slate-500 ring-1 ring-slate-200/70">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Instalável na tela inicial
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        await installEvent.prompt();
        const result = await installEvent.userChoice;
        if (result.outcome !== "accepted") {
          setDismissed(true);
        }
      }}
    >
      <Download className="h-4 w-4" />
      Adicionar à tela inicial
    </Button>
  );
}
