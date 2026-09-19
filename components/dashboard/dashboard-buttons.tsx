"use client";

import { signOut } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, RefreshCw, Search } from "lucide-react";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all font-medium flex items-center gap-2 px-4 shadow-sm"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
}

export function TableControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const handleSearch = (term: string) => {
    setSearch(term);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (term) {
        params.set("search", term);
      } else {
        params.delete("search");
      }
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 sm:flex-initial sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          type="text"
          placeholder="Filter routes by city..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 bg-[#07090E] border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 text-sm h-10 rounded-xl shadow-inner"
        />
      </div>

      <Button
        onClick={handleRefresh}
        variant="outline"
        size="icon"
        title="Refresh PostGIS Loads"
        disabled={isPending}
        className="h-10 w-10 border-white/10 bg-[#0E131F] hover:bg-[#07090E] text-slate-300 rounded-xl flex-shrink-0"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin text-cyan-400" : ""}`} />
      </Button>
    </div>
  );
}
