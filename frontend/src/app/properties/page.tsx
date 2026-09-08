"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";

import {
  createProperty,
  deleteProperty,
  getProperties,
  updateProperty,
} from "@/lib/api";
import type { Property } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PropertyCard } from "@/components/property-card";
import { BookingDialog } from "@/components/booking-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Label, Select, Textarea } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/table";
import { titleCase } from "@/lib/format";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi"];
const TYPES = ["plot", "house", "apartment", "shop", "office"];

const EMPTY_FORM = {
  title: "",
  property_type: "office",
  city: "Lahore",
  area: "",
  size: "",
  size_unit: "Sqft",
  price: "",
  price_type: "total",
  listing_type: "sale",
  status: "available",
  description: "",
  features: "",
  image_url: "",
};

type FormState = typeof EMPTY_FORM;

export default function PropertiesPage() {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [city, setCity] = React.useState("");
  const [type, setType] = React.useState("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Property | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);

  const [bookTarget, setBookTarget] = React.useState<Property | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await getProperties({ search: search || undefined, city: city || undefined, property_type: type || undefined });
      setProperties(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, city, type]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (p: Property) => {
    setEditing(p);
    setForm({
      title: p.title,
      property_type: p.property_type,
      city: p.city,
      area: p.area,
      size: String(p.size),
      size_unit: p.size_unit,
      price: String(p.price),
      price_type: p.price_type,
      listing_type: p.listing_type,
      status: p.status,
      description: p.description || "",
      features: p.features || "",
      image_url: p.image_url || "",
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.area.trim() || !form.price) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        size: Number(form.size) || 0,
        price: Number(form.price),
        description: form.description || null,
        features: form.features || null,
        image_url: form.image_url || null,
      };
      if (editing) await updateProperty(editing.id, payload);
      else await createProperty(payload);
      setFormOpen(false);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Property) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await deleteProperty(p.id);
    await load();
  };

  const field = (label: string, node: React.ReactNode, span = false) => (
    <div className={span ? "col-span-2" : ""}>
      <Label>{label}</Label>
      <div className="mt-1">{node}</div>
    </div>
  );

  const inputCls =
    "w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Your live commercial inventory — the AI agent only recommends what exists here."
        actions={
          <button
            onClick={openCreate}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <Plus className="size-4" /> Add Property
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
            placeholder="Search title, area or city..."
            className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <Select value={city} onChange={(e) => setCity(e.target.value)} className="h-auto w-36 py-2">
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="h-auto w-36 py-2">
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {titleCase(t)}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center ring-1 ring-foreground/10">
          <p className="text-sm font-medium">No properties found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Adjust your filters or add a new listing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              onEdit={openEdit}
              onDelete={remove}
              onBook={setBookTarget}
            />
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)}>
        <h3 className="mb-5 text-base font-semibold">
          {editing ? "Edit Property" : "Add New Property"}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {field(
            "Title *",
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Corporate Office - Gulberg III"
            />,
            true
          )}
          {field(
            "Type",
            <Select
              value={form.property_type}
              onChange={(e) => setForm({ ...form, property_type: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </Select>
          )}
          {field(
            "City",
            <Select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
          {field(
            "Area *",
            <input
              className={inputCls}
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              placeholder="DHA Phase 6"
            />
          )}
          {field(
            "Size",
            <input
              className={inputCls}
              type="number"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              placeholder="8000"
            />
          )}
          {field(
            "Size unit",
            <Select
              value={form.size_unit}
              onChange={(e) => setForm({ ...form, size_unit: e.target.value })}
            >
              {["Marla", "Kanal", "Sqft", "Sq. Yard"].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </Select>
          )}
          {field(
            "Price (PKR) *",
            <input
              className={inputCls}
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="350000000"
            />
          )}
          {field(
            "Price type",
            <Select
              value={form.price_type}
              onChange={(e) => setForm({ ...form, price_type: e.target.value })}
            >
              <option value="total">Total</option>
              <option value="per_marla">Per Marla</option>
              <option value="per_sqft">Per Sqft</option>
            </Select>
          )}
          {field(
            "Listing",
            <Select
              value={form.listing_type}
              onChange={(e) => setForm({ ...form, listing_type: e.target.value })}
            >
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </Select>
          )}
          {field(
            "Status",
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["available", "reserved", "sold", "rented"].map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </Select>,
            true
          )}
          {field(
            "Features (comma separated)",
            <input
              className={inputCls}
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder="Central AC, Backup Power, Parking"
            />,
            true
          )}
          {field(
            "Description",
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short listing description..."
            />,
            true
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setFormOpen(false)}
            className="h-9 rounded-md border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !form.title.trim() || !form.area.trim() || !form.price}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Property"}
          </button>
        </div>
      </Dialog>

      <BookingDialog
        open={!!bookTarget}
        onClose={() => setBookTarget(null)}
        property={bookTarget}
      />
    </div>
  );
}
