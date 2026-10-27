"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { DateRange, Matcher } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { getNights } from "@/lib/utils";

const shortDate: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

// Date range picker shared by the search bar and the booking calendar
export function StayCalendar({
  dateRange,
  setDateRange,
  booked = [],
  heading = true,
}: {
  dateRange: DateRange;
  setDateRange: Dispatch<SetStateAction<DateRange>>;
  booked?: Matcher[];
  heading?: boolean;
}) {
  const { from, to } = dateRange;
  const nights = from && to ? getNights(from, to) : 0;

  // One month on phones, two side by side from md up
  const [months, setMonths] = useState(1);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setMonths(query.matches ? 2 : 1);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div>
      {heading && (
        <div className="mb-4">
          <h3 className="font-display text-xl font-medium">
            {nights > 0
              ? `${nights} night${nights === 1 ? "" : "s"}`
              : "Select dates"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {from && to
              ? `${from.toLocaleDateString("en-US", shortDate)} – ${to.toLocaleDateString("en-US", shortDate)}`
              : "Add your check-in and check-out dates"}
          </p>
        </div>
      )}

      {/* relative: keeps the month arrows on the calendar, not on the heading */}
      <div className="relative">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={(range) =>
            setDateRange(range ?? { from: undefined, to: undefined })
          }
          numberOfMonths={months}
          showOutsideDays={false}
          disabled={[{ before: new Date() }, ...booked]}
          className="p-0 [--cell-size:--spacing(10)]"
          classNames={{ months: "flex flex-col gap-8 md:flex-row" }}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setDateRange({ from: undefined, to: undefined })}
          disabled={!from}
          className="text-sm font-medium underline underline-offset-4 transition hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          Clear dates
        </button>
      </div>
    </div>
  );
}
