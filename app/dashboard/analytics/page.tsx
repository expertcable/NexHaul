export const dynamic = "force-dynamic";
import Link from "next/link";
import { auth } from "@/auth";
import { getMockOrRealSession } from "@/lib/auth-bypass";
import { prisma } from "@/lib/prisma";
import { NexHaulLogo } from "@/components/ui/nexhaul-logo";
import { SignOutButton } from "@/components/dashboard/dashboard-buttons";
import {
  TrendingUp,
  User,
  ArrowLeft,
  BarChart3,
  Truck,
  Package,
  MapPin,
} from "lucide-react";

interface AnalyticsProps {
  searchParams?: Promise<{ demoRole?: string; mock_role?: string }> | { demoRole?: string; mock_role?: string };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsProps) {
  const params = await searchParams;
  const session = await getMockOrRealSession(params);
  const effectiveRole = params?.mock_role?.toUpperCase() || params?.demoRole?.toUpperCase() || session?.user?.role || "SHIPPER";
  const isDemo = !!(params?.mock_role || params?.demoRole);

  let journeyWhere = {};
  let loadWhere = {};
  let matchWhere = {};

  if (!isDemo && session?.user?.id) {
    if (effectiveRole === "SHIPPER") {
      loadWhere = { shipperId: session.user.id };
      matchWhere = { load: { shipperId: session.user.id } };
    } else if (effectiveRole === "TRUCKER") {
      journeyWhere = { truckerId: session.user.id };
      matchWhere = { journey: { truckerId: session.user.id } };
    }
  }

  const totalJourneys = await prisma.journey.count({ where: journeyWhere });
  const totalLoads = await prisma.load.count({ where: loadWhere });
  const totalMatches = await prisma.match.count({ where: matchWhere });
  const acceptedMatches = await prisma.match.count({ where: { ...matchWhere, status: "ACCEPTED" } });
  const pendingMatches = await prisma.match.count({ where: { ...matchWhere, status: "PENDING" } });
  const totalCapacity = await prisma.journey.aggregate({ where: journeyWhere, _sum: { availableCapacityKg: true } });
  const totalWeight = await prisma.load.aggregate({ where: loadWhere, _sum: { weightKg: true } });

  return (
    <div className="flex h-screen bg-[#020617] text-zinc-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#0a1528] to-[#020617]">
        {/* Top Navigation Header */}
        <header className="flex flex-shrink-0 items-center justify-between px-8 py-1.5 bg-[#0a1528]/90 border-b border-white/10 backdrop-blur-md shadow-lg z-10">
          <NexHaulLogo size="nav" forceDarkText={false} />
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-bold text-zinc-400 hover:text-brand-green transition-colors flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 border border-brand-green/30">
                <User className="h-5 w-5 text-brand-green" />
              </div>
              <span className="font-extrabold text-white text-lg hidden sm:block">{session?.user?.name || "NexHaul User"}</span>
            </div>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-10 space-y-10 pb-24">
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-brand-green" />
              Network Analytics
            </h1>
            <p className="text-zinc-400 mt-2 text-lg font-medium">
              Real-time operational metrics across the NexHaul freight matching network.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#0a1528] p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Truck className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Truck Routes</span>
              </div>
              <span className="text-4xl font-extrabold text-white">{totalJourneys}</span>
              <p className="text-sm text-zinc-400 mt-1">Published highway corridors</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1528] p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Loads Posted</span>
              </div>
              <span className="text-4xl font-extrabold text-white">{totalLoads}</span>
              <p className="text-sm text-zinc-400 mt-1">Shipper freight requests</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1528] p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Matches</span>
              </div>
              <span className="text-4xl font-extrabold text-white">{totalMatches}</span>
              <p className="text-sm text-zinc-400 mt-1">LPP-generated route pairings</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1528] p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20">
                  <MapPin className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Accepted Bookings</span>
              </div>
              <span className="text-4xl font-extrabold text-emerald-400">{acceptedMatches}</span>
              <p className="text-sm text-zinc-400 mt-1">Confirmed cargo placements</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1528] p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Package className="h-5 w-5 text-orange-400" />
                </div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending Requests</span>
              </div>
              <span className="text-4xl font-extrabold text-amber-500">{pendingMatches}</span>
              <p className="text-sm text-zinc-400 mt-1">Awaiting trucker approval</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a1528] p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <BarChart3 className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Network Capacity</span>
              </div>
              <span className="text-4xl font-extrabold text-white">
                {((Number(totalCapacity._sum.availableCapacityKg) || 0) / 1000).toFixed(1)}
              </span>
              <p className="text-sm text-zinc-400 mt-1">Metric Tonnes available</p>
            </div>
          </div>

          {/* Summary Row */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1528] p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Freight Volume Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Total Freight Demand</span>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-white">
                    {((Number(totalWeight._sum.weightKg) || 0) / 1000).toFixed(1)} MT
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Total Available Capacity</span>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-white">
                    {((Number(totalCapacity._sum.availableCapacityKg) || 0) / 1000).toFixed(1)} MT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
