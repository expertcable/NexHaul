"use client";

import Link from "next/link";
import { NexHaulLogo } from "@/components/ui/nexhaul-logo";
import { Sparkles, Truck, Package, ArrowRight } from "lucide-react";
import { AuthContainer } from "@/components/auth/AuthContainer";

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black px-4 text-zinc-100 font-sans selection:bg-brand-green/30">
      <div className="w-full max-w-4xl flex flex-col items-center -mt-32 z-10">
        {/* Giant Logo */}
        <div className="flex flex-col items-center z-20 -mb-4 md:-mb-8 lg:-mb-12 pointer-events-none">
          <img 
            src="/nexhaul-logo.png" 
            alt="NexHaul Logo" 
            className="w-96 md:w-[32rem] lg:w-[40rem] h-auto object-contain drop-shadow-2xl opacity-90"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full">
          {/* INSTANT DEMO ACCESS */}
          <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-blue-950/40 via-slate-950 to-black p-8 shadow-[0_0_40px_-15px_rgba(59,130,246,0.3)] relative overflow-hidden h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-yellow-500 font-extrabold text-sm tracking-wide uppercase border-b border-white/10 pb-4">
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              <span className="text-lg">Instant Demo Mode</span>
            </div>
            <p className="text-sm text-zinc-400 mt-4 leading-relaxed font-medium">
              Skip credentials completely and launch right into an automated test session:
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <Link
                href="/api/auth/demo-login?role=SHIPPER"
                className="flex items-center justify-between gap-3 rounded-xl bg-sky-600 border border-sky-400/50 hover:bg-sky-500 p-4 text-sm font-bold text-white shadow-[0_0_20px_-5px_rgba(2,132,199,0.5)] transition-all group"
              >
                <span className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-brand-green" />
                  Shipper Portal
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/api/auth/demo-login?role=TRUCKER"
                className="flex items-center justify-between gap-3 rounded-xl bg-brand-green border border-white/5 hover:bg-brand-green/90 p-4 text-sm font-bold text-white shadow-md transition-all group"
              >
                <span className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-white" />
                  Driver Terminal
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* REGULAR CREDENTIALS LOGIN / REGISTER CARD */}
          <div className="w-full">
            <AuthContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
