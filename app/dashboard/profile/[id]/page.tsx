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
  Weight
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
            <div className="rounded-3xl border border-white/[0.08] bg-[#0E131F]/80 shadow-2xl backdrop-blur-sm overflow-hidden p-8 flex flex-col md:flex-row items-center gap-8 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full -translate-y-20 translate-x-20" />

              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 border-4 border-[#07090E] shadow-xl z-10 relative">
                <User className="h-16 w-16 text-cyan-400" />
                <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-cyan-500 border-2 border-[#07090E] flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left z-10">
                <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {truckerName}
                </h1>
                <p className="text-slate-400 mt-2 font-mono flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="h-4 w-4 text-cyan-400" /> Registered Operator • {truckerEmail}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-semibold">
                  <Truck className="h-4 w-4 text-cyan-400" /> Heavy Duty 18-Wheeler
                </div>
              </div>
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0E131F] p-6 shadow-lg overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                    <CheckCircle2 className="h-6 w-6 text-cyan-400" />
                  </div>
                  <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Total Trips</span>
                </div>
                <span className="text-5xl font-black text-white font-mono">{totalTrips}</span>
                <p className="text-sm text-slate-400 mt-2 font-medium">Lifetime completed routes</p>
              </div>

              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0E131F] p-6 shadow-lg overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30">
                    <Weight className="h-6 w-6 text-blue-400" />
                  </div>
                  <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">Total Tonnage Hauled</span>
                </div>
                <span className="text-5xl font-black text-white font-mono">{(totalTonnageHauled / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-2xl text-slate-500">MT</span></span>
                <p className="text-sm text-slate-400 mt-2 font-medium">Metric Tons of freight successfully delivered</p>
              </div>
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
