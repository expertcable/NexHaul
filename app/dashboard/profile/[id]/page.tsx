export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NexHaulLogo } from "@/components/ui/nexhaul-logo";
import { SignOutButton } from "@/components/dashboard/dashboard-buttons";
import {
  MapPin,
  ArrowRight,
  User,
  LayoutDashboard,
  Calendar,
  CheckCircle2,
  Truck,
  Weight,
  Star,
  MessageSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default async function DriverProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  let targetId = resolvedParams.id;
  if (targetId === "me") {
    targetId = session.user.id;
  }

  let truckerName = "Unknown Trucker";
  let truckerEmail = "unknown@nexhaul.in";

  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user || user.role !== "TRUCKER") {
    redirect("/dashboard");
  }
  truckerName = user.name || "Trucker";
  truckerEmail = user.email || "driver@nexhaul.in";

  // Fetch ratings & reviews for this trucker
  const ratingsRaw = await prisma.rating.findMany({
    where: { truckerId: targetId },
    orderBy: { createdAt: "desc" },
    include: {
      shipper: { select: { name: true, email: true } },
      load: { select: { originCity: true, destCity: true, cargoType: true, weightKg: true } },
    },
  });
  const ratings = JSON.parse(JSON.stringify(ratingsRaw));

  const totalReviews = ratings.length;
  const computedAvgRating = totalReviews > 0
    ? Number((ratings.reduce((sum: number, r: any) => sum + r.score, 0) / totalReviews).toFixed(1))
    : (user.averageRating && user.averageRating > 0 ? Number(user.averageRating.toFixed(1)) : 5.0);

  // Fetch completed journeys and their matches
  const completedJourneysRaw = await prisma.journey.findMany({
    where: {
      truckerId: targetId,
      status: "COMPLETED",
    },
    orderBy: { updatedAt: "desc" },
    include: {
      matches: {
        where: { status: "ACCEPTED" },
        include: { load: true },
      },
    },
  });

  const completedJourneys = JSON.parse(JSON.stringify(completedJourneysRaw));

  const totalTrips = completedJourneys.length;
  const totalTonnageHauled = completedJourneys.reduce((total: number, journey: any) => {
    const journeyTonnage = journey.matches.reduce((sum: number, match: any) => sum + Number(match.load.weightKg), 0);
    return total + journeyTonnage;
  }, 0);

  return (
    <div className="flex h-screen bg-[#07090E] text-white overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#07090E]">
        {/* Header */}
        <header className="relative flex flex-shrink-0 items-center justify-between px-8 py-1.5 bg-[#0E131F] border-b border-white/[0.08] backdrop-blur-md shadow-lg z-10">
          
          {/* Techy Grid Design Spanning Navbar */}
          <div className="absolute inset-0 opacity-50 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#22d3ee20_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee20_1px,transparent_1px)] bg-[size:16px_16px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0E131F]/0 to-[#0E131F]/95" />
            <div className="absolute left-10 top-0 bottom-0 w-64 bg-cyan-400/15 blur-3xl" />
            <div className="absolute right-10 top-0 bottom-0 w-64 bg-cyan-400/5 blur-3xl" />
          </div>

          <div className="relative z-10">
            <NexHaulLogo size="nav" variant="trucker" />
          </div>

          <div className="relative z-10 flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30">
                <User className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="font-extrabold text-white text-lg hidden sm:block">{truckerName}</span>
            </div>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-10 space-y-10 pb-24">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Hero & Profile Section */}
            <div className="rounded-3xl border border-cyan-500/20 bg-[#0E131F] shadow-2xl shadow-cyan-950/20 backdrop-blur-sm overflow-hidden p-8 flex flex-col md:flex-row items-center gap-8 relative">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 border-4 border-cyan-500/30 shadow-xl z-10 relative">
                <User className="h-16 w-16 text-cyan-400" />
                <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-cyan-500 border-2 border-[#07090E] flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left z-10 space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {truckerName}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-bold font-mono">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Verified Carrier
                  </span>
                </div>

                <p className="text-slate-400 font-mono text-sm flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="h-4 w-4 text-cyan-400" /> Registered Operator • {truckerEmail}
                </p>

                {/* Truck Configuration & Specs */}
                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#07090E] border border-cyan-500/30 text-xs font-semibold text-slate-200 shadow-inner">
                    <Truck className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{user.truckType || "16-Wheel Heavy Trailer (32 MT)"}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#07090E] border border-emerald-500/30 text-xs font-semibold text-slate-200 shadow-inner">
                    <Weight className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Max Capacity: <strong className="text-emerald-400 font-mono">{user.totalCapacity ? user.totalCapacity.toLocaleString() : "25,000"} kg</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Section: 3-column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Carrier Rating Metric Card */}
              <div className="relative rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-b from-[#0E1726] to-[#0E131F] p-6 shadow-xl shadow-cyan-950/30 overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40">
                      <Star className="h-5 w-5 text-cyan-400 fill-cyan-400" />
                    </div>
                    <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">Carrier Rating</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {totalReviews} Reviews
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                    {computedAvgRating.toFixed(1)}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= Math.round(computedAvgRating)
                              ? "text-cyan-400 fill-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                              : "text-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5">out of 5.0 rating</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">Verified Shipper satisfaction score</p>
              </div>

              {/* Total Trips */}
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0E131F] p-6 shadow-lg overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Trips</span>
                </div>
                <span className="text-4xl sm:text-5xl font-black text-white font-mono">{totalTrips}</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">Lifetime completed routes</p>
              </div>

              {/* Total Tonnage Hauled */}
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0E131F] p-6 shadow-lg overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30">
                    <Weight className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tonnage Hauled</span>
                </div>
                <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                  {(totalTonnageHauled / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-xl text-slate-500">MT</span>
                </span>
                <p className="text-xs text-slate-400 mt-2 font-medium">Metric Tons delivered</p>
              </div>
            </div>

            {/* VERIFIED SHIPPER REVIEWS SECTION */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <Star className="h-6 w-6 text-cyan-400 fill-cyan-400" />
                    <span>Verified Shipper Reviews</span>
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Feedback and ratings submitted by authenticated cargo shippers.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  {totalReviews} Total Reviews
                </span>
              </div>

              {ratings.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-[#0E131F] p-10 text-center text-slate-400 space-y-2">
                  <MessageSquare className="h-10 w-10 mx-auto text-slate-600" />
                  <p className="text-base font-semibold text-white">No reviews logged yet.</p>
                  <p className="text-xs max-w-md mx-auto text-slate-500">
                    Shippers can submit verified ratings upon load dispatch or route completion from their dashboard.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ratings.map((r: any) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-cyan-500/20 bg-[#0E131F] p-5 shadow-lg space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 text-sm">
                            {r.shipper?.name?.[0] || "S"}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white">
                              {r.shipper?.name || "Verified Shipper"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </div>
                        </div>

                        {/* Star Rating Display */}
                        <div className="flex items-center gap-1 bg-[#07090E] px-2.5 py-1 rounded-lg border border-white/5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= r.score
                                  ? "text-cyan-400 fill-cyan-400"
                                  : "text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {r.review && (
                        <p className="text-xs text-slate-300 leading-relaxed bg-[#07090E] p-3 rounded-xl border border-white/5 italic">
                          &ldquo;{r.review}&rdquo;
                        </p>
                      )}

                      {r.load && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
                          <span>Route: <strong className="text-slate-300">{r.load.originCity} ➔ {r.load.destCity}</strong></span>
                          <span>{r.load.cargoType}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History Ledger */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Past Trips <span className="text-sm font-normal font-sans text-slate-500 px-3 py-1 rounded-full bg-white/5 border border-white/10">Historical Ledger</span>
              </h2>

              {completedJourneys.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-600 opacity-50" />
                  <p className="text-lg font-semibold text-slate-300">No completed trips yet.</p>
                  <p className="mt-2 max-w-md mx-auto">Once you complete an active route from your dashboard, it will be permanently archived and displayed here in your ledger.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedJourneys.map((journey: any) => {
                    const journeyTonnage = journey.matches.reduce((sum: number, match: any) => sum + Number(match.load.weightKg), 0);
                    return (
                      <div key={journey.id} className="rounded-2xl border border-white/[0.08] bg-[#0E131F]/60 p-5 hover:bg-[#0E131F] transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -translate-y-16 translate-x-16" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold font-mono tracking-widest">
                            <CheckCircle2 className="h-3 w-3" /> COMPLETED
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {new Date(journey.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 relative z-10">
                          <div className="flex-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Origin</div>
                            <div className="font-bold text-white text-lg">{journey.originCity}</div>
                            <div className="text-sm text-slate-400 font-mono">{journey.originState}</div>
                          </div>

                          <div className="flex-shrink-0 px-2 flex flex-col items-center">
                            <div className="h-0.5 w-12 bg-white/10 relative">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#0E131F] border border-white/10 flex items-center justify-center">
                                <ArrowRight className="h-3 w-3 text-slate-500" />
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 text-right">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Destination</div>
                            <div className="font-bold text-white text-lg">{journey.destCity}</div>
                            <div className="text-sm text-slate-400 font-mono">{journey.destState}</div>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Route ID</div>
                            <div className="text-xs font-mono text-cyan-400/70">{journey.id.slice(0, 8)}...</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Cargo Hauled</div>
                            <div className="text-sm font-bold text-white font-mono">{journeyTonnage.toLocaleString()} kg</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
