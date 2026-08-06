import React from "react";
import Image from "next/image";

interface NexHaulLogoProps {
  size?: "sm" | "md" | "lg" | "nav" | "xl";
  variant?: "shipper" | "trucker" | "default";
  showSubtitle?: boolean;
  subtitle?: string;
  forceDarkText?: boolean;
}

export function NexHaulLogo({
  size = "md",
  variant = "default",
  showSubtitle = false,
  subtitle = "Continuous-Move Freight Network",
  forceDarkText = false,
}: NexHaulLogoProps) {
  const isTrucker = variant === "trucker";
  const isShipper = variant === "shipper";

  // Size configurations for the image
  const sizes = {
    sm: "w-24 h-auto",
    md: "w-32 h-auto",
    lg: "w-40 h-auto",
    nav: "w-44 h-auto",
    xl: "w-48 h-auto md:w-64 lg:w-80",
  }[size];

  // Theme configurations for badges
  const theme = isTrucker
    ? {
      subtitleColor: "text-zinc-400",
      badgeBg: "bg-brand-green/20 text-brand-green border border-brand-green/30 shadow-sm",
    }
    : isShipper
      ? {
        subtitleColor: "text-zinc-400",
        badgeBg: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm",
      }
      : {
        subtitleColor: forceDarkText ? "text-zinc-600" : "text-zinc-400",
        badgeBg: "bg-white/10 text-white border border-white/20",
      };

  return (
    <div className="flex flex-col select-none">
      <div className="flex items-center gap-3">
        {/* LOGO IMAGE */}
        <div className={`relative flex items-center justify-center transition-transform hover:scale-[1.05] duration-300 flex-shrink-0 ${sizes}`}>
          {/* Using img for raw logo loaded directly */}
          <img
            src="/nexhaul-logo.png"
            alt="NexHaul Logo"
            className="w-full h-auto object-contain scale-[1.45] origin-center"
          />
        </div>

        {/* PORTAL BADGE */}
        {variant !== "default" && (
          <div className="flex items-center">
            <span
              className={`inline-flex items-center font-bold tracking-wider uppercase rounded-full ${theme.badgeBg} text-xs px-2.5 py-0.5 font-mono`}
            >
              {isTrucker ? "Driver Terminal" : "Shipper Portal"}
            </span>
          </div>
        )}
      </div>

      {/* SUBTITLE */}
      {showSubtitle && (
        <p className={`mt-1.5 ml-1 text-xs font-medium tracking-wide ${theme.subtitleColor} font-mono flex items-center gap-1.5`}>
          <span className="h-2 w-2 rounded-full bg-brand-green animate-ping" />
          {subtitle}
        </p>
      )}
    </div>
  );
}
