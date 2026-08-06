export const dynamic = "force-dynamic";
import Link from "next/link";
import { auth } from "@/auth";
import { getMockOrRealSession } from "@/lib/auth-bypass";
import { prisma } from "@/lib/prisma";
import { NexHaulLogo } from "@/components/ui/nexhaul-logo";
import { SignOutButton, TableControls } from "@/components/dashboard/dashboard-buttons";
import { CreateLoadForm } from "@/components/dashboard/CreateLoadForm";
import { CreateJourneyForm } from "@/components/dashboard/CreateJourneyForm";
import { RequestActions } from "@/components/dashboard/RequestActions";
import { DeleteRouteButton } from "@/components/dashboard/DeleteRouteButton";
import { DeleteLoadButton } from "@/components/dashboard/DeleteLoadButton";
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
  Calendar,
  PackageCheck,
  Inbox,
  Clock,
} from "lucide-react";

interface DashboardProps {
  searchParams?: Promise<{ demoRole?: string; mock_role?: string; search?: string }> | { demoRole?: string; mock_role?: string; search?: string };
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  // Await searchParams for Next.js 15+ compatibility
  const params = await searchParams;
  const session = await getMockOrRealSession(params);
  
  // Override session role if mock_role or demoRole is set in the URL search params
  const effectiveRole = params?.mock_role?.toUpperCase() || params?.demoRole?.toUpperCase() || session?.user?.role || "SHIPPER";
  const isShipper = effectiveRole === "SHIPPER";

  const getStatusBadge = (status: string, matchStatus?: string, forTrucker = false) => {
    if (matchStatus === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-mono shadow-sm bg-amber-500/20 text-amber-500 border border-amber-500/40 animate-pulse">
          <Clock className="h-3.5 w-3.5" />
          PENDING APPROVAL
        </span>
      );
    }

