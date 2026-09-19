"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Navigation, Truck, Calendar } from "lucide-react";

export function CreateJourneyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Indian logistics trucker route defaults
  const [originCity, setOriginCity] = useState("Pune");
  const [originState, setOriginState] = useState("MH");
  const [destCity, setDestCity] = useState("Bengaluru");
  const [destState, setDestState] = useState("KA");
  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [availableCapacityKg, setAvailableCapacityKg] = useState("32000");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Hardcode PostGIS Indian spatial coordinates (Pune -> Bengaluru)
      const originLat = 18.5204;
      const originLng = 73.8567;
      const destLat = 12.9716;
      const destLng = 77.5946;

      const formattedDate = new Date(departureDate || Date.now()).toISOString();

      const payload = {
        originCity,
        originState,
        destCity,
        destState,
        originCoords: { lat: originLat, lng: originLng },
        destCoords: { lat: destLat, lng: destLng },
        originLat,
        originLng,
        destLat,
        destLng,
        departureDate: formattedDate,
        availableCapacityKg: parseFloat(availableCapacityKg) || 25000,
        truckType: "16-Wheel Heavy Trailer (32 MT)",
        askingPricePerKg: 15.0, // INR rate per kg
      };

      const liveParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : searchParams;
      const url = "/api/journeys";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error: ${res.statusText}`);
      }

      setIsOpen(false);
      setOriginCity("");
      setOriginState("");
      setDestCity("");
      setDestState("");
      setAvailableCapacityKg("");

      router.refresh();
    } catch (err: any) {
      console.error("Failed to post journey:", err);
      setError(err.message || "An unexpected error occurred while posting route");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-xl my-auto rounded-2xl border border-white/[0.08] bg-[#0E131F] p-7 text-white shadow-2xl shadow-black/40">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/15 p-2.5 text-cyan-400 border border-cyan-500/30 shadow-sm">
              <Navigation className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Post Trucker Route (Journey)</h3>
              <p className="text-xs text-zinc-400">Publish active capacity across Indian highway corridors</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-9 w-9 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="originCity" className="text-xs font-semibold text-slate-300">Departure City</Label>
              <Input
                id="originCity"
                required
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                placeholder="e.g. Pune"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl text-sm px-4 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originState" className="text-xs font-semibold text-slate-300">State Code</Label>
              <Input
                id="originState"
                required
                maxLength={4}
                value={originState}
                onChange={(e) => setOriginState(e.target.value.toUpperCase())}
                placeholder="MH"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl font-mono text-center uppercase text-sm shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="destCity" className="text-xs font-semibold text-slate-300">Destination City</Label>
              <Input
                id="destCity"
                required
                value={destCity}
                onChange={(e) => setDestCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl text-sm px-4 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destState" className="text-xs font-semibold text-slate-300">State Code</Label>
              <Input
                id="destState"
                required
                maxLength={4}
                value={destState}
                onChange={(e) => setDestState(e.target.value.toUpperCase())}
                placeholder="KA"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl font-mono text-center uppercase text-sm shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="departureDate" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Departure Date
              </Label>
              <Input
                id="departureDate"
                type="date"
                required
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl text-sm px-4 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableCapacityKg" className="text-xs font-semibold text-slate-300">Available Capacity (KG)</Label>
              <Input
                id="availableCapacityKg"
                type="number"
                min="1"
                required
                value={availableCapacityKg}
                onChange={(e) => setAvailableCapacityKg(e.target.value)}
                placeholder="32000"
                className="bg-[#07090E] border-white/10 text-white focus:ring-cyan-500 h-11 rounded-xl font-mono text-sm px-4 shadow-inner"
              />
            </div>
          </div>

          <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3.5 text-xs text-cyan-300 flex items-center gap-2.5">
            <Truck className="h-5 w-5 text-cyan-400 flex-shrink-0" />
            <span className="leading-relaxed">Route automatically indexed in Indian National Highways spatial index (Pune 18.5204, 73.8567 &rarr; Bengaluru 12.9716, 77.5946).</span>
          </div>

          {error && <p className="text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl h-11 px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-7 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-semibold shadow-lg shadow-cyan-500/20 text-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Confirm & Register Route"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 border border-white/[0.08] transition-all flex items-center justify-center gap-2 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] w-full"
      >
        <Plus className="h-4 w-4 text-white" />
        Post Your Route
      </Button>

      {isOpen && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
