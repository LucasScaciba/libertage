"use client";

import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  message?: string;
}

export function LoadingIndicator({ message = "Carregando" }: LoadingIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm text-muted-foreground" aria-label={message}>
        {message}
      </span>
    </div>
  );
}
