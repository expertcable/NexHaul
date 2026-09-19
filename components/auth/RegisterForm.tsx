"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Role = "SHIPPER" | "TRUCKER";

export function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("SHIPPER");
  const [totalCapacity, setTotalCapacity] = useState("25000");
  const [truckType, setTruckType] = useState("16-Wheel Heavy Trailer (32 MT)");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const payload: any = { name, email, password, role };
    if (phone) payload.phone = phone;
    if (role === "TRUCKER") {
      payload.totalCapacity = Number(totalCapacity) || 25000;
      payload.truckType = truckType;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setIsLoading(false);
      let errorMsg = "Please check your details and try again";
      if (typeof data.error === "string") {
        errorMsg = data.error;
      } else if (typeof data.error === "object" && data.error !== null) {
        const firstError = Object.values(data.error).flat()[0];
        if (typeof firstError === "string") errorMsg = firstError;
      }
      setError(errorMsg);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Account created, but automatic login failed. Please log in manually.");
      onSwitchToLogin();
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs font-semibold text-slate-400">Full name / Business Name</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rajesh Kumar or Speed Logistics"
          className="bg-[#07090E] border-white/10 text-white placeholder-slate-600 focus-visible:ring-cyan-500 rounded-xl shadow-inner"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-semibold text-slate-400">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="driver@national-freight.in"
          className="bg-[#07090E] border-white/10 text-white placeholder-slate-600 focus-visible:ring-cyan-500 rounded-xl shadow-inner"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs font-semibold text-slate-400">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="bg-[#07090E] border-white/10 text-white placeholder-slate-600 focus-visible:ring-cyan-500 rounded-xl shadow-inner"
        />
      </div>

      <div className="space-y-3 pt-2">
        <Label className="text-xs font-semibold text-slate-400">I am registering as...</Label>
        <RadioGroup
          value={role}
          onValueChange={(v) => setRole(v as Role)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SHIPPER" id="shipper" className="text-cyan-400 border-white/20" />
            <Label htmlFor="shipper" className="font-semibold text-sm cursor-pointer text-white">
              Shipper
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="TRUCKER" id="trucker" className="text-cyan-400 border-white/20" />
            <Label htmlFor="trucker" className="font-semibold text-sm cursor-pointer text-white">
              Trucker / Fleet Operator
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Trucker Specifications Section */}
      {role === "TRUCKER" && (
        <div className="p-4 rounded-2xl bg-[#07090E] border border-cyan-500/30 space-y-4 shadow-lg shadow-cyan-950/20 animate-in fade-in-0 duration-200">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <span>⚡ Truck & Fleet Specifications</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCapacity" className="text-xs font-semibold text-slate-300">
              Total Truck Capacity (KG)
            </Label>
            <Input
              id="totalCapacity"
              type="number"
              min="1000"
              max="60000"
              required={role === "TRUCKER"}
              value={totalCapacity}
              onChange={(e) => setTotalCapacity(e.target.value)}
              placeholder="e.g. 25000"
              className="bg-[#0E131F] border-cyan-500/20 text-white font-mono placeholder-slate-600 focus-visible:ring-cyan-500 rounded-xl shadow-inner"
            />
            <p className="text-[11px] text-slate-500">Gross vehicle payload limit in Kilograms.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="truckType" className="text-xs font-semibold text-slate-300">
              Truck Type & Configuration
            </Label>
            <select
              id="truckType"
              value={truckType}
              onChange={(e) => setTruckType(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#0E131F] border border-cyan-500/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium cursor-pointer shadow-inner"
            >
              <option value="16-Wheel Heavy Trailer (32 MT)" className="bg-[#0E131F] text-white">16-Wheel Heavy Trailer (32 MT)</option>
              <option value="Refrigerated / Cold-Chain Reefer" className="bg-[#0E131F] text-white">Refrigerated / Cold-Chain Reefer</option>
              <option value="Flatbed Heavy Hauler (35 MT)" className="bg-[#0E131F] text-white">Flatbed Heavy Hauler (35 MT)</option>
              <option value="Dry Van / Closed Container (20 MT)" className="bg-[#0E131F] text-white">Dry Van / Closed Container (20 MT)</option>
              <option value="Multi-Axle Open Body (25 MT)" className="bg-[#0E131F] text-white">Multi-Axle Open Body (25 MT)</option>
              <option value="Liquid Tanker (28 MT)" className="bg-[#0E131F] text-white">Liquid Tanker (28 MT)</option>
            </select>
          </div>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl mt-2">{error}</p>}
      <Button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20 hover:brightness-110 mt-4 transition-all" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className="underline font-bold text-cyan-400 hover:text-cyan-300">
          Log in
        </button>
      </p>
    </form>
  );
}
