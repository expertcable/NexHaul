"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

interface RequestActionsProps {
  matchId: string;
  currentStatus: string;
}

export function RequestActions({ matchId, currentStatus }: RequestActionsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"ACCEPT" | "REJECT" | null>(null);

  if (currentStatus === "ACCEPTED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
        <Check className="h-3.5 w-3.5" /> ACCEPTED &amp; LOCKED
      </span>
    );
  }

  if (currentStatus === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold font-mono">
        <X className="h-3.5 w-3.5" /> REJECTED
      </span>
    );
  }

  const handleAction = async (action: "ACCEPT" | "REJECT") => {
    setLoadingAction(action);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, action }),
      });

      if (!res.ok) {
        throw new Error("Failed to process action");
      }

      router.refresh();
    } catch (error) {
      console.error("Error processing match action:", error);
      alert("Failed to process request. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        size="sm"
        disabled={loadingAction !== null}
        onClick={() => handleAction("ACCEPT")}
        className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20"
      >
        {loadingAction === "ACCEPT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={loadingAction !== null}
        onClick={() => handleAction("REJECT")}
        className="h-8 px-3 rounded-lg border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-xs flex items-center gap-1"
      >
        {loadingAction === "REJECT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Reject
      </Button>
    </div>
  );
}
