"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Sparkles,
  MapPin,
  Calendar,
  Weight,
  ArrowRight,
  CheckCircle2,
  Zap,
  Loader2,
  Check,
  ShieldCheck,
  TrendingUp,
  Inbox,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRecommendedLoadsForTrucker } from "@/lib/actions/matching";
import { acceptLoad } from "@/lib/actions/dispatch";

interface RecommendedLoad {
  loadId: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  cargoType: string;
  weightKg: number;
  budget: number | null;
  priceInr: number | null;
  pickupDate: string;
  deliveryDeadline: string;
  shipperName: string;
  matchBadge: string;
  matchTier: "PERFECT" | "ROUTE_CAPACITY" | "CAPACITY_MATCH" | "BROADCAST";
  isPerfectMatch: boolean;
  matchedJourneyId?: string | null;
  matchedTruckType?: string | null;
  equipmentReason?: string;
  fillPercent: number;
}

export function RecommendedLoadsFeed() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [loads, setLoads] = useState<RecommendedLoad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchRecommendedLoads = async () => {
    setIsLoading(true);
    try {
      const data = await getRecommendedLoadsForTrucker();
      setLoads(data);
    } catch (err) {
      console.error("Failed to fetch recommended loads:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendedLoads();
  }, []);

  const handleAcceptLoad = async (loadId: string, corridor: string) => {
    setAcceptingId(loadId);
    setFeedback(null);

    try {
      await acceptLoad(loadId);
      setFeedback({
        type: "success",
        message: `Dispatched & locked load for ${corridor}! Check your 'My Dispatches' tab.`,
      });

      // Optimistically remove from feed
      setLoads((prev) => prev.filter((l) => l.loadId !== loadId));

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to accept load. It may have been claimed.",
      });
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-[#0E131F] shadow-2xl shadow-cyan-950/20 overflow-hidden relative">
      {/* Cyan Top Border Lighting */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="absolute top-0 right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="p-6 sm:p-8 border-b border-white/[0.08] bg-[#07090E]/60 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
              <span>Intelligent Freight Matching</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Recommended Loads Feed</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {loads.length} tailored matches
              </span>
            </h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Automated load recommendations calibrated to your active backhaul routes, capacity limits, and equipment compatibility.
            </p>
          </div>

          <Button
            onClick={fetchRecommendedLoads}
            disabled={isLoading}
            variant="outline"
            className="border-white/10 bg-[#0E131F] hover:bg-white/5 text-slate-300 rounded-xl h-10 px-4 text-xs font-semibold self-start sm:self-auto"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />}
            Refresh Feed
          </Button>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-4 rounded-2xl text-sm flex items-center gap-2.5 animate-in fade-in-0 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            ) : null}
            <span className="font-semibold">{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Feed Card Grid */}
      <div className="p-6 sm:p-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm font-medium">Scanning network freight for your registered routes...</p>
          </div>
        ) : loads.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-white/[0.08] bg-[#07090E]/60 p-8">
            <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No recommended loads at this moment</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Post your returning highway routes using &quot;Post Your Route&quot; below to trigger instant spatial matches when shippers post freight.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loads.map((load) => {
              const isPerfect = load.isPerfectMatch || load.matchTier === "PERFECT";

              return (
                <div
                  key={load.loadId}
                  className={`group relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
                    isPerfect
                      ? "bg-gradient-to-b from-[#0E1726] to-[#07090E] border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10 hover:border-cyan-400 hover:shadow-cyan-400/20"
                      : "bg-[#07090E]/80 border border-white/[0.08] hover:border-white/20 shadow-md"
                  }`}
                >
                  {/* Top Match Criteria Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide ${
                        isPerfect
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/20 animate-pulse"
                          : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {load.matchBadge}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      ID: {load.loadId.slice(0, 6)}
                    </span>
                  </div>

                  {/* Route Corridor Display */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-[#0E131F] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-sm font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />
                          <span>{load.originCity}, <span className="text-xs text-slate-400 font-normal">{load.originState}</span></span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-500" />
                        <div className="flex items-center gap-1.5">
                          <span>{load.destCity}, <span className="text-xs text-slate-400 font-normal">{load.destState}</span></span>
                          <div className="h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>Pickup: {new Date(load.pickupDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                        </div>
                        <div className="text-slate-300 font-medium">
                          Shipper: <span className="text-white font-semibold">{load.shipperName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cargo & Equipment Specifications */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cargo Type</span>
                        <span className="text-xs font-extrabold text-white">{load.cargoType}</span>
                      </div>
                      {load.equipmentReason && (
                        <div className="flex items-center justify-between text-[11px] text-cyan-300/90 font-medium">
                          <span>Equipment Verification:</span>
                          <span className="font-semibold">{load.equipmentReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Metrics Grid: Weight & Budget */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-[#0E131F] border border-white/5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Weight (KG)
                        </span>
                        <span className="text-sm font-extrabold text-emerald-400 font-mono">
                          {load.weightKg.toLocaleString()} kg
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#0E131F] border border-white/5 text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Offering Budget
                        </span>
                        <span className="text-sm font-extrabold text-cyan-400 font-mono">
                          {load.budget ? `₹${load.budget.toLocaleString()}` : "₹85,000"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accept Load Action */}
                  <div className="mt-5 pt-4 border-t border-white/[0.08]">
                    <Button
                      onClick={() => handleAcceptLoad(load.loadId, `${load.originCity} ➔ ${load.destCity}`)}
                      disabled={acceptingId !== null}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {acceptingId === load.loadId ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Locking Load...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Accept Load
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
