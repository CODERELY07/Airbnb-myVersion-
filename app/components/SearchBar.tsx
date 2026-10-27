"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MapPin, Minus, Plus, Search } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { StayCalendar } from "./StayCalendar";

type CountKey = "guest" | "bedrooms" | "bathrooms";
type Panel = "where" | "when" | "who" | null;

const counters: { key: CountKey; label: string; hint: string; min: number }[] = [
  { key: "guest", label: "Guests", hint: "Ages 13 or above", min: 1 },
  { key: "bedrooms", label: "Bedrooms", hint: "Minimum bedrooms", min: 0 },
  { key: "bathrooms", label: "Bathrooms", hint: "Minimum bathrooms", min: 0 },
];

export default function SearchBar() {
  const router = useRouter();
  const { data: locations, isLoading } = trpc.location.listUnique.useQuery();

  const [open, setOpen] = useState<Panel>(null);
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState<{ code: string; name: string } | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [counts, setCounts] = useState<Record<CountKey, number>>({ guest: 1, bedrooms: 0, bathrooms: 0 });

  // Unique provinces, A–Z, filtered by what the user typed
  const provinces = useMemo(() => {
    const unique = new Map<string, string>();
    locations?.forEach((l) => unique.set(l.provinceCode, l.provinceName));
    return [...unique]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [locations, query]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination.code);
    if (dateRange.from) params.set("checkIn", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange.to) params.set("checkOut", format(dateRange.to, "yyyy-MM-dd"));
    if (counts.guest > 0) params.set("guests", String(counts.guest));
    if (counts.bedrooms > 0) params.set("bedrooms", String(counts.bedrooms));
    if (counts.bathrooms > 0) params.set("bathrooms", String(counts.bathrooms));
    setOpen(null);
    router.push(`/search?${params.toString()}`);
  };

  const whenLabel =
    dateRange.from && dateRange.to
      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
      : "Add dates";

  return (
    <div className="flex items-center rounded-full border bg-card p-1.5 shadow-sm transition hover:shadow-md">
      {/* WHERE */}
      <Popover open={open === "where"} onOpenChange={(o) => setOpen(o ? "where" : null)}>
        <PopoverTrigger asChild>
          <Segment label="Where" value={destination?.name ?? "Search provinces"} filled={!!destination} active={open === "where"} />
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={12} className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-3 shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search provinces"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-foreground/40"
          />
          <div className="mt-2 max-h-72 overflow-y-auto">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading provinces…</p>
            ) : provinces.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No provinces found</p>
            ) : (
              provinces.map((p) => (
                <button
                  key={p.code}
                  onClick={() => {
                    setDestination(p);
                    setQuery("");
                    setOpen("when");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-accent"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                    <MapPin className="size-4 text-muted-foreground" />
                  </span>
                  <span className="text-sm font-medium">{p.name}</span>
                </button>
              ))
            )}
          </div>
          {destination && (
            <button
              onClick={() => setDestination(null)}
              className="mt-2 w-full rounded-lg py-2 text-sm font-medium underline underline-offset-4 hover:bg-accent"
            >
              Any province
            </button>
          )}
        </PopoverContent>
      </Popover>

      <Divider />

      {/* WHEN */}
      <Popover open={open === "when"} onOpenChange={(o) => setOpen(o ? "when" : null)}>
        <PopoverTrigger asChild>
          <Segment label="When" value={whenLabel} filled={!!dateRange.from} active={open === "when"} />
        </PopoverTrigger>
        <PopoverContent align="center" sideOffset={12} className="w-auto max-w-[calc(100vw-2rem)] rounded-2xl p-6 shadow-lg">
          <StayCalendar dateRange={dateRange} setDateRange={setDateRange} />
        </PopoverContent>
      </Popover>

      <Divider />

      {/* WHO */}
      <Popover open={open === "who"} onOpenChange={(o) => setOpen(o ? "who" : null)}>
        <PopoverTrigger asChild>
          <Segment
            label="Who"
            value={`${counts.guest} guest${counts.guest === 1 ? "" : "s"}`}
            filled
            active={open === "who"}
          />
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={12} className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-5 shadow-lg">
          <div className="divide-y">
            {counters.map(({ key, label, hint, min }) => (
              <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RoundButton
                    label={`Fewer ${label.toLowerCase()}`}
                    disabled={counts[key] <= min}
                    onClick={() => setCounts((c) => ({ ...c, [key]: Math.max(min, c[key] - 1) }))}
                  >
                    <Minus className="size-3.5" />
                  </RoundButton>
                  <span className="w-5 text-center text-sm tabular-nums">{counts[key]}</span>
                  <RoundButton
                    label={`More ${label.toLowerCase()}`}
                    disabled={counts[key] >= 16}
                    onClick={() => setCounts((c) => ({ ...c, [key]: c[key] + 1 }))}
                  >
                    <Plus className="size-3.5" />
                  </RoundButton>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <button
        onClick={handleSearch}
        aria-label="Search"
        className="ml-1 flex size-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 lg:w-auto lg:px-5"
      >
        <Search className="size-4" strokeWidth={2.5} />
        <span className="hidden lg:inline">Search</span>
      </button>
    </div>
  );
}

function Segment({
  label,
  value,
  filled,
  active,
  className,
  ...props
}: {
  label: string;
  value: string;
  filled: boolean;
  active: boolean;
  className?: string;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-start rounded-full px-3 py-1.5 text-left transition outline-none hover:bg-accent focus-visible:bg-accent sm:px-5",
        active && "bg-accent",
        className
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">{label}</span>
      <span className={cn("w-full truncate text-xs sm:text-sm", filled ? "text-foreground" : "text-muted-foreground")}>{value}</span>
    </button>
  );
}

function Divider({ className }: { className?: string }) {
  return <span aria-hidden className={cn("h-7 w-px shrink-0 bg-border", className)} />;
}

function RoundButton({
  children,
  label,
  ...props
}: { children: ReactNode; label: string } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      {...props}
      className="grid size-8 place-items-center rounded-full border transition hover:border-foreground disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
