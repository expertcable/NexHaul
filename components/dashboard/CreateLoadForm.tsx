"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, MapPin, Truck, ArrowRight, CheckCircle2 } from "lucide-react";

interface CreateLoadFormProps {
  journey?: {
    id: string;
    originCity: string;
    originState: string;
    destCity: string;
    destState: string;
    departureDate?: string | Date;
    availableCapacityKg?: number;
  };
}

export function CreateLoadForm({ journey }: CreateLoadFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Indian Logistics localization defaults or derived from targeted journey
  const [originCity, setOriginCity] = useState(journey?.originCity || "Mumbai");
  const [originState, setOriginState] = useState(journey?.originState || "MH");
  const [destCity, setDestCity] = useState(journey?.destCity || "Delhi");
  const [destState, setDestState] = useState(journey?.destState || "DL");
  const [cargoType, setCargoType] = useState("Industrial Automotive Parts");
  const [weightKg, setWeightKg] = useState(
    journey?.availableCapacityKg ? String(Math.min(15000, journey.availableCapacityKg)) : "18500"
  );

  const isRequestingJourney = !!journey;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Hardcode PostGIS Indian spatial coordinates (Mumbai -> Delhi)
      const originLat = 19.0760;
      const originLng = 72.8777;
      const destLat = 28.7041;
      const destLng = 77.1025;

      const pickupDate = new Date(Date.now() + 86400000).toISOString();
      const deliveryDeadline = new Date(Date.now() + 86400000 * 4).toISOString();

      const payload = {
        originCity: isRequestingJourney ? journey.originCity : originCity,
        originState: isRequestingJourney ? journey.originState : originState,
        destCity: isRequestingJourney ? journey.destCity : destCity,
        destState: isRequestingJourney ? journey.destState : destState,
        cargoType,
        weightKg: parseFloat(weightKg) || 10000,
        originLat,
        originLng,
        destLat,
        destLng,
        originCoords: { lat: originLat, lng: originLng },
        destCoords: { lat: destLat, lng: destLng },
        budget: 85000.0,
        pickupDate,
        deliveryDeadline,
        description: isRequestingJourney ? `Cargo booked against Truck Route ${journey.id}` : "Continuous-move Indian freight",
        ...(isRequestingJourney ? { journeyId: journey.id } : {}),
      };

      const liveParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : searchParams;
      const roleParam = liveParams.get("mock_role") || liveParams.get("demoRole") || searchParams.get("mock_role") || searchParams.get("demoRole");
      const url = roleParam ? `/api/loads?mock_role=${roleParam}&demoRole=${roleParam}` : "/api/loads";

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
      if (!isRequestingJourney) {
        setOriginCity("");
        setOriginState("");
        setDestCity("");
        setDestState("");
      }
      setCargoType("");
      setWeightKg("");

      router.refresh();
    } catch (err: any) {
      console.error("Failed to create load:", err);
      setError(err.message || "An unexpected error occurred while processing cargo request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-xl my-auto rounded-2xl border border-indigo-500/20 bg-[#0c1219] p-7 text-zinc-100 shadow-2xl shadow-indigo-500/10">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/15 p-2.5 text-indigo-400 border border-indigo-500/30 shadow-sm">
              {isRequestingJourney ? <CheckCircle2 className="h-6 w-6 text-indigo-400" /> : <Truck className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {isRequestingJourney ? "Request Truck Route Capacity" : "Post New PostGIS Load"}
              </h3>
              <p className="text-xs text-zinc-400">
                {isRequestingJourney
                  ? "Submit cargo details for driver approval on this highway route"
                  : "Insert live Indian freight into the spatial database"}
              </p>
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
          {isRequestingJourney ? (
            <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/30 p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Target Highway Corridor Locked
              </span>
              <div className="flex items-center justify-between text-base font-extrabold text-white pt-1">
                <span>{journey.originCity}, <span className="text-zinc-400 text-xs">{journey.originState}</span></span>
                <ArrowRight className="h-4 w-4 text-indigo-400" />
                <span>{journey.destCity}, <span className="text-zinc-400 text-xs">{journey.destState}</span></span>
              </div>
              {journey.availableCapacityKg && (
                <p className="text-xs text-zinc-400">
                  Available Vehicle Capacity: <span className="font-bold text-emerald-400 font-mono">{Number(journey.availableCapacityKg).toLocaleString()} kg</span>
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="originCity" className="text-xs font-semibold text-zinc-300">Origin City</Label>
                  <Input
                    id="originCity"
                    required
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="bg-zinc-950 border-white/15 text-zinc-100 focus:ring-indigo-500 h-11 rounded-xl text-sm px-4 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originState" className="text-xs font-semibold text-zinc-300">State / Region</Label>
                  <Input
                    id="originState"
                    required
                    maxLength={4}
                    value={originState}
                    onChange={(e) => setOriginState(e.target.value.toUpperCase())}
                    placeholder="MH"
                    className="bg-zinc-950 border-white/15 text-zinc-100 focus:ring-indigo-500 h-11 rounded-xl font-mono text-center uppercase text-sm shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="destCity" className="text-xs font-semibold text-zinc-300">Destination City</Label>
                  <Input
                    id="destCity"
                    required
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    placeholder="e.g. Delhi"
                    className="bg-zinc-950 border-white/15 text-zinc-100 focus:ring-indigo-500 h-11 rounded-xl text-sm px-4 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destState" className="text-xs font-semibold text-zinc-300">State / Region</Label>
                  <Input
                    id="destState"
                    required
                    maxLength={4}
                    value={destState}
                    onChange={(e) => setDestState(e.target.value.toUpperCase())}
                    placeholder="DL"
                    className="bg-zinc-950 border-white/15 text-zinc-100 focus:ring-indigo-500 h-11 rounded-xl font-mono text-center uppercase text-sm shadow-inner"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="cargoType" className="text-xs font-semibold text-zinc-300">Cargo Type</Label>
              <Input
                id="cargoType"
                required
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                placeholder="e.g. Auto Parts"
                className="bg-zinc-950 border-white/15 text-zinc-100 focus:ring-indigo-500 h-11 rounded-xl text-sm px-4 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightKg" className="text-xs font-semibold text-zinc-300">Weight (KG)</Label>
              <Input
                id="weightKg"
                type="number"
                min="1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="18500"
                className="bg-zinc-950 border-white/15 text-zinc-100 focus:ring-indigo-500 h-11 rounded-xl font-mono text-sm px-4 shadow-inner"
              />
            </div>
          </div>

          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3.5 text-xs text-indigo-300 flex items-center gap-2.5">
            <MapPin className="h-5 w-5 text-indigo-400 flex-shrink-0" />
            <span className="leading-relaxed">
              {isRequestingJourney
                ? "Submitting will register status as 'PENDING APPROVAL' for the target trucker to review in real time."
                : "Geospatial coordinates automatically mapped to India GIST Point Index (Mumbai 19.0760, 72.8777 -> Delhi 28.7041, 77.1025)."}
            </span>
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
              className="h-11 px-7 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-indigo-500/25 text-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRequestingJourney ? "Submitting Request..." : "Inserting..."}
                </>
              ) : (
                isRequestingJourney ? "Confirm & Request Truck" : "Confirm & Insert Load"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isRequestingJourney) {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
        >
          <span>Request Truck</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>

        {isOpen && typeof document !== "undefined" && createPortal(modalContent, document.body)}
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-10 px-5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 border border-indigo-400/20 transition-all flex items-center gap-2 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="h-4 w-4 text-indigo-200" />
        Post New Load
      </Button>

      {isOpen && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
