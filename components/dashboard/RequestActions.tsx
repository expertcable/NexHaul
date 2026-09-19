"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { acceptLoad, rejectLoad } from "@/lib/actions/dispatch";

interface RequestActionsProps {
  loadId: string;
  currentStatus: string;
}

export function RequestActions({ loadId, currentStatus }: RequestActionsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"ACCEPT" | "REJECT" | "ARCHIVE" | null>(null);

  if (currentStatus === "ACCEPTED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
        <Check className="h-3.5 w-3.5" /> ACCEPTED & LOCKED
      </span>
    );
  }

  if (currentStatus === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold font-mono">
        <X className="h-3.5 w-3.5" /> REJECTED
      </span>
    );
  }

  const handleAction = async (action: "ACCEPT" | "REJECT" | "ARCHIVE") => {
    setLoadingAction(action);
    try {
      if (action === "ACCEPT") {
        await acceptLoad(loadId);
      } else if (action === "REJECT") {
        await rejectLoad(loadId);
      }
      // router.refresh() is handled by revalidatePath in the server action
    } catch (error: any) {
      console.error("Error processing match action:", error);
      alert(error.message || "Failed to process request. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
      <Button
        size="sm"
        disabled={loadingAction !== null}
        onClick={() => handleAction("ACCEPT")}
        className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-md shadow-cyan-500/20 w-full sm:flex-1 transition-all"
      >
        {loadingAction === "ACCEPT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Accept
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={loadingAction !== null}
        onClick={() => handleAction("REJECT")}
        className="h-8 px-3 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors w-full sm:flex-1"
      >
        {loadingAction === "REJECT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Remove
      </Button>
    </div>
  );
}
