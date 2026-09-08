"use client";

import * as React from "react";
import { Mail, Phone, Plus, Search } from "lucide-react";

import { createLead, deleteLead, getLeads, updateLead } from "@/lib/api";
import type { Lead } from "@/lib/types";
import { formatDate, formatPKR, titleCase } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Badge, LEAD_STATUS_TONES, ScoreBadge } from "@/components/badges";
import { Sheet } from "@/components/ui/dialog";
import { Label, Select, Textarea } from "@/components/ui/form";
import { Skeleton, TBody, THead, Table } from "@/components/ui/table";

const STATUSES = ["new", "contacted", "qualified", "viewing_scheduled", "converted", "lost"];
const TYPES = ["plot", "house", "apartment", "shop", "office"];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  city: "",
  property_type: "",
  budget: "",
  status: "new",
  notes: "",
};

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const [selected, setSelected] = React.useState<Lead | null>(null);
  const [detailNotes, setDetailNotes] = React.useState("");
  const [savingNotes, setSavingNotes] = React.useState(false);

  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [savingForm, setSavingForm] = React.useState(false);

  const load = async () => {
    try {
      setError(null);
      setLeads(await getLeads({ search: search || undefined, status_filter: statusFilter || undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const openDetail = (lead: Lead) => {
    setSelected(lead);
    setDetailNotes(lead.notes || "");
  };

  const saveDetail = async (updates: Partial<Lead>) => {
    if (!selected) return;
    const updated = await updateLead(selected.id, updates as never);
    setSelected(updated);
    await load();
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    try {
      await saveDetail({ notes: detailNotes });
    } finally {
      setSavingNotes(false);
    }
  };

  const removeLead = async (lead: Lead) => {
    if (!confirm(`Delete lead ${lead.name || `#${lead.id}`}?`)) return;
    if (selected?.id === lead.id) setSelected(null);
    await deleteLead(lead.id);
    await load();
  };

  const submitNew = async () => {
    if (!form.name.trim()) return;
    setSavingForm(true);
    try {
      await createLead({
        ...form,
        source: "manual",
        budget: form.budget ? Number(form.budget) : null,
        notes: form.notes || null,
      });
      setFormOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create lead");
    } finally {
      setSavingForm(false);
    }
  };

  const inputCls =
    "w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Every inquiry captured automatically by your AI agent — scored and ready to work."
        actions={
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <Plus className="size-4" /> Add Lead
          </button>
        }
      />

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone..."
            className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-auto w-40 py-2"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCase(s.replace("_", " "))}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : leads.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center ring-1 ring-foreground/10">
          <p className="text-sm font-medium">No leads yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Start a conversation with the AI agent — leads are captured automatically.
          </p>
        </div>
      ) : (
        <Table>
          <THead>
            <tr>
              <th>Lead</th>
              <th>Interest</th>
              <th>Budget</th>
              <th>Score</th>
              <th>Status</th>
              <th>Captured</th>
              <th />
            </tr>
          </THead>
          <TBody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => openDetail(lead)}
                className="cursor-pointer transition-colors hover:bg-muted/40"
              >
                <td>
                  <p className="font-medium">{lead.name || `Visitor #${lead.id}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {[lead.email, lead.phone].filter(Boolean).join(" · ") || "No contact yet"}
                  </p>
                </td>
                <td className="text-[13px] text-muted-foreground">
                  {[lead.property_type && titleCase(lead.property_type), lead.city]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="tabular text-[13px] font-medium">
                  {lead.budget ? formatPKR(lead.budget) : "—"}
                </td>
                <td>
                  <ScoreBadge score={lead.score} />
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={lead.status}
                    onChange={(e) => updateLead(lead.id, { status: e.target.value }).then(load)}
                    className="h-auto w-36 py-1.5 text-xs capitalize"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {titleCase(s.replace("_", " "))}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => removeLead(lead)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </TBody>
        </Table>
      )}

      {/* Detail drawer */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title="Lead Details">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold">
                  {selected.name || `Visitor #${selected.id}`}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={LEAD_STATUS_TONES[selected.status] ?? "neutral"}>
                    {titleCase(selected.status.replace("_", " "))}
                  </Badge>
                  <Badge tone="neutral">{selected.source}</Badge>
                </div>
              </div>
              <ScoreBadge score={selected.score} className="px-3 py-1.5 text-sm" />
            </div>

            <div className="space-y-2 rounded-lg bg-muted/50 p-4 ring-1 ring-foreground/5">
              <ContactRow icon={Mail} label={selected.email || "No email captured"} href={selected.email ? `mailto:${selected.email}` : undefined} />
              <ContactRow icon={Phone} label={selected.phone || "No phone captured"} href={selected.phone ? `tel:${selected.phone}` : undefined} />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
              <Detail label="City" value={selected.city || "—"} />
              <Detail label="Property type" value={selected.property_type ? titleCase(selected.property_type) : "—"} />
              <Detail label="Budget" value={selected.budget ? formatPKR(selected.budget) : "—"} />
              <Detail label="Captured" value={formatDate(selected.created_at)} />
            </dl>

            <div>
              <Label>Conversation link</Label>
              {selected.conversation_id ? (
                <a
                  href={`/chat?c=${selected.conversation_id}`}
                  className="mt-1 block truncate rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  {selected.conversation_id}
                </a>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Not linked to a chat.</p>
              )}
            </div>

            <div>
              <Label htmlFor="lead-notes">Notes</Label>
              <Textarea
                id="lead-notes"
                value={detailNotes}
                onChange={(e) => setDetailNotes(e.target.value)}
                className="mt-1"
                placeholder="Call outcomes, preferences, follow-ups..."
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="mt-2 h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>

            <div>
              <Label>Update status</Label>
              <Select
                value={selected.status}
                onChange={(e) => saveDetail({ status: e.target.value })}
                className="mt-1"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s.replace("_", " "))}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </Sheet>

      {/* New lead dialog */}
      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title="Add Lead Manually">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["name", "Full name *", "Ahmed Raza"],
            ["email", "Email", "ahmed@company.com"],
            ["phone", "Phone", "03xx-xxxxxxx"],
            ["city", "City", "Lahore"],
          ].map(([key, label, ph]) => (
            <div key={key} className={key === "name" ? "col-span-2" : ""}>
              <Label>{label}</Label>
              <input
                className={`mt-1 ${inputCls}`}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph}
              />
            </div>
          ))}
          <div>
            <Label>Property type</Label>
            <Select
              value={form.property_type}
              onChange={(e) => setForm({ ...form, property_type: e.target.value })}
              className="mt-1"
            >
              <option value="">Any</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Budget (PKR)</Label>
            <input
              type="number"
              className={`mt-1 ${inputCls}`}
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="35000000"
            />
          </div>
          <div className="col-span-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1"
            >
              {["new", "contacted", "qualified"].map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              className="mt-1"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Source, requirements, context..."
            />
          </div>
        </div>
        <button
          onClick={submitNew}
          disabled={savingForm || !form.name.trim()}
          className="mt-5 h-9 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {savingForm ? "Creating..." : "Create Lead"}
        </button>
      </Sheet>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
}) {
  const content = (
    <>
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </>
  );
  return href ? (
    <a href={href} className="flex items-center gap-2 text-[13px] text-foreground hover:text-primary">
      {content}
    </a>
  ) : (
    <p className="flex items-center gap-2 text-[13px] text-muted-foreground">{content}</p>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
