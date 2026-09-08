"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  LayoutDashboard,
  MessageSquare,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Sales Agent", href: "/chat", icon: MessageSquare },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Viewings", href: "/bookings", icon: CalendarCheck },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-teal-700 shadow-sm">
          <Building2 className="size-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
            CRE AI Pro
          </p>
          <p className="text-[11px] text-sidebar-foreground/60">Commercial Real Estate</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "size-4 transition-colors",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                )}
              />
              {item.name}
              {isActive && (
                <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI agent status */}
      <div className="mx-3 mb-3 rounded-lg bg-sidebar-accent/70 p-3.5 ring-1 ring-sidebar-border">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <p className="text-xs font-medium text-sidebar-accent-foreground">AI Agent online</p>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-sidebar-foreground/60">
          Capturing leads & answering buyers 24/7 on your website.
        </p>
      </div>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] text-sidebar-foreground/40">© 2026 CRE AI Pro</p>
      </div>
    </aside>
  );
}