    if (matchStatus === "ACCEPTED" || status === "MATCHED") {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-mono shadow-sm ${
          forTrucker
            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
            : "bg-blue-50 text-blue-700 border border-blue-200"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${forTrucker ? "bg-cyan-400" : "bg-blue-600"}`} />
          LPP OPTIMIZED &amp; LOCKED
        </span>
      );
    }

    if (status === "AVAILABLE" || status === "OPEN") {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
          forTrucker 
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${forTrucker ? "bg-emerald-400" : "bg-emerald-600"}`} />
          {forTrucker ? "OPEN CAPACITY" : "AVAILABLE FOR BOOKING"}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 px-3 py-1 text-xs font-semibold">
        {status}
      </span>
    );
  };

  const DemoBanner = (
    <div className="bg-yellow-400 text-black p-3 flex flex-wrap justify-center items-center gap-6 font-extrabold text-sm z-[100] relative shadow-md">
      <span className="tracking-tight uppercase bg-black text-yellow-400 px-2.5 py-0.5 rounded text-xs font-mono">DEMO MODE ACTIVE</span>
      <Link href="?mock_role=SHIPPER" className="underline hover:text-indigo-900 transition-colors">View as Shipper</Link>
      <Link href="?mock_role=TRUCKER" className="underline hover:text-indigo-900 transition-colors">View as Trucker</Link>
      <Link href="/dashboard" className="underline hover:text-indigo-900 transition-colors text-zinc-800 font-semibold">Clear Demo (Use Real Role)</Link>
    </div>
  );

  // ============================================================================
  // SHIPPER PORTAL (Trucker-First Capacity Network View)
  // ============================================================================
  if (isShipper) {
    const searchQuery = params?.search as string;

    // Fetch available journeys posted by truckers
    const availableJourneys = await prisma.journey.findMany({
      where: {
        status: { in: ["AVAILABLE", "MATCHED"] },
        ...(searchQuery ? {
          OR: [
            { originCity: { contains: searchQuery, mode: "insensitive" } },
            { destCity: { contains: searchQuery, mode: "insensitive" } },
          ]
        } : {})
      },
      orderBy: { createdAt: "desc" },
      include: { trucker: true },
    });

    // Fetch shipper's submitted loads & matches
    const myRequestedLoads = await prisma.load.findMany({
      where: { shipperId: session?.user?.id },
      orderBy: { createdAt: "desc" },
      include: { matches: { include: { journey: true } } },
    });

    const totalTonnage = availableJourneys.reduce((acc, j) => acc + Number(j.availableCapacityKg), 0);

    return (
      <div className="flex h-screen bg-[#020617] text-zinc-100 overflow-hidden font-sans">
        {/* Main Content Canvas */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#0a1528] to-[#020617]">
          {DemoBanner}
          {/* Top Navigation Header */}
          <header className="flex flex-shrink-0 items-center justify-between px-8 py-1.5 bg-[#0a1528]/90 border-b border-brand-green/20 backdrop-blur-md shadow-lg z-10">
            <NexHaulLogo size="nav" variant="shipper" />
            <div className="flex items-center gap-8">
              <Link href="/dashboard/analytics" className="text-sm font-bold text-zinc-400 hover:text-brand-green transition-colors flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> Analytics
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/20 border border-brand-green/40">
                  <User className="h-5 w-5 text-brand-green" />
                </div>
                <span className="font-extrabold text-white text-lg hidden sm:block">{session?.user?.name || "Shipper Portal"}</span>
              </div>
              <SignOutButton />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-8 py-10 space-y-10 pb-24">
          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Available Truck Routes */}
            <div className="relative rounded-2xl border border-brand-green/20 bg-gradient-to-br from-brand-green/10 via-[#111d33] to-[#0f1a2e] p-6 shadow-lg overflow-hidden group hover:shadow-brand-green/10 hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-brand-green/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/20 border border-brand-green/30">
                  <Truck className="h-5 w-5 text-brand-green" />
                </div>
                <span className="text-xs font-bold text-brand-green uppercase tracking-wider">Available Routes</span>
              </div>
              <span className="text-4xl font-extrabold text-white">{availableJourneys.length}</span>
              <p className="text-sm text-zinc-400 mt-1 font-medium">Live highway corridors</p>
            </div>

            {/* Requests Pending */}
            <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#111d33] to-[#0f1a2e] p-6 shadow-lg overflow-hidden group hover:shadow-amber-500/10 hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Requests Pending</span>
              </div>
              <span className="text-4xl font-extrabold text-white">
                {myRequestedLoads.reduce((acc, l) => acc + l.matches.filter(m => m.status === "PENDING").length, 0)}
              </span>
              <p className="text-sm text-zinc-400 mt-1 font-medium">Awaiting trucker response</p>
            </div>

            {/* Loads Submitted */}
            <div className="relative rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-[#111d33] to-[#0f1a2e] p-6 shadow-lg overflow-hidden group hover:shadow-sky-500/10 hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30">
                  <Box className="h-5 w-5 text-sky-400" />
                </div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Loads Submitted</span>
              </div>
              <span className="text-4xl font-extrabold text-white">{myRequestedLoads.length}</span>
              <p className="text-sm text-zinc-400 mt-1 font-medium">Your freight requests</p>
            </div>
          </div>

          {/* MY LOAD REQUESTS SECTION */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              My Load Requests
            </h2>
            
            {myRequestedLoads.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#111d33]/80 p-8 text-center text-zinc-400">
                You haven't submitted any load requests yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRequestedLoads.map((load) => {
                  const currentMatch = load.matches[0];
                  const matchStatus = currentMatch?.status || load.status;
                  
                  let badgeStyles = "bg-zinc-100 text-zinc-800";
                  let displayStatus = matchStatus;
                  
                  if (matchStatus === "PENDING") {
                    badgeStyles = "bg-yellow-100 text-yellow-900";
                  } else if (matchStatus === "ACCEPTED" || matchStatus === "MATCHED" || load.status === "MATCHED") {
                    badgeStyles = "bg-[#34a853]/20 text-green-900 font-bold";
                    displayStatus = "ACCEPTED";
                  } else if (matchStatus === "REJECTED" || matchStatus === "CANCELLED" || load.status === "CANCELLED") {
                    badgeStyles = "bg-red-50 text-[#D95B61]";
                    displayStatus = matchStatus === "REJECTED" ? "REJECTED" : "DECLINED";
                  } else if (load.status === "OPEN") {
                    badgeStyles = "bg-gray-100 text-gray-800";
                    displayStatus = "OPEN";
                  }

                  return (
                    <div key={load.id} className="rounded-2xl bg-white shadow-sm p-6 flex flex-col gap-4 text-zinc-900">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Route</div>
                          <div className="font-bold text-[15px] leading-tight">
                            {load.originCity} <span className="text-zinc-400 mx-1">&rarr;</span> {load.destCity}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${badgeStyles}`}>
                          {displayStatus}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-4">
                        <div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cargo Weight</div>
                          <div className="font-semibold text-sm">{Number(load.weightKg).toLocaleString()} kg</div>
                        </div>
                        {currentMatch && (
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Target Route</div>
                            <div className="font-mono text-sm text-zinc-600">{currentMatch.journey.id.slice(0, 8)}...</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TABLE 1: AVAILABLE TRUCK ROUTES */}
          <div className="rounded-2xl border border-white/10 bg-[#111d33]/80 shadow-xl backdrop-blur-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 p-6 bg-white/[0.03]">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Available Truck Routes
                </h2>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Select a live highway corridor and request to place your freight onto an active vehicle
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* TableControls would go here if needed */}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="border-b border-white/10 bg-[#0a1528] text-xs font-semibold uppercase text-zinc-500 tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 font-mono">Route ID</th>
                    <th scope="col" className="px-6 py-3.5">Origin (India)</th>
                    <th scope="col" className="px-6 py-3.5">Destination</th>
                    <th scope="col" className="px-6 py-3.5">Departure</th>
                    <th scope="col" className="px-6 py-3.5 font-mono text-right">Capacity (kg)</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Book</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {availableJourneys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center text-zinc-500">
                        <p className="text-base font-semibold text-zinc-300">No available truck routes found.</p>
                        <p className="text-sm mt-1 text-zinc-500">Check back when drivers publish their returning journeys.</p>
                      </td>
                    </tr>
                  ) : (
                    availableJourneys.map((j) => (
                      <tr key={j.id} className="group transition-colors hover:bg-white/[0.04]">
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-brand-green">
                          {j.id.slice(0, 10)}...
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin className="h-3.5 w-3.5 text-brand-green flex-shrink-0" />
                            <span className="font-bold text-white">{j.originCity},</span>
                            <span className="text-zinc-400 font-mono">{j.originState}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <ArrowRight className="h-3.5 w-3.5 text-brand-green flex-shrink-0" />
                            <span className="font-bold text-white">{j.destCity},</span>
                            <span className="text-zinc-400 font-mono">{j.destState}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                            <span>{new Date(j.departureDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-right font-bold text-white text-base">
                          {Number(j.availableCapacityKg).toLocaleString()} kg
                          <span className="block text-xs font-normal text-zinc-500">({(Number(j.availableCapacityKg) / 1000).toFixed(1)} MT)</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <CreateLoadForm journey={{ id: j.id, originCity: j.originCity, originState: j.originState, destCity: j.destCity, destState: j.destState, departureDate: j.departureDate, availableCapacityKg: Number(j.availableCapacityKg) }} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-[#0a1528] px-6 py-3.5 text-xs text-zinc-500">
              <div>Showing <span className="font-bold text-zinc-300">{availableJourneys.length}</span> highway routes in Indian logistics corridors</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />Spatial Metric: <span className="font-semibold text-zinc-300">WGS 84 Point Geometry</span></div>
            </div>
          </div>
        </main>
        </div>
      </div>
    );
  }

  // ============================================================================
  // DRIVER TERMINAL
  // ============================================================================
  let myRoutes = await prisma.journey.findMany({ where: { truckerId: session?.user?.id }, orderBy: { createdAt: "desc" }, include: { matches: true } });
  let incomingRequests = await prisma.match.findMany({ where: { journey: { truckerId: session?.user?.id }, status: "PENDING" }, orderBy: { createdAt: "desc" }, include: { load: { include: { shipper: true } }, journey: true } });

  return (
    <div className="flex h-screen bg-[#020617] text-zinc-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#0a1528] to-[#020617]">
        {DemoBanner}
        <header className="flex flex-shrink-0 items-center justify-between px-8 py-1.5 bg-[#0a1528]/90 border-b border-brand-green/20 backdrop-blur-md shadow-lg z-10">
          <NexHaulLogo size="nav" variant="trucker" />
          <div className="flex items-center gap-8">
            <Link href="/dashboard/analytics" className="text-sm font-bold text-zinc-400 hover:text-brand-green transition-colors flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Analytics
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 border border-brand-green/30">
                <Radio className="h-5 w-5 text-brand-green animate-pulse" />
              </div>
              <span className="font-extrabold text-white text-lg hidden sm:block">{session?.user?.name || "Driver"}</span>
            </div>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-10 space-y-10 pb-24">
          <div className="space-y-8">
            {/* TABLE 2: INCOMING SHIPPER REQUESTS (Action Required!) */}
            <div className="rounded-2xl border border-amber-500/20 bg-[#0a1528]/80 shadow-xl backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 p-6 bg-amber-500/[0.05]">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <Inbox className="h-6 w-6 text-amber-400 animate-bounce" />
                    <span>Incoming Shipper Requests</span>
                    {incomingRequests.length > 0 && (
                      <span className="ml-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-extrabold font-mono animate-pulse">
                        {incomingRequests.length} PENDING
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Live cargo booking requests from Shippers targeting your active highway routes
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <TableControls />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="border-b border-white/10 bg-[#020617] text-xs font-semibold uppercase text-zinc-500 tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 font-mono">Request / Load ID</th>
                      <th scope="col" className="px-6 py-3.5">Target Corridor</th>
                      <th scope="col" className="px-6 py-3.5">Cargo &amp; Shipper</th>
                      <th scope="col" className="px-6 py-3.5 font-mono text-right">Weight (kg)</th>
                      <th scope="col" className="px-6 py-3.5 text-center">Action / Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {incomingRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          <p className="text-base font-semibold text-zinc-300">No incoming shipper requests pending review.</p>
                          <p className="text-sm mt-1 text-zinc-500">When shippers click &quot;Request Truck&quot; on your routes, their cargo bookings appear right here.</p>
                        </td>
                      </tr>
                    ) : (
                      incomingRequests.map((match) => {
                        const load = match.load;
                        return (
                          <tr key={match.id} className="transition-colors hover:bg-amber-500/[0.04]">
                            <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-extrabold text-amber-400">
                              {load.id.slice(0, 10)}...
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2 font-bold text-white text-xs">
                                <span>{load.originCity}, {load.originState}</span>
                                <ArrowRight className="h-3.5 w-3.5 text-brand-green" />
                                <span>{load.destCity}, {load.destState}</span>
                              </div>
                              <span className="text-[11px] text-zinc-500 font-mono">Route: {match.journey.id.slice(0, 8)}...</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-zinc-200">{load.cargoType}</div>
                              <div className="text-xs text-zinc-500">Shipper: {load.shipper?.name || "Verified Freight Partner"}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 font-mono text-right font-extrabold text-brand-green text-base">
                              {Number(load.weightKg).toLocaleString()} kg
                              <span className="block text-xs font-normal text-zinc-500">({(Number(load.weightKg) / 1000).toFixed(1)} MT)</span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center">
                              <RequestActions 
                                matchId={match.id} 
                                currentStatus={match.status} 
                                loadWeight={Number(load.weightKg)} 
                                availableCapacity={Number(match.journey.availableCapacityKg)} 
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLE 1: MY ACTIVE TRUCK ROUTES */}
            <div className="rounded-2xl border border-white/10 bg-[#111d33]/80 shadow-xl backdrop-blur-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 p-6 bg-white/[0.03]">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    My Active Routes (Journeys)
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Your published backhaul capacity registered in the continuous-move spatial database
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <CreateJourneyForm />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="border-b border-white/10 bg-[#0a1528] text-xs font-semibold uppercase text-zinc-500 tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-mono">Route ID</th>
                      <th scope="col" className="px-6 py-4">Origin Point</th>
                      <th scope="col" className="px-6 py-4">Destination Point</th>
                      <th scope="col" className="px-6 py-4">Departure Date</th>
                      <th scope="col" className="px-6 py-4 font-mono text-right">Available Capacity</th>
                      <th scope="col" className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {myRoutes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-14 text-center text-zinc-500">
                          <p className="text-base font-semibold text-zinc-300">No truck routes posted yet.</p>
                          <p className="text-sm mt-1 text-zinc-500">Click &quot;Post Your Route&quot; above to register your returning journey and open your truck for booking.</p>
                        </td>
                      </tr>
                    ) : (
                      myRoutes.map((route) => {
                        const hasPending = route.matches?.some(m => m.status === "PENDING");
                        return (
                          <tr key={route.id} className="group transition-colors hover:bg-white/[0.04]">
                            <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-brand-green group-hover:text-emerald-300">
                              {route.id.slice(0, 10)}...
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-brand-green flex-shrink-0" />
                                <span className="font-bold text-white">{route.originCity},</span>
                                <span className="text-zinc-400 font-mono">{route.originState}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-brand-green flex-shrink-0" />
                                <span className="font-bold text-white">{route.destCity},</span>
                                <span className="text-zinc-400 font-mono">{route.destState}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-zinc-300">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-brand-green" />
                                <span className="text-zinc-300">{new Date(route.departureDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 font-mono text-right font-bold text-white text-base">
                              {Number(route.availableCapacityKg).toLocaleString()} kg <span className="text-xs font-normal text-zinc-500">({(Number(route.availableCapacityKg) / 1000).toFixed(1)} MT)</span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex-1 flex justify-center">
                                  {hasPending ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 text-xs font-extrabold font-mono animate-pulse">
                                      BOOKING REQUESTED
                                    </span>
                                  ) : (
                                    getStatusBadge(route.status, undefined, true)
                                  )}
                                </div>
                                <DeleteRouteButton routeId={route.id} />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 bg-[#0a1528] px-6 py-4 text-xs text-zinc-500">
                <div>
                  Showing <span className="font-bold text-zinc-300">{myRoutes.length}</span> published highway corridors
                </div>
                <div className="flex items-center gap-4 font-mono">
                  <span className="inline-flex items-center gap-1.5 text-brand-green">
                    <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
                    Indian Expressway Capacity Online (kg &amp; km)
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
