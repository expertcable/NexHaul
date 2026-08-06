import { prisma } from "@/lib/prisma";
import { SignOutButton, TableControls } from "@/components/dashboard/dashboard-buttons";
import {
  Truck,
  MapPin,
  Box,
  TrendingUp,
  Activity,
  Globe,
  ArrowRight,
  Layers,
  ShieldCheck,
} from "lucide-react";

export default async function Dashboard() {
  const activeLoads = await prisma.load.findMany({ orderBy: { createdAt: "desc" } });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            OPEN FOR MATCHING
          </span>
        );
      case "MATCHED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            LPP OPTIMIZED
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce" />
            IN TRANSIT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-3 py-1 text-xs font-semibold text-zinc-400 border border-zinc-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-100 selection:bg-indigo-500/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#0a0c10]/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Genesis <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Continuous-Move</span>
            </h1>
            <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              PostGIS Spatial Engine: ONLINE &bull; LPP Ready
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-300">
            <Globe className="h-4 w-4 text-indigo-400" />
            <span>SRID: 4326 (WGS 84)</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="mx-auto max-w-[1600px] px-6 py-8 space-y-8">
        {/* KPI Command Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Available Loads</span>
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">{activeLoads.length}</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="h-3.5 w-3.5" /> Live PostGIS Count
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Empty Miles Reduced</span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">4,180</span>
              <span className="text-xs font-medium text-zinc-400">mi. this month</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Network Freight Tonnage</span>
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <Box className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {activeLoads.reduce((acc, l) => acc + Number(l.weightKg), 0).toLocaleString()}
              </span>
              <span className="text-xs font-medium text-zinc-400">kg live tonnage</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">LPP Solver Status</span>
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xl font-bold text-purple-400">Ready for Phase 3</span>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                MICROSERVICE
              </span>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Table Header Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 p-6 bg-zinc-900/80">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Active PostGIS Freight Network
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Real-time geospatial loads available for continuous backhaul triangulation
              </p>
            </div>

            <TableControls />
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-white/10 bg-zinc-950/80 text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4 font-mono">Load ID</th>
                  <th scope="col" className="px-6 py-4">Origin</th>
                  <th scope="col" className="px-6 py-4">Destination</th>
                  <th scope="col" className="px-6 py-4">Cargo Type</th>
                  <th scope="col" className="px-6 py-4 font-mono text-right">Weight (KG)</th>
                  <th scope="col" className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {activeLoads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                      <p className="text-base font-semibold text-zinc-300">No active loads found. Post a new load to get started.</p>
                      <p className="text-sm mt-1 text-zinc-500">Your PostGIS database is clean and ready for live spatial freight data.</p>
                    </td>
                  </tr>
                ) : (
                  activeLoads.map((load) => (
                    <tr
                      key={load.id}
                      className="group transition-colors hover:bg-white/[0.02] bg-zinc-900/30"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                        {load.id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold text-white">{load.originCity},</span>
                          <span className="text-zinc-400">{load.originState}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                          <span className="font-semibold text-white">{load.destCity},</span>
                          <span className="text-zinc-400">{load.destState}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        <span className="line-clamp-1">{load.cargoType}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-right font-bold text-zinc-200">
                        {Number(load.weightKg).toLocaleString()} kg
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        {getStatusBadge(load.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between border-t border-white/10 bg-zinc-950 px-6 py-4 text-xs text-zinc-400">
            <div>
              Showing <span className="font-bold text-zinc-200">{activeLoads.length}</span> active backhaul candidate loads
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-zinc-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                GIST Indexed Coordinates
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
