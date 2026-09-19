"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  Sparkles,
  MapPin,
  Calendar,
  Weight,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Zap,
  Loader2,
  Search,
  Filter,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getRecommendedTruckers,
  bookRecommendedTrucker,
} from "@/lib/actions/matching";

interface RecommendedTrucker {
  journeyId: string;
  truckerId: string;
  truckerName: string;
  truckerPhone: string;
  truckerEmail?: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  departureDate: string;
  availableCapacityKg: number;
  truckType: string;
  askingPricePerKg: number | null;
  status: string;
  matchTier: "PERFECT" | "ROUTE_CAPACITY" | "CORRIDOR_NEARBY";
  matchHeadline: string;
  capacityFitPercent: number;
  equipmentReason: string;
  isCompatibleEquipment: boolean;
}

interface RecommendedTruckersSectionProps {
  initialOrigin?: string;
  initialDest?: string;
  initialWeight?: number;
}

export function RecommendedTruckersSection({
  initialOrigin = "Pune",
  initialDest = "Kochi",
  initialWeight = 20000,
}: RecommendedTruckersSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search filter states
  const [originCity, setOriginCity] = useState(initialOrigin);
  const [destCity, setDestCity] = useState(initialDest);
  const [weightKg, setWeightKg] = useState<string>(String(initialWeight));
  const [cargoType, setCargoType] = useState("Industrial Automotive Parts");

  const [truckers, setTruckers] = useState<RecommendedTrucker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrucker, setSelectedTrucker] = useState<RecommendedTrucker | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Fetch recommended truckers on mount and filter changes
  const fetchTruckers = async () => {
    setIsLoading(true);
    try {
      const results = await getRecommendedTruckers({
        originCity: originCity.trim() || undefined,
        destCity: destCity.trim() || undefined,
        weightKg: Number(weightKg) || undefined,
        cargoType: cargoType.trim() || undefined,
      });
      setTruckers(results);
    } catch (err) {
      console.error("Failed to load recommended truckers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTruckers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTruckers();
  };

  const handleBookTruck = async (trucker: RecommendedTrucker) => {
    setIsBooking(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      await bookRecommendedTrucker({
        journeyId: trucker.journeyId,
        loadDetails: {
          originCity: trucker.originCity,
          originState: trucker.originState,
          destCity: trucker.destCity,
          destState: trucker.destState,
          cargoType: cargoType || "General Commercial Freight",
          weightKg: Number(weightKg) || 15000,
          budget: (Number(weightKg) || 15000) * (trucker.askingPricePerKg || 12),
        },
      });

      setBookingSuccess(
        `Successfully booked ${trucker.truckerName}'s truck for ${trucker.originCity} ➔ ${trucker.destCity}!`
      );
      setSelectedTrucker(null);
      fetchTruckers();
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setBookingError(err.message || "Failed to book trucker. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-[#0E131F] shadow-2xl shadow-cyan-950/20 overflow-hidden relative">
      {/* High-Voltage Cyan Top Accent Border Glow */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="p-6 sm:p-8 border-b border-white/[0.08] bg-[#07090E]/60 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400" />
              <span>AI Carrier Matching Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Recommended Truckers</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                {truckers.length} active units
              </span>
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              Real-time capacity match finding verified drivers on your target corridor with available backhaul space.
            </p>
          </div>

          {/* Quick Filter Control */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-wrap items-center gap-3 bg-[#0E131F] p-2.5 rounded-2xl border border-white/[0.08] shadow-inner"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#07090E] border border-white/5">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <input
                type="text"
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                placeholder="Origin (e.g. Pune)"
                className="bg-transparent text-white text-xs sm:text-sm font-medium focus:outline-none w-24 sm:w-28 placeholder-slate-500"
              />
              <span className="text-slate-600 font-bold">➔</span>
              <input
                type="text"
                value={destCity}
                onChange={(e) => setDestCity(e.target.value)}
                placeholder="Dest (e.g. Kochi)"
                className="bg-transparent text-white text-xs sm:text-sm font-medium focus:outline-none w-24 sm:w-28 placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#07090E] border border-white/5">
              <Weight className="h-4 w-4 text-emerald-400" />
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="Weight (kg)"
                className="bg-transparent text-white text-xs sm:text-sm font-medium focus:outline-none w-20 sm:w-24 placeholder-slate-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 font-bold">KG</span>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-500/20"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Match
                </>
              )}
            </Button>
          </form>
        </div>

        {bookingSuccess && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-in fade-in-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{bookingSuccess}</span>
          </div>
        )}

        {bookingError && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5 animate-in fade-in-0">
            <span className="font-semibold">{bookingError}</span>
          </div>
        )}
      </div>

      {/* Recommended Truckers Card Grid */}
      <div className="p-6 sm:p-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm font-medium">Scanning live highway corridors for matching trucks...</p>
          </div>
        ) : truckers.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-white/[0.08] bg-[#07090E]/60 p-8">
            <Truck className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No exact trucker matches found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              No active truck journeys currently match {originCity} ➔ {destCity} with {Number(weightKg).toLocaleString()} kg. Try adjusting your search or post an open broadcast.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {truckers.map((trucker) => {
              const isPerfect = trucker.matchTier === "PERFECT";
              const isCorridor = trucker.matchTier === "ROUTE_CAPACITY";

              return (
                <div
                  key={trucker.journeyId}
                  className={`group relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
                    isPerfect
                      ? "bg-gradient-to-b from-[#0E1726] to-[#07090E] border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10 hover:border-cyan-400 hover:shadow-cyan-400/20"
                      : "bg-[#07090E]/80 border border-white/[0.08] hover:border-white/20 shadow-md"
                  }`}
                >
                  {/* Match Tier Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                        isPerfect
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/20 animate-pulse"
                          : isCorridor
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/5 text-slate-300 border border-white/10"
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      {trucker.matchHeadline}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      ID: {trucker.journeyId.slice(0, 6)}
                    </span>
                  </div>

                  {/* Driver & Equipment Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-500/20">
                          <Truck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-white text-base">
                            <span>{trucker.truckerName}</span>
                            <ShieldCheck className="h-4 w-4 text-cyan-400" />
                          </div>
                          <p className="text-xs text-slate-400 font-medium">
                            {trucker.truckType}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Route Corridor Display */}
                    <div className="p-3.5 rounded-xl bg-[#0E131F] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-sm font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />
                          <span>{trucker.originCity}, <span className="text-xs text-slate-400 font-normal">{trucker.originState}</span></span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-500" />
                        <div className="flex items-center gap-1.5">
                          <span>{trucker.destCity}, <span className="text-xs text-slate-400 font-normal">{trucker.destState}</span></span>
                          <div className="h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>Depart: {new Date(trucker.departureDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                        </div>
                        <div className="text-emerald-400 font-bold font-mono">
                          {trucker.availableCapacityKg.toLocaleString()} kg Free
                        </div>
                      </div>
                    </div>

                    {/* Capacity & Price Metrics */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Equipment Fit
                        </span>
                        <span className="text-xs font-semibold text-slate-200 truncate block" title={trucker.equipmentReason}>
                          {trucker.equipmentReason}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Asking Rate
                        </span>
                        <span className="text-sm font-extrabold text-cyan-400">
                          {trucker.askingPricePerKg ? `₹${trucker.askingPricePerKg}/kg` : "₹14/kg"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center gap-2">
                    <Button
                      onClick={() => handleBookTruck(trucker)}
                      disabled={isBooking}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Securing Vehicle...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Book Truck Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
