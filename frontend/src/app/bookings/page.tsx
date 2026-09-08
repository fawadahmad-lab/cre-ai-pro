"use client";

import * as React from "react";
import { CalendarX2, Check, MapPin } from "lucide-react";

import { cancelBooking, getBookings, updateBookingStatus } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Badge, BOOKING_STATUS_TONES } from "@/components/badges";
import { Skeleton } from "@/components/ui/table";

const FILTERS = ["all", "pending", "confirmed", "completed"] as const;

export default function BookingsPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("all");

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setBookings(await getBookings());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered =
    filter === "all"
      ? bookings.filter((b) => b.status !== "cancelled")
      : bookings.filter((b) => b.status === filter);

  const setStatus = async (id: number, status: string) => {
    await updateBookingStatus(id, status);
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Viewings"
        description="Site visits booked through the AI agent and property cards."
      />

      <div className="mb-6 flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-8 rounded-md px-3 text-xs font-medium capitalize transition-all ${
              filter === f
                ? "bg-foreground text-background shadow-sm"
                : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center ring-1 ring-foreground/10">
          <CalendarX2 className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No viewings here</p>
          <p className="mt-1 text-xs text-muted-foreground">
            When a visitor books a site visit via the AI agent it appears here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 shadow-card transition-shadow hover:shadow-lift"
            >
              {/* Date block */}
              <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
                <span className="text-lg font-semibold leading-none tabular text-primary">
                  {new Date(b.scheduled_at).getDate()}
                </span>
                <span className="mt-0.5 text-[10px] font-medium uppercase text-primary/70">
                  {new Date(b.scheduled_at).toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </div>

              <div className="min-w-48 flex-1">
                <p className="text-[13px] font-semibold">{b.property_title || "Property viewing"}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {[b.property_area, b.property_city].filter(Boolean).join(", ") || "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(b.scheduled_at)} · with{" "}
                  <span className="font-medium text-foreground">{b.name}</span>
                  {b.phone && ` · ${b.phone}`}
                  {b.email && ` · ${b.email}`}
                </p>
              </div>

              <Badge tone={BOOKING_STATUS_TONES[b.status] ?? "neutral"}>{b.status}</Badge>

              <div className="flex gap-2">
                {b.status === "pending" && (
                  <button
                    onClick={() => setStatus(b.id, "confirmed")}
                    className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Check className="size-3.5" /> Confirm
                  </button>
                )}
                {b.status === "confirmed" && (
                  <button
                    onClick={() => setStatus(b.id, "completed")}
                    className="h-8 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    Mark Completed
                  </button>
                )}
                {b.status !== "cancelled" && b.status !== "completed" && (
                  <button
                    onClick={async () => {
                      if (confirm("Cancel this viewing?")) {
                        await cancelBooking(b.id);
                        await load();
                      }
                    }}
                    className="h-8 rounded-md border border-destructive/25 px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
