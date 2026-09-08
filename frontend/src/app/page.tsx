"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarCheck,
  Flame,
  MessageSquare,
  Users,
} from "lucide-react";

import { getDashboardStats } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { formatDate, formatDateTime, formatPKR, titleCase } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/badges";
import { ScoreBadge } from "@/components/badges";
import { Skeleton } from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  viewing_scheduled: "Viewing",
  converted: "Converted",
  lost: "Lost",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Loading overview..." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl bg-destructive/10 p-8 text-center ring-1 ring-destructive/20">
        <p className="text-sm font-medium text-destructive">{error || "Something went wrong"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Make sure the backend is running on port 8001.
        </p>
      </div>
    );
  }

  const pipeline = Object.entries(stats.leadsByStatus).filter(([s]) => s !== "lost");
  const maxPipeline = Math.max(1, ...pipeline.map(([, n]) => n));
  const cities = Object.entries(stats.propertiesByCity).sort((a, b) => b[1] - a[1]);
  const maxCity = Math.max(1, ...cities.map(([, n]) => n));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live overview of inventory, leads and AI-driven engagement."
        actions={
          <Link
            href="/chat"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <MessageSquare className="size-4" />
            Try AI Agent
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Listings"
          value={stats.totalProperties}
          sub={`${stats.availableProperties} available now`}
          icon={Building2}
          tone="primary"
        />
        <StatCard
          label="Total Leads"
          value={stats.totalLeads}
          sub={`${stats.hotLeads} hot (score ≥ 60)`}
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Avg. Lead Score"
          value={stats.avgScore}
          sub={`${stats.conversations} conversations held`}
          icon={Flame}
          tone="warning"
        />
        <StatCard
          label="Viewings Booked"
          value={stats.bookings}
          sub={`${stats.pendingBookings} upcoming`}
          icon={CalendarCheck}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Pipeline */}
        <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 shadow-card lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Lead Pipeline</h2>
            <span className="text-xs tabular text-muted-foreground">
              {formatPKR(stats.inventoryValuePkr)} inventory value
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {pipeline.length === 0 && (
              <p className="text-xs text-muted-foreground">No leads yet.</p>
            )}
            {pipeline.map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">
                  {STATUS_LABELS[status] ?? titleCase(status)}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                    style={{ width: `${(count / maxPipeline) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-semibold tabular">{count}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <h2 className="text-sm font-semibold">Inventory by City</h2>
          </div>
          <div className="mt-4 space-y-3">
            {cities.map(([city, count]) => (
              <div key={city} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{city}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500/70 to-indigo-600 transition-all duration-500"
                    style={{ width: `${(count / maxCity) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-semibold tabular">{count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent leads */}
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Latest Leads</h2>
              <Link
                href="/leads"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="mt-4 divide-y">
              {stats.recentLeads.length === 0 && (
                <p className="text-xs text-muted-foreground">No leads captured yet.</p>
              )}
              {stats.recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {lead.name || `Visitor #${lead.id}`}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {[lead.property_type && titleCase(lead.property_type), lead.city]
                        .filter(Boolean)
                        .join(" · ") || "General inquiry"}
                      {" · "}
                      {formatDate(lead.created_at)}
                    </p>
                  </div>
                  <ScoreBadge score={lead.score} />
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming viewings */}
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Upcoming Viewings</h2>
              <Link
                href="/bookings"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                Manage <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="mt-4 divide-y">
              {stats.upcomingBookings.length === 0 && (
                <p className="text-xs text-muted-foreground">Nothing scheduled yet.</p>
              )}
              {stats.upcomingBookings.map((b) => (
                <div key={b.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-medium">{b.property_title}</p>
                    <Badge tone={b.status === "confirmed" ? "success" : "warning"}>{b.status}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {b.name} · {formatDateTime(b.scheduled_at)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
