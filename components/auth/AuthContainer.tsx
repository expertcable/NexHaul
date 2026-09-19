"use client";

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function AuthContainer({ onBack }: { onBack?: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="w-full relative">
      {onBack && (
        <Button 
          variant="ghost" 
          className="absolute -top-12 left-0 text-zinc-400 hover:text-white -ml-4"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to options
        </Button>
      )}
      
      <Card className="border border-white/[0.08] bg-[#0E131F] shadow-md shadow-black/40 text-slate-200 w-full backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            {mode === "login" ? "Sign back in" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs sm:text-sm">
            {mode === "login" 
              ? "Enter your NexHaul operator credentials to access your live terminal & LPP routing hub"
              : "Join NexHaul as a Shipper or Trucker"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
            <LoginForm onSwitchToRegister={() => setMode("register")} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode("login")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
