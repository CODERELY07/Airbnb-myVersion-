'use client';

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange } from 'react-day-picker';

export default function CalendarSearch({
  dateRange,
  setDateRange,
}: {
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
}) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

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
    };

    const fromDate = dateRange.from.toLocaleDateString('en-US', options);

    if (!dateRange.to) return fromDate;

    const nights = Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return `${nights} night${nights !== 1 ? 's' : ''}`;
  };

  const clearDates = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <div className="w-full mx-auto bg-white p-3 rounded-full">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {formatDateRange()}
        </p>
        <p className="text-xs text-gray-500">
          {dateRange.from && dateRange.to
            ? `${dateRange.from.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })} - ${dateRange.to.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}`
            : 'Minimum stay: 1 night'}
        </p>
      </div>

      <div className="relative rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="font-semibold text-sm">
            {currentMonth.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleSelect}
            month={currentMonth}
            numberOfMonths={2}
            className="w-full"
            classNames={{
              months: 'flex gap-8 w-full justify-center',
              month: 'space-y-4',
              caption: 'hidden',
              nav: 'hidden',
              head_cell:
                'text-gray-500 font-medium text-xs w-10 text-center',
              cell: 'text-center p-0 relative',
              day: `
                w-10 h-10 text-sm rounded-full transition 
                flex items-center justify-center mx-auto 
                hover:bg-gray-100
              `,
              day_selected: 'text-white bg-gray-900 hover:bg-gray-900',
              day_range_middle: 'bg-gray-100 text-gray-900',
              day_range_start: 'text-white bg-gray-900 rounded-full',
              day_range_end: 'text-white bg-gray-900 rounded-full',
              day_today: 'font-bold',
              day_outside: 'text-gray-300',
              day_disabled:
                'text-gray-200 cursor-not-allowed hover:bg-transparent line-through',
              day_hidden: 'invisible',
            }}
            showOutsideDays={false}
            disabled={{ before: new Date() }}
          />
        </div>

        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <button
            onClick={clearDates}
            className="text-sm font-semibold underline hover:text-gray-600 transition"
          >
            Clear dates
          </button>
          <div className="text-xs text-gray-500">
            Press ESC to close
          </div>
        </div>
      </div>
    </div>
  );
}