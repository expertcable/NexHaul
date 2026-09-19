"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompleteRouteButtonProps {
  routeId: string;
}

export function CompleteRouteButton({ routeId }: CompleteRouteButtonProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (!confirm("Are you sure you want to mark this trip as complete? It will be archived.")) return;

    setIsCompleting(true);
    try {
      const res = await fetch(`/api/journeys/${routeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!res.ok) {
        throw new Error("Failed to complete route");
      }

      router.refresh();
    } catch (error) {
      console.error("Error completing route:", error);
      alert("Failed to complete route. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isCompleting}
      onClick={handleComplete}
      className="h-8 px-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center justify-center transition-colors ml-2 border border-cyan-500/30 shadow-sm"
      title="Complete Trip"
    >
      {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
      <span className="text-xs font-bold font-sans">Complete</span>
    </Button>
  );
}
