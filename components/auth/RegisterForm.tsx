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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      setIsLoading(false);
      setError(
        typeof data.error === "string"
          ? data.error
          : "Please check your details and try again"
      );
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
        <Label htmlFor="name" className="text-xs font-semibold text-zinc-400">Full name</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#020617] border-white/10 text-white placeholder-zinc-600 focus-visible:ring-brand-green rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-semibold text-zinc-400">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#020617] border-white/10 text-white placeholder-zinc-600 focus-visible:ring-brand-green rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs font-semibold text-zinc-400">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-[#020617] border-white/10 text-white placeholder-zinc-600 focus-visible:ring-brand-green rounded-xl"
        />
      </div>
      <div className="space-y-3 pt-2">
        <Label className="text-xs font-semibold text-zinc-400">I am a...</Label>
        <RadioGroup
          value={role}
          onValueChange={(v) => setRole(v as Role)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SHIPPER" id="shipper" className="text-brand-green border-white/20" />
            <Label htmlFor="shipper" className="font-semibold text-sm cursor-pointer">
              Shipper
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="TRUCKER" id="trucker" className="text-brand-green border-white/20" />
            <Label htmlFor="trucker" className="font-semibold text-sm cursor-pointer">
              Trucker
            </Label>
          </div>
        </RadioGroup>
      </div>
      {error && <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl mt-2">{error}</p>}
      <Button type="submit" className="w-full h-11 rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-white font-bold shadow-md mt-4" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
      <p className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className="underline font-bold text-brand-green hover:text-brand-green/80">
          Log in
        </button>
      </p>
    </form>
  );
}
