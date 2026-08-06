import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton, TableControls } from "@/components/dashboard/dashboard-buttons";
import { CreateLoadForm } from "@/components/dashboard/CreateLoadForm";
import { CreateJourneyForm } from "@/components/dashboard/CreateJourneyForm";
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
  User,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Compass,
  Radio,
} from "lucide-react";

export default async function Dashboard() {
  const session = await auth();
  const role = session?.user?.role || "SHIPPER";
  const isShipper = role === "SHIPPER";

  const activeLoads = await prisma.load.findMany({ orderBy: { createdAt: "desc" } });

  const getStatusBadge = (status: string, forTrucker = false) => {
    switch (status) {
      case "OPEN":
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
            forTrucker 
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse" 
              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${forTrucker ? "bg-emerald-400" : "bg-indigo-600"}`} />
            {forTrucker ? "AVAILABLE FOR CLAIM" : "OPEN FOR MATCHING"}
          </span>
        );
      case "MATCHED":
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
            forTrucker
              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${forTrucker ? "bg-cyan-400" : "bg-blue-600"}`} />
            LPP OPTIMIZED
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-semibold shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" />
            IN TRANSIT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 px-3 py-1 text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  // ============================================================================
  // SHIPPER PORTAL (Light, Clean, Minimalist)
  // ============================================================================
  if (isShipper) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-indigo-100 font-sans">
        {/* Top Navigation */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-8 py-4 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md text-white">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                Genesis <span className="font-medium text-indigo-600">Shipper Portal</span>
              </h1>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Indian Logistics Corridor &bull; PostGIS Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-600">
              <User className="h-3.5 w-3.5 text-indigo-600" />
              <span>{session?.user?.name || session?.user?.email || "Shipper Account"}</span>
              <span className="ml-1 rounded bg-indigo-100 text-indigo-700 px-1.5 py-0.5 text-[10px] font-bold uppercase">Shipper</span>
            </div>
            <SignOutButton />
          </div>
        </header>

        {/* Shipper Minimal Workspace */}
        <main className="mx-auto max-w-7xl px-8 py-10 space-y-8">
          {/* Clean Metric Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Freight Loads</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-zinc-900">{activeLoads.length}</span>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Live PostGIS
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Empty Km Reduced</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-indigo-600">0</span>
                <span className="text-xs font-medium text-zinc-500">km this cycle</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Network Tonnage</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-zinc-900">
                  {(activeLoads.reduce((acc, l) => acc + Number(l.weightKg), 0) / 1000).toFixed(1)}
                </span>
                <span className="text-xs font-medium text-zinc-500">Metric Tonnes (MT)</span>
              </div>
            </div>
          </div>

          {/* Minimal Active Loads Table */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-200 p-6 bg-zinc-50/50">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Your Posted Freight Registry
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Manage shipments currently available for Indian continuous-move backhaul
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <TableControls />
                <CreateLoadForm />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-700">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 font-mono">Load ID</th>
                    <th scope="col" className="px-6 py-3.5">Origin (India)</th>
                    <th scope="col" className="px-6 py-3.5">Destination (India)</th>
                    <th scope="col" className="px-6 py-3.5">Cargo Type</th>
                    <th scope="col" className="px-6 py-3.5 font-mono text-right">Weight / Tonnage</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-medium">
                  {activeLoads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-zinc-400">
                        <p className="text-base font-semibold text-zinc-700">No active loads found. Post a new load to get started.</p>
                        <p className="text-sm mt-1 text-zinc-500">Click &quot;Post New Load&quot; to register spatial freight (e.g. Mumbai to Delhi).</p>
                      </td>
                    </tr>
                  ) : (
                    activeLoads.map((load) => (
                      <tr key={load.id} className="transition-colors hover:bg-zinc-50/80">
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-indigo-600">
                          {load.id.slice(0, 10)}...
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-semibold text-zinc-900">{load.originCity},</span>
                            <span className="text-zinc-500 font-mono">{load.originState}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                            <span className="font-semibold text-zinc-900">{load.destCity},</span>
                            <span className="text-zinc-500 font-mono">{load.destState}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-700">
                          <span className="line-clamp-1">{load.cargoType}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-right text-zinc-900 font-semibold">
                          {Number(load.weightKg).toLocaleString()} kg <span className="text-xs text-zinc-400">({(Number(load.weightKg) / 1000).toFixed(1)} MT)</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          {getStatusBadge(load.status, false)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-3.5 text-xs text-zinc-500">
              <div>Showing <span className="font-bold text-zinc-700">{activeLoads.length}</span> active backhaul shipments</div>
              <div>Spatial Metric: <span className="font-semibold text-zinc-700">WGS 84 Point Geometry</span></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // DRIVER TERMINAL (Dark Slate/Gray, High-Tech Logistics, Driver Profile Card)
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#080b10] text-zinc-100 selection:bg-emerald-500/30 font-sans">
      {/* Top Driver Terminal Nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#080b10]/90 px-8 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Genesis <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Driver Terminal</span>
            </h1>
            <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              National Highways Telematics &bull; LPP Solver Sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-emerald-500/20 text-xs text-emerald-300">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Telemetry: ONLINE</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* Main Driver Terminal Workspace */}
      <main className="mx-auto max-w-[1600px] px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* DRIVER PROFILE CARD (Sidebar) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
              
              <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30">
                  {session?.user?.name?.[0]?.toUpperCase() || "D"}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base tracking-tight">{session?.user?.name || "Driver Terminal Operator"}</h3>
                  <p className="text-xs text-zinc-400 font-mono truncate max-w-[180px]">{session?.user?.email || "driver@national-freight.in"}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-zinc-400 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Authorized Role</span>
                  <span className="font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">TRUCKER</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Truck className="h-4 w-4 text-cyan-400" /> Registered Rig</span>
                  <span className="font-semibold text-zinc-200">16-Wheel Heavy (32 MT)</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Compass className="h-4 w-4 text-teal-400" /> Base Corridor</span>
                  <span className="font-semibold text-zinc-200">Mumbai - Delhi NH-48</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-zinc-400">Empty Km Saved</span>
                  <span className="font-extrabold text-cyan-300 text-sm font-mono">0 km</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
                <CreateJourneyForm />
              </div>
            </div>

            {/* Quick Status Notice */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-xs text-emerald-300 leading-relaxed space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Continuous-Move Triangulation
              </p>
              <p className="text-zinc-400">
                When you post your return route (e.g. Pune &rarr; Bengaluru), the Phase 3 Python LPP solver correlates your coordinates with available freight to eliminate empty kilometers.
              </p>
            </div>
          </div>

          {/* AVAILABLE ROUTES TABLE (Main Column) */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-md overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 p-6 bg-zinc-900/80">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Available Indian Routes &amp; Backhaul Loads
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Real-time candidate shipments ready for pickup within your operational radius
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <TableControls />
                  <CreateJourneyForm />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="border-b border-white/10 bg-zinc-950/80 text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-mono">Route / ID</th>
                      <th scope="col" className="px-6 py-4">Pickup Point</th>
                      <th scope="col" className="px-6 py-4">Dropoff Point</th>
                      <th scope="col" className="px-6 py-4">Freight Type</th>
                      <th scope="col" className="px-6 py-4 font-mono text-right">Tonnage / Weight</th>
                      <th scope="col" className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {activeLoads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                          <p className="text-base font-semibold text-zinc-300">No active backhaul loads available right now.</p>
                          <p className="text-sm mt-1 text-zinc-500">Shipper shipments along Indian national highways will appear here instantly when posted.</p>
                        </td>
                      </tr>
                    ) : (
                      activeLoads.map((load) => (
                        <tr
                          key={load.id}
                          className="group transition-colors hover:bg-white/[0.03] bg-zinc-900/20"
                        >
                          <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                            {load.id.slice(0, 10)}...
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                              <span className="font-bold text-white">{load.originCity},</span>
                              <span className="text-zinc-400 font-mono">{load.originState}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                              <span className="font-bold text-white">{load.destCity},</span>
                              <span className="text-zinc-400 font-mono">{load.destState}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-300">
                            <span className="line-clamp-1">{load.cargoType}</span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-mono text-right font-bold text-zinc-100">
                            {Number(load.weightKg).toLocaleString()} kg <span className="text-xs text-zinc-400">({(Number(load.weightKg) / 1000).toFixed(1)} MT)</span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center">
                            {getStatusBadge(load.status, true)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 bg-zinc-950 px-6 py-4 text-xs text-zinc-400">
                <div>
                  Showing <span className="font-bold text-zinc-200">{activeLoads.length}</span> available backhaul candidate routes
                </div>
                <div className="flex items-center gap-4 font-mono">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Indian Expressway Network Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
