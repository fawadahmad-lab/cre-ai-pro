"use client";

import { Building2, Home, LandPlot, Store, Briefcase, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Property } from "@/lib/types";
import { formatPKR, titleCase } from "@/lib/format";
import { Badge, PROPERTY_STATUS_TONES } from "@/components/badges";

const TYPE_ICONS: Record<string, LucideIcon> = {
  office: Briefcase,
  shop: Store,
  house: Home,
  apartment: Building2,
  plot: LandPlot,
};

const GRADIENTS = [
  "from-emerald-500/80 to-teal-700/90",
  "from-sky-500/70 to-indigo-700/85",
  "from-amber-400/75 to-orange-600/85",
  "from-rose-400/70 to-pink-700/85",
];

export function PropertyCard({
  property,
  onEdit,
  onDelete,
  onBook,
  compact = false,
}: {
  property: Property;
  onEdit?: (p: Property) => void;
  onDelete?: (p: Property) => void;
  onBook?: (p: Property) => void;
  compact?: boolean;
}) {
  const Icon = TYPE_ICONS[property.property_type] ?? LandPlot;
  const gradient = GRADIENTS[property.id % GRADIENTS.length];
  const features = (property.features || "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, compact ? 0 : 3);

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 shadow-card transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5">
      {/* Visual header */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient}`}>
        {property.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.image_url}
            alt={property.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <Icon className="size-14 text-white" strokeWidth={1.2} />
          </div>
        )}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium capitalize text-white backdrop-blur-sm">
            <Icon className="size-3" />
            {titleCase(property.property_type)}
          </span>
          <Badge tone={PROPERTY_STATUS_TONES[property.status] ?? "neutral"} className="bg-white/95 ring-0 backdrop-blur-sm">
            {property.status}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-sm font-semibold leading-snug line-clamp-1">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {property.area}, {property.city}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold tabular tracking-tight text-primary">
              {formatPKR(property.price, property.price_type)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {property.listing_type === "rent" ? "For Rent" : "For Sale"} ·{" "}
              {property.size.toLocaleString()} {property.size_unit}
            </p>
          </div>
        </div>

        {!compact && features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {features.map((f) => (
              <span
                key={f}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {!compact && onBook && (
          <button
            onClick={() => onBook(property)}
            className="mt-auto inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Schedule Viewing
          </button>
        )}

        {(onEdit || onDelete) && (
          <div className="mt-auto flex gap-2 border-t pt-3">
            {onEdit && (
              <button
                onClick={() => onEdit(property)}
                className="flex-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(property)}
                className="flex-1 rounded-md border border-destructive/25 px-2 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
