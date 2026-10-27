import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Counter } from "./Counter";

export interface DescriptionDefaults {
  title?: string | null;
  description?: string | null;
  price?: number | null;
  guests?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  photo?: string | null;
}

const inputClass = "h-11 rounded-xl bg-card px-4 text-[15px]";

// Fields of step 2, shared by the create and edit pages
export function DescriptionFields({ defaults }: { defaults?: DescriptionDefaults }) {
  const editing = !!defaults;

  return (
    <div className="grid gap-6">
      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" required maxLength={80} defaultValue={defaults?.title ?? ""} placeholder="e.g. Bamboo hut by the beach" className={inputClass} />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          required
          maxLength={1000}
          defaultValue={defaults?.description ?? ""}
          placeholder="What makes your place special? What's nearby?"
          className="min-h-32 rounded-xl bg-card px-4 py-3 text-[15px]"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Price per night (₱)" htmlFor="price">
          <Input
            id="price"
            name="price"
            type="number"
            required
            min={100}
            step={1}
            defaultValue={defaults?.price ?? ""}
            placeholder="2500"
            className={inputClass}
          />
        </Field>

        <Field
          label="Photo"
          htmlFor="image"
          hint={editing ? "Leave empty to keep the current photo." : "JPG or PNG, up to 5 MB."}
        >
          <Input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            required={!editing}
            className="h-11 cursor-pointer rounded-xl bg-card pt-2.5 text-sm file:mr-3 file:rounded-full file:bg-muted file:px-3 file:font-medium"
          />
        </Field>
      </div>

      <div className="divide-y rounded-2xl border bg-card px-5">
        <CounterRow title="Guests" hint="How many people can stay?" name="guest" defaultValue={defaults?.guests ?? 2} />
        <CounterRow title="Bedrooms" hint="Rooms with a bed." name="bedroom" defaultValue={defaults?.bedrooms ?? 1} />
        <CounterRow title="Bathrooms" hint="Full or half baths." name="bathroom" defaultValue={defaults?.bathrooms ?? 1} />
      </div>
    </div>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CounterRow({ title, hint, name, defaultValue }: { title: string; hint: string; name: string; defaultValue: number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      <Counter name={name} label={title.toLowerCase()} defaultValue={Number(defaultValue)} />
    </div>
  );
}
