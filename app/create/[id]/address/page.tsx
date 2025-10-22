  "use client";

  import { CreationBottomBar } from "@/app/components/CreationBottomBar";

  import { useCountries } from "@/app/lib/getCountries";
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import { Skeleton } from "@/components/ui/skeleton";
  import { createLocation } from "@/lib/supabase/listings";
  import dynamic from "next/dynamic";
  import { use, useState } from "react";
  import React from 'react';

  export default function AddressRoutw({ params }: { params: Promise<{ id: string }> }) {
    const { getAllCountries } = useCountries();
    const [locationValue, setLocationValue] = useState("");
    const {id} = React.use(params)
    const LazyMap = dynamic(() => import("@/app/components/Map"), {
      ssr: false,
      loading: () => <Skeleton className="h-[50vh] w-full" />,
    });
    return (
      <>
        <div className="w-3/5 mx-auto">
          <h2 className="text-3xl font-semibold tracking-tight transition-colors mb-10">
            Where is your Home located?
          </h2>
        </div>

        <form action={createLocation}>
          <input type="hidden" name="listingId" value={id} />
          <input type="hidden" name="countryValue" value={locationValue} />
          <div className="w-3/5 mx-auto mb-36">
            <div className="mb-5">
              <Select required onValueChange={(value) => setLocationValue(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Countries</SelectLabel>
                    {getAllCountries().map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.flag} {item.label} / {item.region}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <LazyMap locationValue={locationValue} />
          </div>

          <CreationBottomBar />
        </form>
      </>
    );
  }