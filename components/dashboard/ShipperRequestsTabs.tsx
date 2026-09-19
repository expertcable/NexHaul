"use client";

import { useState } from "react";

import { RequestActions } from "@/components/dashboard/RequestActions";

type LoadWithRelations = any;

interface ShipperRequestsTabsProps {
  pendingLoads: LoadWithRelations[];
  acceptedLoads: LoadWithRelations[];
  rejectedLoads: LoadWithRelations[];
}

export function ShipperRequestsTabs({ pendingLoads, acceptedLoads }: ShipperRequestsTabsProps) {
  const [activeTab, setActiveTab] = useState<"BROADCASTS" | "DISPATCH">("BROADCASTS");

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("BROADCASTS")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "BROADCASTS"
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          Open Broadcasts ({pendingLoads.length})
        </button>
        <button
          onClick={() => setActiveTab("DISPATCH")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "DISPATCH"
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          Active Dispatch ({acceptedLoads.length})
          {acceptedLoads.length > 0 && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </div>

      {activeTab === "BROADCASTS" && (
        <>
          {pendingLoads.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] shadow-md shadow-black/40 p-8 text-center text-slate-400">
              No open broadcasts currently running on the network.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingLoads.map((load) => (
                <div
                  key={load.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0E131F] shadow-md shadow-black/40 p-6 flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Route
                      </div>
                      <div className="font-extrabold text-lg leading-tight text-white">
                        {load.originCity}{" "}
                        <span className="text-slate-500 mx-1">&rarr;</span> {load.destCity}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-white/5 text-slate-300 border border-white/10">
                      PENDING
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-white/[0.08] pt-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Cargo Weight
                      </div>
                      <div className="font-semibold text-sm text-white">
                        {load.weightTons ? `${load.weightTons} MT` : `${Number(load.weightKg).toLocaleString()} kg`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Target Rate
                      </div>
                      <div className="font-semibold text-sm text-emerald-400">
                        {load.priceInr ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(load.priceInr) : 'Negotiable'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "DISPATCH" && (
        <>
          {acceptedLoads.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E131F] shadow-md shadow-black/40 p-8 text-center text-slate-400">
              No active dispatches.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {acceptedLoads.map((load) => (
                <div
                  key={load.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0E131F] shadow-md shadow-black/40 p-6 flex flex-col gap-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  
                  <div className="flex justify-between items-start gap-2 relative">
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Dispatched Route
                      </div>
                      <div className="font-extrabold text-lg leading-tight text-white">
                        {load.originCity}{" "}
                        <span className="text-slate-500 mx-1">&rarr;</span> {load.destCity}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      DISPATCHED
                    </span>
                  </div>

                  <div className="mt-2 flex flex-col gap-3 border-t border-white/[0.08] pt-4 relative">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Carrier Info
                        </div>
                        <div className="font-semibold text-sm text-cyan-400 mt-0.5">
                          {load.carrier?.name || 'Unknown Carrier'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {load.carrier?.phone || 'No Contact Info'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Vehicle Assigned
                        </div>
                        <div className="font-semibold text-sm text-white mt-0.5">
                          {load.vehicleType || 'Not Specified'}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-[#07090E] rounded-lg p-3 border border-white/5 mt-2">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargo</div>
                        <div className="text-sm font-semibold text-slate-200">{load.weightTons ? `${load.weightTons} MT` : `${Number(load.weightKg).toLocaleString()} kg`} - {load.cargoType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agreed Rate</div>
                        <div className="text-lg font-bold text-emerald-400">
                          {load.priceInr ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(load.priceInr) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
