"use client";

import { useState } from "react";
import { Prisma } from "@prisma/client";
import { RequestActions } from "@/components/dashboard/RequestActions";

type LoadWithMatches = Prisma.LoadGetPayload<{
  include: { matches: { include: { journey: true } } };
}>;

interface ShipperRequestsTabsProps {
  pendingLoads: LoadWithMatches[];
  acceptedLoads: LoadWithMatches[];
  rejectedLoads: LoadWithMatches[];
}

export function ShipperRequestsTabs({ pendingLoads, acceptedLoads, rejectedLoads }: ShipperRequestsTabsProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected">("pending");

  const loadsToDisplay = activeTab === "pending" ? pendingLoads : activeTab === "accepted" ? acceptedLoads : rejectedLoads;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 font-semibold text-sm transition-colors relative ${
            activeTab === "pending" ? "text-brand-green" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Pending Requests ({pendingLoads.length})
          {activeTab === "pending" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-green rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("accepted")}
          className={`pb-3 font-semibold text-sm transition-colors relative ${
            activeTab === "accepted" ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Accepted ({acceptedLoads.length})
          {activeTab === "accepted" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`pb-3 font-semibold text-sm transition-colors relative ${
            activeTab === "rejected" ? "text-red-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Rejected ({rejectedLoads.length})
          {activeTab === "rejected" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-400 rounded-t-full" />
          )}
        </button>
      </div>

      {loadsToDisplay.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#111d33]/80 p-8 text-center text-zinc-400">
          No {activeTab} load requests found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadsToDisplay.map((load) => {
            const currentMatch = load.matches[0];
            const matchStatus = currentMatch?.status || load.status;

            let badgeStyles = "bg-zinc-100 text-zinc-800";
            let displayStatus = matchStatus;

            if (matchStatus === "PENDING") {
              badgeStyles = "bg-yellow-100 text-yellow-900";
            } else if (
              matchStatus === "ACCEPTED" ||
              matchStatus === "MATCHED" ||
              load.status === "MATCHED"
            ) {
              badgeStyles = "bg-[#34a853]/20 text-green-900 font-bold";
              displayStatus = "ACCEPTED";
            } else if (
              matchStatus === "REJECTED" ||
              matchStatus === "CANCELLED" ||
              load.status === "CANCELLED"
            ) {
              badgeStyles = "bg-red-50 text-[#D95B61]";
              displayStatus = matchStatus === "REJECTED" ? "REJECTED" : "DECLINED";
            } else if (load.status === "OPEN") {
              badgeStyles = "bg-gray-100 text-gray-800";
              displayStatus = "OPEN";
            }

            return (
              <div
                key={load.id}
                className="rounded-2xl border border-white/10 bg-[#111d33]/80 shadow-md p-6 flex flex-col gap-4 text-zinc-100"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Route
                    </div>
                    <div className="font-bold text-[15px] leading-tight">
                      {load.originCity}{" "}
                      <span className="text-zinc-400 mx-1">&rarr;</span> {load.destCity}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${badgeStyles}`}
                  >
                    {displayStatus}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Cargo Weight
                    </div>
                    <div className="font-semibold text-sm">
                      {Number(load.weightKg).toLocaleString()} kg
                    </div>
                  </div>
                  {currentMatch && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Target Route
                      </div>
                      <div className="font-mono text-sm text-zinc-400">
                        {currentMatch.journey.id.slice(0, 8)}...
                      </div>
                    </div>
                  )}
                </div>
                {activeTab === "pending" && currentMatch?.proposedBy === "TRUCKER" && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                    <div className="text-xs text-amber-400 font-semibold mb-1 text-center">
                      Trucker Offered Their Route
                    </div>
                    <RequestActions 
                      matchId={currentMatch.id} 
                      currentStatus={currentMatch.status}
                      loadWeight={Number(load.weightKg)}
                      availableCapacity={Number(currentMatch.journey.availableCapacityKg)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
