"use client";

import { useState } from "react";
import { Prisma } from "@prisma/client";
import { RequestActions } from "@/components/dashboard/RequestActions";

type MatchWithRelations = Prisma.MatchGetPayload<{
  include: { load: { include: { shipper: true } }; journey: true };
}>;

interface TruckerRequestsTabsProps {
  pendingMatches: MatchWithRelations[];
  acceptedMatches: MatchWithRelations[];
  rejectedMatches: MatchWithRelations[];
}

export function TruckerRequestsTabs({ pendingMatches, acceptedMatches, rejectedMatches }: TruckerRequestsTabsProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected">("pending");

  const matchesToDisplay = activeTab === "pending" ? pendingMatches : activeTab === "accepted" ? acceptedMatches : rejectedMatches;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-6 border-b border-white/10 px-6 bg-amber-500/[0.02]">
        <button
          onClick={() => setActiveTab("pending")}
          className={`py-4 font-semibold text-sm transition-colors relative ${
            activeTab === "pending" ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Pending ({pendingMatches.length})
          {activeTab === "pending" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("accepted")}
          className={`py-4 font-semibold text-sm transition-colors relative ${
            activeTab === "accepted" ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Accepted ({acceptedMatches.length})
          {activeTab === "accepted" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`py-4 font-semibold text-sm transition-colors relative ${
            activeTab === "rejected" ? "text-red-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Rejected ({rejectedMatches.length})
          {activeTab === "rejected" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-400 rounded-t-full" />
          )}
        </button>
      </div>

      <div className="p-6 bg-[#0a1528]">
        {matchesToDisplay.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center text-zinc-500">
            <p className="text-base font-semibold text-zinc-300">No {activeTab} shipper requests.</p>
            {activeTab === "pending" && (
              <p className="text-sm mt-1 text-zinc-500">When shippers click "Request Truck" on your routes, their cargo bookings appear right here.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchesToDisplay.map((match) => {
              const load = match.load;
              return (
                <div key={match.id} className="rounded-2xl border border-white/10 bg-[#111d33]/80 shadow-md p-5 flex flex-col gap-4 text-zinc-100">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Target Corridor</div>
                      <div className="font-bold text-[14px] leading-tight">
                        {load.originCity} <span className="text-zinc-400 mx-1">&rarr;</span> {load.destCity}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1">Route: {match.journey.id.slice(0, 8)}...</div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full h-fit">
                      ID: {load.id.slice(0, 6)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-3">
                    <div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cargo</div>
                      <div className="font-semibold text-sm">{load.cargoType}</div>
                      <div className="text-[10px] text-zinc-500 truncate" title={load.shipper?.name || "Verified Shipper"}>
                        {load.shipper?.name || "Verified Shipper"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Weight</div>
                      <div className="font-bold text-brand-green text-sm">{Number(load.weightKg).toLocaleString()} kg</div>
                      <div className="text-[10px] text-zinc-500">{(Number(load.weightKg) / 1000).toFixed(1)} MT</div>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-white/10 flex">
                    <RequestActions 
                      matchId={match.id} 
                      currentStatus={match.status} 
                      loadWeight={Number(load.weightKg)} 
                      availableCapacity={Number(match.journey.availableCapacityKg)} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
