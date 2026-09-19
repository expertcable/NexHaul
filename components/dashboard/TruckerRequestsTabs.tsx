"use client";

import { useState } from "react";

import { RequestActions } from "@/components/dashboard/RequestActions";

type LoadWithShipper = any;

interface TruckerRequestsTabsProps {
  availableLoads: LoadWithShipper[];
  acceptedLoads: LoadWithShipper[];
}

export function TruckerRequestsTabs({ availableLoads, acceptedLoads }: TruckerRequestsTabsProps) {
  const [activeTab, setActiveTab] = useState<"AVAILABLE" | "MY_DISPATCHES">("AVAILABLE");

  return (
    <div className="flex flex-col">
      <div className="flex space-x-2 border-b border-white/10 pb-4 px-6">
        <button
          onClick={() => setActiveTab("AVAILABLE")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "AVAILABLE"
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          Open Broadcasts ({availableLoads.length})
        </button>
        <button
          onClick={() => setActiveTab("MY_DISPATCHES")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "MY_DISPATCHES"
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          My Dispatches ({acceptedLoads.length})
        </button>
      </div>

      <div className="p-6 bg-transparent">
        {activeTab === "AVAILABLE" && (
          <>
            {availableLoads.length === 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#0E131F] p-8 text-center text-slate-400 shadow-md shadow-black/40">
                <p className="text-base font-semibold text-white">No available broadcasts.</p>
                <p className="text-sm mt-1 text-slate-400">Wait for shippers to post new loads.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableLoads.map((load) => (
                  <div key={load.id} className="rounded-xl border border-white/[0.08] bg-[#0E131F] shadow-md shadow-black/40 p-5 flex flex-col gap-4 text-white transition-shadow hover:shadow-cyan-500/10 hover:border-cyan-500/30">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Corridor</div>
                        <div className="font-extrabold text-lg leading-tight text-white">
                          {load.originCity} <span className="text-slate-500 mx-1">&rarr;</span> {load.destCity}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-white/5 border border-white/10 px-2 py-1 rounded-full h-fit">
                        ID: {load.id.slice(0, 6)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-4">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo</div>
                        <div className="font-semibold text-sm text-white">{load.cargoType}</div>
                        <div className="text-xs text-slate-400 truncate" title={load.shipper?.name || "Verified Shipper"}>
                          {load.shipper?.name || "Verified Shipper"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</div>
                        <div className="font-bold text-emerald-400 text-base">{load.weightTons ? `${load.weightTons} MT` : `${Number(load.weightKg).toLocaleString()} kg`}</div>
                        <div className="text-xs text-emerald-400 font-semibold mt-1">
                          {load.priceInr ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(load.priceInr) : 'Negotiable'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/[0.08] flex flex-col w-full">
                      <RequestActions 
                        loadId={load.id}
                        currentStatus={load.status}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "MY_DISPATCHES" && (
          <>
            {acceptedLoads.length === 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#0E131F] p-8 text-center text-slate-400 shadow-md shadow-black/40">
                <p className="text-base font-semibold text-white">No active dispatches.</p>
                <p className="text-sm mt-1 text-slate-400">Accept open broadcasts to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceptedLoads.map((load) => (
                  <div key={load.id} className="rounded-xl border border-white/[0.08] bg-[#0E131F] shadow-md shadow-black/40 p-5 flex flex-col gap-4 text-white">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dispatched Corridor</div>
                        <div className="font-extrabold text-lg leading-tight text-white">
                          {load.originCity} <span className="text-slate-500 mx-1">&rarr;</span> {load.destCity}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        DISPATCHED
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-4">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo</div>
                        <div className="font-semibold text-sm text-white">{load.cargoType}</div>
                        <div className="text-xs text-slate-400 truncate" title={load.shipper?.name || "Verified Shipper"}>
                          {load.shipper?.name || "Verified Shipper"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</div>
                        <div className="font-bold text-emerald-400 text-base">{load.weightTons ? `${load.weightTons} MT` : `${Number(load.weightKg).toLocaleString()} kg`}</div>
                        <div className="text-xs text-emerald-400 font-semibold mt-1">
                          {load.priceInr ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(load.priceInr) : 'Negotiable'}
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
    </div>
  );
}
