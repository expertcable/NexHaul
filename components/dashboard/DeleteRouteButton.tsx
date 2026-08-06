"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteRouteButtonProps {
  routeId: string;
}

export function DeleteRouteButton({ routeId }: DeleteRouteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this route? This action cannot be undone.")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/journeys/${routeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete route");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Failed to delete route. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isDeleting}
      onClick={handleDelete}
      className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors ml-2"
      title="Delete Route"
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}
