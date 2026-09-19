"use client";

import Link from "next/link";
import { NexHaulLogo } from "@/components/ui/nexhaul-logo";
import { Sparkles, Truck, Package, ArrowRight } from "lucide-react";
import { AuthContainer } from "@/components/auth/AuthContainer";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-transparent text-slate-200 font-sans selection:bg-cyan-500/30">
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4 sm:gap-6 z-10">
        {/* Responsive Logo */}
        <div className="flex flex-col items-center pointer-events-none">
          <img 
            src="/nexhaul-logo.png" 
            alt="NexHaul Logo" 
            className="w-44 sm:w-56 md:w-64 max-w-full h-auto object-contain drop-shadow-2xl opacity-90"
          />
        </div>

        {/* Credentials Login / Register Container */}
        <div className="w-full">
          <AuthContainer />
        </div>
      </div>
    </main>
  );
}
