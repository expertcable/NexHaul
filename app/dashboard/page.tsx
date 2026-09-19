export const dynamic = "force-dynamic";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";
import { NexHaulLogo } from "@/components/ui/nexhaul-logo";


import { SignOutButton, TableControls } from "@/components/dashboard/dashboard-buttons";
import { CreateLoadForm } from "@/components/dashboard/CreateLoadForm";
import { CreateJourneyForm } from "@/components/dashboard/CreateJourneyForm";
import { ShipperRequestsTabs } from "@/components/dashboard/ShipperRequestsTabs";
import { TruckerRequestsTabs } from "@/components/dashboard/TruckerRequestsTabs";
import { RequestActions } from "@/components/dashboard/RequestActions";
import { ProposeRouteForm } from "@/components/dashboard/ProposeRouteForm";
import { DeleteRouteButton } from "@/components/dashboard/DeleteRouteButton";
import { DeleteLoadButton } from "@/components/dashboard/DeleteLoadButton";
import { CompleteRouteButton } from "@/components/dashboard/CompleteRouteButton";
import { RecommendedTruckersSection } from "@/components/dashboard/RecommendedTruckersSection";
import { RecommendedLoadsFeed } from "@/components/dashboard/RecommendedLoadsFeed";
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
  searchParams?: Promise<{ search?: string }> | { search?: string };
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const isShipper = session.user.role === "SHIPPER";

  // ============================================================================
  // SHIPPER PORTAL (Trucker-First Capacity Network View)
  // ============================================================================
  if (isShipper) {
    const params = await searchParams;
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
      where: { shipperId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { carrier: true },
    });

    const myRequestedLoads = JSON.parse(JSON.stringify(myRequestedLoadsRaw));

    const pendingLoads = myRequestedLoads.filter((l: any) => l.status === "PENDING");
    const acceptedLoads = myRequestedLoads.filter((l: any) => l.status === "BOOKED" || l.status === "IN_TRANSIT");
    const rejectedLoads = myRequestedLoads.filter((l: any) => l.status === "CANCELLED");

    const totalTonnage = availableJourneys.reduce((acc, j) => acc + Number(j.availableCapacityKg), 0);

    return (
      <div className="flex h-screen bg-[#07090E] text-white overflow-hidden font-sans">
        {/* Main Content Canvas */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#07090E]">
          {/* Top Navigation Header */}
          <header className="flex flex-shrink-0 items-center justify-between px-8 py-1.5 bg-[#0E131F] border-b border-white/[0.08] shadow-sm z-10">
            <NexHaulLogo size="nav" variant="shipper" />
            <div className="flex items-center gap-8">
              <Link href="/dashboard/analytics" className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> Analytics
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20">
                  <User className="h-5 w-5 text-cyan-400" />
                </div>
                <span className="font-extrabold text-white text-lg hidden sm:block">{session?.user?.name || "Shipper Portal"}</span>
              </div>
              <SignOutButton />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-8 py-10 space-y-10 pb-24">
            {/* HUGE PRIMARY CTA FOR SHIPPER */}
            <div className="bg-[#0E131F] rounded-2xl border border-white/[0.08] shadow-sm p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Need to move freight?</h1>
                <p className="text-slate-400 mt-2 text-lg max-w-xl">Post your load to the network to get matched with truckers, or directly book an available truck below.</p>
              </div>
              <div className="flex-shrink-0 scale-105 sm:scale-125 origin-center md:origin-right transform">
                <CreateLoadForm />
              </div>
            </div>



            {/* RECOMMENDED TRUCKERS MATCHING ENGINE */}
            <RecommendedTruckersSection />

            {/* MY LOAD REQUESTS SECTION */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                My Active Loads
              </h2>
              <ShipperRequestsTabs pendingLoads={pendingLoads} acceptedLoads={acceptedLoads} rejectedLoads={rejectedLoads} />
            </div>

            {/* CARD GRID: AVAILABLE TRUCK ROUTES */}
            <div className="space-y-4 pt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Available Truck Routes
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Browse active trucks on the road looking for freight.
                  </p>
                </div>
              </div>

              {availableJourneys.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] p-14 text-center">
                  <p className="text-base font-semibold text-white">No available truck routes found.</p>
                  <p className="text-sm mt-1 text-slate-400">Check back when drivers publish their returning journeys.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableJourneys.map((j) => (
                    <div key={j.id} className="rounded-2xl border border-white/[0.08] bg-[#0E131F] shadow-sm p-6 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase">Route ID</span>
                          <span className="font-mono text-sm font-bold text-cyan-400">{j.id.slice(0, 10)}...</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#0E131F] px-3 py-1.5 rounded-lg border border-white/[0.08]">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-300">{j.trucker?.name || "Driver"}</span>
                        </div>
                      </div>

                      <div className="py-2 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-xs text-slate-400 mb-1">Origin</div>
                          <div className="font-bold text-white text-lg leading-tight">{j.originCity}</div>
                          <div className="text-sm text-slate-400">{j.originState}</div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-300" />
                        <div className="flex-1 text-right">
                          <div className="text-xs text-slate-400 mb-1">Destination</div>
                          <div className="font-bold text-white text-lg leading-tight">{j.destCity}</div>
                          <div className="text-sm text-slate-400">{j.destState}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Departure</div>
                          <div className="flex items-center gap-1.5 font-medium text-slate-300">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {new Date(j.departureDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400 mb-1">Capacity</div>
                          <div className="font-bold text-emerald-600">
                            {Number(j.availableCapacityKg).toLocaleString()} kg
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 w-full">
                        <CreateLoadForm journey={{ id: j.id, originCity: j.originCity, originState: j.originState, destCity: j.destCity, destState: j.destState, departureDate: j.departureDate, availableCapacityKg: Number(j.availableCapacityKg) }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ============================================================================
  // DRIVER TERMINAL
  // ============================================================================
  const myRoutesRaw = await prisma.journey.findMany({ 
    where: { truckerId: session.user.id, status: { not: "COMPLETED" } }, 
    orderBy: { createdAt: "desc" }, 
    include: { matches: true } 
  });
  const myRoutes: any[] = JSON.parse(JSON.stringify(myRoutesRaw));
  
  const availableLoadsRaw = await prisma.load.findMany({ 
    where: { status: "PENDING" }, 
    orderBy: { createdAt: "desc" }, 
    include: { shipper: true } 
  });
  const availableLoads: any[] = JSON.parse(JSON.stringify(availableLoadsRaw));

  const acceptedLoadsRaw = await prisma.load.findMany({
    where: { carrierId: session.user.id, status: { in: ["BOOKED", "IN_TRANSIT"] } },
    orderBy: { createdAt: "desc" },
    include: { shipper: true }
  });
  const acceptedLoads: any[] = JSON.parse(JSON.stringify(acceptedLoadsRaw));

  return (
    <div className="flex h-screen bg-[#07090E] text-white overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#07090E]">
        <header className="relative flex flex-shrink-0 items-center justify-between px-8 py-1.5 bg-[#0E131F] border-b border-white/[0.08] shadow-sm z-10">
          
          {/* Subtle Grid Design Spanning Navbar */}
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:16px_16px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/95" />
          </div>

          <div className="relative z-10">
            <NexHaulLogo size="nav" variant="trucker" />
          </div>

          <div className="relative z-10 flex items-center gap-8">
            <Link href={`/dashboard/analytics`} className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Analytics
            </Link>
            <Link href={`/dashboard/profile/me`} className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              <User className="h-4 w-4" /> My Profile
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <Radio className="h-5 w-5 text-cyan-400 animate-pulse" />
              </div>
              <span className="font-extrabold text-white text-lg hidden sm:block">{session?.user?.name || "Driver"}</span>
            </div>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-10 space-y-10 pb-24">
          <div className="space-y-8">

            {/* RECOMMENDED LOADS INTELLIGENT FEED */}
            <RecommendedLoadsFeed />

            {/* OPEN BROADCASTS & DISPATCHES */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] shadow-sm overflow-hidden mt-10">
              <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/[0.08] p-6 bg-[#0E131F]/50">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <Inbox className="h-6 w-6 text-cyan-500" />
                    <span>Load Management</span>
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Accept open broadcasts to lock them in and view your active dispatches.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <TableControls />
                </div>
              </div>

              <TruckerRequestsTabs
                availableLoads={availableLoads}
                acceptedLoads={acceptedLoads}
              />
            </div>

            <details className="group [&_summary::-webkit-details-marker]:hidden border-t border-white/[0.08] pt-8 mt-12">
              <summary className="flex items-center gap-2 cursor-pointer text-slate-400 font-semibold text-sm hover:text-white transition-colors">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-white/5 group-open:rotate-90 transition-transform">
                  <ArrowRight className="h-4 w-4" />
                </span>
                Manage Routes & Search Freight
              </summary>
              <div className="mt-8 space-y-12">
                {/* CARD GRID: MY ACTIVE TRUCK ROUTES */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    My Active Routes (Journeys)
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Your published backhaul capacity registered in the continuous-move spatial database
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <CreateJourneyForm />
                </div>
              </div>

              {myRoutes.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] p-14 text-center text-slate-400 shadow-sm">
                  <p className="text-base font-semibold text-white">No truck routes posted yet.</p>
                  <p className="text-sm mt-1 text-slate-400">Click &quot;Post Your Route&quot; above to register your returning journey and open your truck for booking.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myRoutes.map((route) => {
                    return (
                      <div key={route.id} className="rounded-2xl border border-white/[0.08] bg-[#0E131F] shadow-sm p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Route ID</span>
                            <span className="font-mono text-sm font-bold text-cyan-400">{route.id.slice(0, 8)}...</span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm bg-white/5 text-slate-300 border border-white/10">
                            {route.status}
                          </span>
                        </div>

                        <div className="py-2 flex items-center gap-4">
                          <div className="flex-1">
                            <div className="text-xs text-slate-400 mb-1">Origin</div>
                            <div className="font-bold text-white text-lg leading-tight">{route.originCity}</div>
                            <div className="text-sm text-slate-400">{route.originState}</div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-slate-300" />
                          <div className="flex-1 text-right">
                            <div className="text-xs text-slate-400 mb-1">Destination</div>
                            <div className="font-bold text-white text-lg leading-tight">{route.destCity}</div>
                            <div className="text-sm text-slate-400">{route.destState}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Departure</div>
                            <div className="flex items-center gap-1.5 font-medium text-slate-300">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {new Date(route.departureDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-400 mb-1">Available Capacity</div>
                            <div className="font-bold text-emerald-600">
                              {Number(route.availableCapacityKg).toLocaleString()} kg
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2 w-full justify-end border-t border-white/[0.08] pt-4">
                          <CompleteRouteButton routeId={route.id} />
                          <DeleteRouteButton routeId={route.id} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CARD GRID: AVAILABLE SHIPPER FREIGHT */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Available Shipper Freight (Open Loads)
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Live cargo requests from Shippers looking for a trucker
                  </p>
                </div>
              </div>

              {availableLoads.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] p-14 text-center text-slate-400 shadow-sm">
                  <p className="text-base font-semibold text-white">No open freight available right now.</p>
                  <p className="text-sm mt-1 text-slate-400">Check back later when shippers post new loads.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableLoads.map((load: any) => (
                    <div key={load.id} className="rounded-2xl border border-white/[0.08] bg-[#0E131F] shadow-sm p-6 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase">Load ID</span>
                          <span className="font-mono text-sm font-bold text-cyan-400">{load.id.slice(0, 10)}...</span>
                        </div>
                      </div>

                      <div className="py-2 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-xs text-slate-400 mb-1">Origin</div>
                          <div className="font-bold text-white text-lg leading-tight">{load.originCity}</div>
                          <div className="text-sm text-slate-400">{load.originState}</div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-300" />
                        <div className="flex-1 text-right">
                          <div className="text-xs text-slate-400 mb-1">Destination</div>
                          <div className="font-bold text-white text-lg leading-tight">{load.destCity}</div>
                          <div className="text-sm text-slate-400">{load.destState}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Cargo</div>
                          <div className="font-medium text-white">{load.cargoType}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400 mb-1">Weight</div>
                          <div className="font-bold text-emerald-600">
                            {Number(load.weightKg).toLocaleString()} kg
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 w-full pt-4 border-t border-white/[0.08]">
                        <ProposeRouteForm loadId={load.id} myRoutes={myRoutes} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </details>
      </div>
        </main>
      </div>
    </div>
  );
}
