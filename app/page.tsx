"use client";

import Link from "next/link";
import { NexHaulLogo } from "@/components/ui/nexhaul-logo";
import { Sparkles, Truck, Package, ArrowRight } from "lucide-react";
import { AuthContainer } from "@/components/auth/AuthContainer";

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-transparent px-4 text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="w-full max-w-4xl flex flex-col items-center -mt-32 z-10">
        {/* Giant Logo */}
        <div className="flex flex-col items-center z-20 -mb-4 md:-mb-8 lg:-mb-12 pointer-events-none">
          <img 
            src="/nexhaul-logo.png" 
            alt="NexHaul Logo" 
            className="w-96 md:w-[32rem] lg:w-[40rem] h-auto object-contain drop-shadow-2xl opacity-90"
          />
        </div>

        <div className="w-full flex justify-center mt-8">
          {/* REGULAR CREDENTIALS LOGIN / REGISTER CARD */}
          <div className="w-full max-w-md">
            <AuthContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
