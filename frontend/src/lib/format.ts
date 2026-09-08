export function formatPKR(price: number, priceType: string = "total"): string {
  const prefix =
    priceType === "per_marla" ? "/ Marla" : priceType === "per_sqft" ? "/ Sqft" : "";

  if (price >= 10_000_000) {
    const crore = price / 10_000_000;
    return `${trimZero(crore)} Cr${prefix}`;
  }
  if (price >= 100_000) {
    return `${trimZero(price / 100_000)} Lakh${prefix}`;
  }
  return `PKR ${price.toLocaleString("en-PK")}${prefix}`;
}

function trimZero(n: number): string {
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2).replace(/0$/, "");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
