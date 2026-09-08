"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: LucideIcon;
  tone?: "default" | "primary" | "warning" | "info";
}) {
  const tones = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    warning: "bg-[oklch(0.75_0.14_75)]/15 text-[oklch(0.52_0.12_68)]",
    info: "bg-[oklch(0.62_0.13_220)]/10 text-[oklch(0.47_0.11_232)]",
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-card p-5 ring-1 ring-foreground/10 shadow-card transition-all hover:shadow-lift hover:-translate-y-0.5 duration-200">
      <div className="texture-dots pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular tracking-tight">{value}</p>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <div className={cn("rounded-lg p-2", tones[tone])}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}
