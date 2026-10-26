'use client';

import React, { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { trpc } from '@/trpc/client';
import { getNights } from '@/lib/utils';

export default function CalendarReservation({
  dateRange,
  setDateRange,
  listingId
}: {
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  listingId: string
}) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());


  const { data: reservations = [], isLoading, error } =
    trpc.listings.fetchReservation.useQuery({listingId});

  const disabledDates = [
    { before: new Date() }, 
    ...reservations.map((r: any) => ({
      from: new Date(r.startDate),
      to: new Date(r.endDate),
    })),
  ];

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range || { from: undefined, to: undefined });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const formatDateRange = (): string => {
    if (!dateRange.from) return 'Select dates';

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };

    const fromDate = dateRange.from.toLocaleDateString('en-US', options);

    if (!dateRange.to) return fromDate;

    const nights = getNights(dateRange.from, dateRange.to);

    return `${nights} night${nights !== 1 ? 's' : ''} in Pasay`;
  };

  const clearDates = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  if (isLoading) return <p className="text-sm sm:text-base">Loading calendar...</p>;
  if (error) return <p className="text-red-500 text-sm sm:text-base">Failed to load reservations</p>;

  return (
    <div className="w-full mx-auto bg-white">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2">
          {formatDateRange()}
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600">
          {dateRange.from && dateRange.to
            ? `${dateRange.from.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })} - ${dateRange.to.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}`
            : 'Select check-in and check-out dates'}
        </p>
      </div>

      <div className="relative lg:-ml-12 rounded-lg">
        <div className="flex items-start justify-between p-2 sm:p-4">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 lg:gap-8 text-center items-start justify-start flex-1 mx-1 sm:mx-2">
            <input
              type="hidden"
              name="startDate"
              value={
                dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''
              }
            />
            <input
              type="hidden"
              name="endDate"
              value={
                dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''
              }
            />

            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleSelect}
              month={currentMonth}
              numberOfMonths={2}
              className="flex flex-col sm:flex-row gap-2 sm:gap-4 lg:gap-8 w-full justify-center"
              classNames={{
                months:
                  'flex flex-col sm:flex-row gap-2 sm:gap-4 lg:gap-8 w-full justify-center',
                month: 'flex-1 min-w-[240px] sm:min-w-[280px]',
                caption: 'hidden',
                nav: 'hidden',
                head_cell:
                  'text-gray-500 font-medium text-xs sm:text-sm w-8 sm:w-10 lg:w-12 text-center',
                cell: 'text-center p-0 relative',
                day: `
                  w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-xs sm:text-sm rounded-full transition 
                  flex items-center justify-center mx-auto 
                  hover:text-white
                `,
                day_selected: 'text-white bg-blue-600',
                day_range_middle: 'text-white bg-blue-400',
                day_range_start: 'text-white bg-blue-600 rounded-l-full',
                day_range_end: 'text-white bg-blue-600 rounded-r-full',
                day_today: 'font-bold border border-blue-300',
                day_outside: 'invisible',
                day_disabled:
                  'text-gray-300 cursor-not-allowed hover:bg-transparent',
                day_hidden: 'invisible',
              }}
              showOutsideDays={false}
              disabled={disabledDates}
            />
          </div>

          <button
            onClick={goToNextMonth}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-2 sm:p-3 lg:p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={clearDates}
            className="text-xs sm:text-sm font-semibold underline hover:text-gray-600 transition"
          >
            Clear dates
          </button>
        </div>
      </div>
    </div>
  );
}