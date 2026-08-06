"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteLoadButton({ loadId }: { loadId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Remove this cargo request?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/loads/${loadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete load");
      router.refresh();
    } catch (err) {
      console.error("Error deleting load:", err);
      alert("Failed to remove cargo request.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
      title="Remove this cargo request"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isDeleting ? "..." : "Remove"}
    </button>
  );
}
