"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-semibold text-slate-400">Email address</Label>
        <Input
          id="email"
          type="email"
          required
          placeholder="operator@national-freight.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#07090E] border-white/10 text-white placeholder-slate-600 focus-visible:ring-cyan-500 h-11 rounded-xl text-sm px-4 shadow-inner"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs font-semibold text-slate-400">Password</Label>
        <Input
          id="password"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-[#07090E] border-white/10 text-white placeholder-slate-600 focus-visible:ring-cyan-500 h-11 rounded-xl text-sm px-4 shadow-inner"
        />
      </div>
      {error && (
        <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all text-sm"
        disabled={isLoading}
      >
        {isLoading ? "Authenticating..." : "Log in with credentials"}
      </Button>
      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitchToRegister} className="underline font-bold text-cyan-400 hover:text-cyan-300">
          Register
        </button>
      </p>
    </form>
  );
}
