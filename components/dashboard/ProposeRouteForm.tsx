"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, MapPin, ArrowRight } from "lucide-react";

interface ProposeRouteFormProps {
  loadId: string;
  myRoutes: Array<{
    id: string;
    originCity: string;
    destCity: string;
    availableCapacityKg: number;
  }>;
}

export function ProposeRouteForm({ loadId, myRoutes }: ProposeRouteFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJourneyId, setSelectedJourneyId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedJourneyId) {
      setError("Please select a route to offer.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const mockRole = searchParams.get("mock_role");
      const url = mockRole ? `/api/matches/propose?mock_role=${mockRole}` : `/api/matches/propose`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loadId, journeyId: selectedJourneyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit proposal");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={() => !isSubmitting && setIsOpen(false)}
      />
      
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#0f1a2e] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand-green" />
            Offer Your Route
          </h2>
          <button
            onClick={() => !isSubmitting && setIsOpen(false)}
            className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {myRoutes.length === 0 ? (
            <div className="text-center text-zinc-400 p-4">
              You don't have any active routes. Please post a route first.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">Select Active Route</label>
                <select
                  value={selectedJourneyId}
                  onChange={(e) => {
                    setSelectedJourneyId(e.target.value);
                    setError(null);
                  }}
                  className="w-full h-11 bg-black/20 border border-white/10 rounded-lg px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-green/50 appearance-none"
                >
                  <option value="" className="bg-[#0f1a2e]">-- Select Route --</option>
                  {myRoutes.map((route) => (
                    <option key={route.id} value={route.id} className="bg-[#0f1a2e]">
                      {route.originCity} -> {route.destCity} ({Number(route.availableCapacityKg).toLocaleString()} kg)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 pt-7 text-zinc-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 p-6 bg-black/20">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="hover:bg-white/5 text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || myRoutes.length === 0}
            className="bg-brand-green hover:bg-emerald-500 text-white font-bold shadow-lg shadow-brand-green/20"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Offer
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-brand-green/10 hover:bg-brand-green/20 text-brand-green hover:text-emerald-400 font-bold border border-brand-green/30"
      >
        Offer Route
      </Button>
      {isOpen && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
