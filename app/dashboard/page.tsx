export const dynamic = "force-dynamic";
import Link from "next/link";
import { auth } from "@/auth";
import { getMockOrRealSession } from "@/lib/auth-bypass";
import { prisma } from "@/lib/prisma";
import { NexHaulLogo } from "@/components/ui/nexhaul-logo";
import { SignOutButton, TableControls } from "@/components/dashboard/dashboard-buttons";
import { CreateLoadForm } from "@/components/dashboard/CreateLoadForm";
import { CreateJourneyForm } from "@/components/dashboard/CreateJourneyForm";
import { ClearAllLoadsButton } from "@/components/dashboard/ClearAllLoadsButton";
import { ShipperRequestsTabs } from "@/components/dashboard/ShipperRequestsTabs";
import { TruckerRequestsTabs } from "@/components/dashboard/TruckerRequestsTabs";
import { RequestActions } from "@/components/dashboard/RequestActions";
import { ProposeRouteForm } from "@/components/dashboard/ProposeRouteForm";
import { DeleteRouteButton } from "@/components/dashboard/DeleteRouteButton";
import { DeleteLoadButton } from "@/components/dashboard/DeleteLoadButton";
import { CompleteRouteButton } from "@/components/dashboard/CompleteRouteButton";
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
  const roleParam = params?.mock_role || params?.demoRole;
  const effectiveRole = roleParam?.toUpperCase() || session?.user?.role || "SHIPPER";
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
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-mono shadow-sm ${forTrucker
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
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${forTrucker
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
        availableCapacityKg: { gt: 0 },
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

    const myRequestedLoadsRaw = await prisma.load.findMany({
      where: { shipperId: session?.user?.id },
      orderBy: { createdAt: "desc" },
      include: { matches: { include: { journey: true } } },
    });

    const myRequestedLoads = JSON.parse(JSON.stringify(myRequestedLoadsRaw));

    const pendingLoads: any[] = [];
    const acceptedLoads: any[] = [];
    const rejectedLoads: any[] = [];

    myRequestedLoads.forEach((load) => {
      const matchStatus = load.matches[0]?.status || load.status;
      if (
        matchStatus === "ACCEPTED" ||
        load.status === "MATCHED"
      ) {
        acceptedLoads.push(load);
      } else if (
        matchStatus === "REJECTED" ||
        matchStatus === "CANCELLED" ||
        load.status === "CANCELLED" ||
        load.status === "ARCHIVED"
      ) {
        rejectedLoads.push(load);
      } else {
        pendingLoads.push(load);
      }
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
              <ShipperRequestsTabs pendingLoads={pendingLoads} acceptedLoads={acceptedLoads} rejectedLoads={rejectedLoads} />
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
                  <CreateLoadForm />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="border-b border-white/10 bg-[#0a1528] text-xs font-semibold uppercase text-zinc-500 tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 font-mono">Route ID</th>
                      <th scope="col" className="px-6 py-3.5">Driver</th>
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
                            <Link href={`/dashboard/profile/${j.truckerId}`} className="flex items-center gap-2 hover:bg-white/5 p-1.5 -ml-1.5 rounded-lg transition-colors group/driver">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green/20 border border-brand-green/40">
                                <User className="h-3 w-3 text-brand-green" />
                              </div>
                              <span className="font-semibold text-white group-hover/driver:text-brand-green transition-colors text-sm">
                                {j.trucker?.name || "Driver"}
                              </span>
                            </Link>
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
  let myRoutesRaw = await prisma.journey.findMany({ where: { truckerId: session?.user?.id, status: { not: "COMPLETED" } }, orderBy: { createdAt: "desc" }, include: { matches: true } });
  const myRoutes = JSON.parse(JSON.stringify(myRoutesRaw));
  let incomingRequestsRaw = await prisma.match.findMany({ where: { journey: { truckerId: session?.user?.id } }, orderBy: { createdAt: "desc" }, include: { load: { include: { shipper: true } }, journey: true } });
  const incomingRequests = JSON.parse(JSON.stringify(incomingRequestsRaw));

  let availableLoadsRaw = await prisma.load.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, include: { shipper: true } });
  const availableLoads = JSON.parse(JSON.stringify(availableLoadsRaw));

  const pendingMatches: any[] = [];
  const acceptedMatches: any[] = [];
  const rejectedMatches: any[] = [];

  incomingRequests.forEach((match) => {
    if (match.status === "PENDING") {
      pendingMatches.push(match);
    } else if (match.status === "ACCEPTED") {
      acceptedMatches.push(match);
    } else {
      rejectedMatches.push(match);
    }
  });

  return (
    <div className="flex h-screen bg-[#020617] text-zinc-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#0a1528] to-[#020617]">
        {DemoBanner}
        <header className="relative flex flex-shrink-0 items-center justify-between px-8 py-1.5 bg-[#0a1528]/90 border-b border-cyan-500/30 backdrop-blur-md shadow-lg z-10">
          
          {/* Techy Grid Design Spanning Navbar */}
          <div className="absolute inset-0 opacity-50 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#22d3ee20_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee20_1px,transparent_1px)] bg-[size:16px_16px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a1528]/0 to-[#0a1528]/95" />
            <div className="absolute left-10 top-0 bottom-0 w-64 bg-cyan-400/15 blur-3xl" />
            <div className="absolute right-10 top-0 bottom-0 w-64 bg-cyan-400/5 blur-3xl" />
          </div>

          <div className="relative z-10">
            <NexHaulLogo size="nav" variant="trucker" />
          </div>

          <div className="relative z-10 flex items-center gap-8">
            <Link href={`/dashboard/analytics${roleParam ? `?demoRole=${roleParam}` : ""}`} className="text-sm font-bold text-zinc-400 hover:text-brand-green transition-colors flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Analytics
            </Link>
            <Link href={`/dashboard/profile/me${roleParam ? `?demoRole=${roleParam}` : ""}`} className="text-sm font-bold text-zinc-400 hover:text-brand-green transition-colors flex items-center gap-1.5">
              <User className="h-4 w-4" /> My Profile
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
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Live cargo booking requests from Shippers targeting your active highway routes
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <TableControls />
                </div>
              </div>

              <TruckerRequestsTabs
                pendingMatches={pendingMatches}
                acceptedMatches={acceptedMatches}
                rejectedMatches={rejectedMatches}
              />
            </div>

            {/* TABLE 3: MY ACTIVE TRUCK ROUTES */}
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
                                <div className="flex items-center">
                                  <CompleteRouteButton routeId={route.id} />
                                  <DeleteRouteButton routeId={route.id} />
                                </div>
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

              {/* TABLE 2: AVAILABLE SHIPPER FREIGHT */}
              <div className="rounded-2xl border border-white/10 bg-[#111d33]/80 shadow-xl backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 p-6 bg-white/[0.03]">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      Available Shipper Freight (Open Loads)
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">
                      Live cargo requests from Shippers looking for a trucker
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="border-b border-white/10 bg-[#0a1528] text-xs font-semibold uppercase text-zinc-500 tracking-wider">
                      <tr>
                        <th scope="col" className="px-6 py-4 font-mono">Load ID</th>
                        <th scope="col" className="px-6 py-4">Origin Point</th>
                        <th scope="col" className="px-6 py-4">Destination Point</th>
                        <th scope="col" className="px-6 py-4">Cargo & Weight</th>
                        <th scope="col" className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {availableLoads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-14 text-center text-zinc-500">
                            <p className="text-base font-semibold text-zinc-300">No open freight available right now.</p>
                            <p className="text-sm mt-1 text-zinc-500">Check back later when shippers post new loads.</p>
                          </td>
                        </tr>
                      ) : (
                        availableLoads.map((load: any) => (
                          <tr key={load.id} className="group transition-colors hover:bg-white/[0.04]">
                            <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-brand-green group-hover:text-emerald-300">
                              {load.id.slice(0, 10)}...
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-brand-green flex-shrink-0" />
                                <span className="font-bold text-white">{load.originCity},</span>
                                <span className="text-zinc-400 font-mono">{load.originState}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-brand-green flex-shrink-0" />
                                <span className="font-bold text-white">{load.destCity},</span>
                                <span className="text-zinc-400 font-mono">{load.destState}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="font-bold text-white">{load.cargoType}</div>
                              <div className="text-brand-green font-mono text-sm mt-0.5">{Number(load.weightKg).toLocaleString()} kg</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center">
                              <ProposeRouteForm loadId={load.id} myRoutes={myRoutes} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 bg-[#0a1528] px-6 py-3.5 text-xs text-zinc-500">
                  <div>Showing <span className="font-bold text-zinc-300">{availableLoads.length}</span> open loads</div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
