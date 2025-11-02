'use client';
import React, { useState } from 'react';
import { Search, MapPin, CalendarIcon, UsersIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { trpc } from '@/trpc/client';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import CalendarSearch from './CalendarSearch';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';

type GuestType = 'guest' | 'bedrooms' | 'bathrooms';

interface Guests {
  guest: number;
  bedrooms: number;
  bathrooms: number;
}

interface SearchData {
  destination: string;      
  destinationName: string;   
  checkIn: Date | null;
  checkOut: Date | null;
  guests: Guests;
}

interface LocationType {
  provinceCode: string;
  provinceName: string;
}

export default function SearchBar(): React.ReactElement {
  const router = useRouter();
  const { data: locations, isLoading } = trpc.location.listUnique.useQuery<LocationType[]>();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const [searchData, setSearchData] = useState<SearchData>({
    destination: '',
    destinationName: '',
    checkIn: null,
    checkOut: null,
    guests: {
      guest: 1,
      bedrooms: 0,
      bathrooms: 0,
    },
  });

  const [openPopover, setOpenPopover] = useState<'where' | 'when' | 'who' | null>(null);
  const [tempSearchTerm, setTempSearchTerm] = useState('');

  const totalGuests = searchData.guests.guest;

  const updateGuests = (type: GuestType, increment: number) => {
    setSearchData(prev => ({
      ...prev,
      guests: {
        ...prev.guests,
        [type]: Math.max(0, prev.guests[type] + increment),
      },
    }));
  };

  // Update searchData when dateRange changes
  React.useEffect(() => {
    setSearchData(prev => ({
      ...prev,
      checkIn: dateRange.from || null,
      checkOut: dateRange.to || null,
    }));
  }, [dateRange]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchData.destination) params.append("destination", searchData.destination);
    if (searchData.checkIn) params.append("checkIn", format(searchData.checkIn, "yyyy-MM-dd"));
    if (searchData.checkOut) params.append("checkOut", format(searchData.checkOut, "yyyy-MM-dd"));
    if (searchData.guests.guest > 0) params.append("guests", searchData.guests.guest.toString());
    if (searchData.guests.bedrooms > 0) params.append("bedrooms", searchData.guests.bedrooms.toString());
    if (searchData.guests.bathrooms > 0) params.append("bathrooms", searchData.guests.bathrooms.toString());

    router.push(`/search?${params.toString()}`);
  };

  // Get unique provinces (remove duplicates)
  const uniqueProvinces = locations?.reduce((acc, location) => {
    if (!acc.some(item => item.provinceCode === location.provinceCode)) {
      acc.push(location);
    }
    return acc;
  }, [] as LocationType[]);

  // Sort provinces alphabetically
  const sortedProvinces = uniqueProvinces?.sort((a, b) =>
    a.provinceName.localeCompare(b.provinceName)
  );

  // Filter provinces based on temp search term
  const filteredProvinces = sortedProvinces?.filter(location => {
    const searchTerm = tempSearchTerm.toLowerCase();
    return location.provinceName?.toLowerCase().includes(searchTerm);
  });

  return (
    <div className="w-full px-4 sm:px-0" suppressHydrationWarning>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl sm:rounded-full shadow-lg border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center overflow-hidden">
          {/* WHERE */}
          <Popover
            open={openPopover === 'where'}
            onOpenChange={open => {
              setOpenPopover(open ? 'where' : null);
              if (open) {
                // Clear the search term when opening to show all locations
                setTempSearchTerm('');
              }
            }}
          >
            <PopoverTrigger asChild suppressHydrationWarning>
              <div 
                className="flex-1 px-5 sm:px-6 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer border-b sm:border-b-0 border-gray-200 sm:rounded-l-full" 
                suppressHydrationWarning
              >
                <div className="font-semibold text-xs text-gray-700 sm:text-gray-900 mb-1 sm:mb-0">Where</div>
                <input
                  type="text"
                  placeholder="Search provinces"
                  value={openPopover === 'where' ? tempSearchTerm : searchData.destinationName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTempSearchTerm(e.target.value)
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  onFocus={() => {
                    setOpenPopover('where');
                    setTempSearchTerm('');
                  }}
                  className="text-sm text-gray-500 sm:text-gray-500 bg-transparent border-none outline-none w-full placeholder-gray-400"
                  suppressHydrationWarning 
                />
              </div>
            </PopoverTrigger>

            <PopoverContent
              className="w-[calc(100vw-2rem)] sm:w-96 p-0 mt-2 max-h-[70vh] sm:max-h-[500px] overflow-y-auto"
              align="start"
              side="bottom"
            >
              <div className="p-4 sm:p-6">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading provinces...</div>
                ) : sortedProvinces && sortedProvinces.length > 0 ? (
                  <>
                    <h3 className="font-semibold text-base mb-4 sm:mb-6">
                      {tempSearchTerm ? 'Search Results' : 'Select Province'}
                    </h3>

                    <div className="space-y-1">
                      {(tempSearchTerm ? filteredProvinces : sortedProvinces)?.map(
                        (location, idx) => (
                          <button
                            key={`${location.provinceCode}-${idx}`}
                            onClick={() => {
                              setSearchData(prev => ({
                                ...prev,
                                destination: location.provinceCode, 
                                destinationName: location.provinceName,
                              }));
                              setOpenPopover(null);
                            }}
                            className="w-full flex items-center gap-3 sm:gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                            suppressHydrationWarning
                          >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-gray-900">
                                {location.provinceName}
                              </div>
                              <div className="text-xs text-gray-400 uppercase">
                                {location.provinceCode}
                              </div>
                            </div>
                          </button>
                        )
                      )}
                    </div>

                    {tempSearchTerm && filteredProvinces?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No provinces found matching "{tempSearchTerm}"
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">No provinces available</div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="hidden sm:block w-px h-8 bg-gray-300"></div>

          {/* WHEN */}
          <Popover
            open={openPopover === 'when'}
            onOpenChange={open => setOpenPopover(open ? 'when' : null)}
          >
            <PopoverTrigger asChild suppressHydrationWarning>
              <div className="flex-1 px-5 sm:px-6 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer border-b sm:border-b-0 border-gray-200">
                <div className="font-semibold text-xs text-gray-700 sm:text-gray-900 mb-1 sm:mb-0">When</div>
                <div className="text-sm text-gray-600 sm:text-gray-400">
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                    : 'Add dates'}
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarSearch 
                dateRange={dateRange} 
                setDateRange={setDateRange} 
              />
            </PopoverContent>
          </Popover>

          <div className="hidden sm:block w-px h-8 bg-gray-300"></div>

          {/* WHO */}
          <Popover
            open={openPopover === 'who'}
            onOpenChange={open => setOpenPopover(open ? 'who' : null)}
          >
            <PopoverTrigger asChild suppressHydrationWarning>
              <div className="flex-1 px-5 sm:px-6 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer border-b sm:border-b-0 border-gray-200">
                <div className="font-semibold text-xs text-gray-700 sm:text-gray-900 mb-1 sm:mb-0">Who</div>
                <div className="text-sm text-gray-600 sm:text-gray-400">
                  {totalGuests > 0
                    ? `${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`
                    : 'Add guests'}
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 p-4 sm:p-6" align="end">
              <div className="space-y-4 sm:space-y-6">
                {[
                  { key: 'guest' as GuestType, label: 'Guests', desc: 'Ages 13 or above' },
                  { key: 'bedrooms' as GuestType, label: 'Bedrooms', desc: 'Number of bedrooms needed' },
                  { key: 'bathrooms' as GuestType, label: 'Bathrooms', desc: 'Number of bathrooms needed' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm sm:text-base text-gray-900">{label}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{desc}</div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <button
                        onClick={() => updateGuests(key, -1)}
                        disabled={searchData.guests[key] === 0}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600"
                        suppressHydrationWarning
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-normal text-gray-900">
                        {searchData.guests[key]}
                      </span>
                      <button
                        onClick={() => updateGuests(key, 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-600"
                        suppressHydrationWarning
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* SEARCH BUTTON */}
          <div className="p-3 sm:p-0 sm:m-1.5">
            <Button
              onClick={handleSearch}
              className="w-full sm:w-auto text-white rounded-xl sm:rounded-full !px-6 sm:!px-10 py-6 sm:py-7 flex items-center justify-center gap-2 transition-colors"
              suppressHydrationWarning
            >
              <Search className="w-4 h-4" />
              <span className="font-semibold text-sm">Search</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}