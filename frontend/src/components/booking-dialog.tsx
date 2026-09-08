"use client";

import * as React from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";

import { createBooking } from "@/lib/api";
import type { Lead, Property } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { Label, Select, Textarea } from "@/components/ui/form";

export function BookingDialog({
  open,
  onClose,
  property,
  lead,
  conversationId,
  onBooked,
}: {
  open: boolean;
  onClose: () => void;
  property: Property | null;
  lead?: Lead | null;
  conversationId?: string | null;
  onBooked?: (message: string) => void;
}) {
  if (!open || !property) return null;
  return (
    <Dialog open onClose={onClose} className="max-w-md">
      <BookingForm
        key={`${property.id}-${open}`}
        property={property}
        lead={lead}
        conversationId={conversationId}
        onClose={onClose}
        onBooked={onBooked}
      />
    </Dialog>
  );
}

function BookingForm({
  property,
  lead,
  conversationId,
  onClose,
  onBooked,
}: {
  property: Property;
  lead?: Lead | null;
  conversationId?: string | null;
  onClose: () => void;
  onBooked?: (message: string) => void;
}) {
  const [name, setName] = React.useState(lead?.name || "");
  const [email, setEmail] = React.useState(lead?.email || "");
  const [phone, setPhone] = React.useState(lead?.phone || "");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("17:00");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const submit = async () => {
    if (!name.trim() || !date) {
      setError("Please provide your name and a preferred date.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createBooking({
        property_id: property.id,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        scheduled_at: new Date(`${date}T${time}:00`).toISOString(),
        notes: notes.trim() || null,
        lead_id: lead?.id ?? null,
        conversation_id: conversationId ?? null,
      });
      setDone(true);
      onBooked?.(`Viewing scheduled for ${property.title}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule viewing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} className="max-w-md">
      {done ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-primary" />
          <h3 className="mt-3 text-base font-semibold">Viewing booked!</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {property.title}
            <br />
            {new Date(`${date}T${time}`).toLocaleString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {email && (
              <>
                <br />A confirmation email is on its way to {email}.
              </>
            )}
          </p>
          <button
            onClick={onClose}
            className="mt-5 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="size-3.5" /> Schedule Viewing
            </p>
            <h3 className="mt-1 text-base font-semibold">{property.title}</h3>
            <p className="text-xs text-muted-foreground">
              {property.area}, {property.city} ·{" "}
              {property.listing_type === "rent" ? "For Rent" : "For Sale"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="bk-name">Full name *</Label>
              <input
                id="bk-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmed Raza"
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <Label htmlFor="bk-email">Email</Label>
              <input
                id="bk-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <Label htmlFor="bk-phone">Phone</Label>
              <input
                id="bk-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03xx-xxxxxxx"
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <Label htmlFor="bk-date">Date *</Label>
              <input
                id="bk-date"
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <Label htmlFor="bk-time">Time</Label>
              <Select id="bk-time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1">
                {["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="bk-notes">Notes</Label>
              <Textarea
                id="bk-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the agent should know?"
                className="mt-1 min-h-16"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

          <button
            onClick={submit}
            disabled={saving}
            className="mt-5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Booking..." : "Confirm Viewing"}
          </button>
        </>
      )}
    </Dialog>
  );
}
