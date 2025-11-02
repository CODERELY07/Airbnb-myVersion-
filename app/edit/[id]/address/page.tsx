// Create these pages in app/edit/[id]/structure/page.tsx
// app/edit/[id]/description/page.tsx
// app/edit/[id]/address/page.tsx

// 1. Edit Structure Page (app/edit/[id]/structure/page.tsx)
// 2. Edit Description Page (app/edit/[id]/description/page.tsx)


// 3. Edit Address Page (app/edit/[id]/address/page.tsx)
"use client";

import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import {
  listRegions,
  listProvinces,
  listMuncities,
  listBarangays,
} from '@jobuntux/psgc';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateListingLocation } from "@/lib/supabase/listings";
import { useState, useEffect } from "react";
import React from 'react';

export default function EditAddressRoute({ 
  params,
  initialData
}: { 
  params: Promise<{id: string}>;
  initialData?: {
    regionCode: string;
    provinceCode: string;
    munCityCode: string;
    barangayCode: string;
  };
}) {
  const regions = listRegions();

  const [regionCode, setRegionCode] = useState(initialData?.regionCode || '');
  const [provinceCode, setProvinceCode] = useState(initialData?.provinceCode || '');
  const [munCityCode, setMunCityCode] = useState(initialData?.munCityCode || '');
  const [barangayCode, setBarangayCode] = useState(initialData?.barangayCode || '');

  const provinces = regionCode ? listProvinces(regionCode) : [];
  const muncities = provinceCode ? listMuncities(provinceCode) : [];

  const selectedProvince = provinces.find((p) => p.provCode === provinceCode);
  const isHUC = selectedProvince?.cityClass === 'HUC';

  const effectiveMunCityCode = isHUC
    ? muncities[0]?.munCityCode
    : munCityCode;

  const barangays = effectiveMunCityCode ? listBarangays(effectiveMunCityCode) : [];
  const { id } = React.use(params);
  return (
    <>
      <div className="w-3/5 mx-auto mb-5 mt-4">
        <h2 className="text-3xl font-semibold tracking-tight transition-colors">
          Update your Home Location
        </h2>
      </div>

      <form action={updateListingLocation}>
        <input type="hidden" name="listingId" value={id} />
        <input type="hidden" name="regionCode" value={regionCode} />
        <input type="hidden" name="provinceCode" value={provinceCode} />
        <input type="hidden" name="munCityCode" value={munCityCode} />
        <input type="hidden" name="barangayCode" value={barangayCode} />
        <div className="w-3/5 mx-auto mb-36">
          <div className="mb-5">
            <Select 
              required 
              value={regionCode} 
              onValueChange={(value) => {
                setRegionCode(value);
                setProvinceCode('');
                setMunCityCode('');
                setBarangayCode('');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Select Region</SelectLabel>
                  {regions.map((reg) => (
                    <SelectItem key={reg.regCode} value={reg.regCode}>
                      {reg.regionName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-5">
            <Select 
              required 
              value={provinceCode} 
              onValueChange={(value) => {
                setProvinceCode(value);
                setMunCityCode('');
                setBarangayCode('');
              }}
              disabled={!regionCode}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Select Province</SelectLabel>
                  {provinces.map((prov) => (
                    <SelectItem key={prov.provCode} value={prov.provCode as string}>
                      {prov.provName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-5">
            <Select 
              required 
              value={munCityCode} 
              onValueChange={(value) => {
                setMunCityCode(value);
                setBarangayCode('');
              }}
              disabled={!provinceCode || muncities.length === 1}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Municipality / City" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Select Municipality / City</SelectLabel>
                  {muncities.map((mun) => (
                    <SelectItem key={mun.munCityCode} value={mun.munCityCode}>
                      {mun.munCityName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-5">
            <Select 
              required 
              value={barangayCode} 
              onValueChange={(value) => {
                setBarangayCode(value)
              }}
              disabled={!provinceCode || (!isHUC && !munCityCode)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Barangay" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Select Barangay</SelectLabel>
                  {barangays.map((brgy) => {
                    const brgyFullName = brgy.brgyOldName
                      ? `${brgy.brgyName} (${brgy.brgyOldName})`
                      : brgy.brgyName;
                    return (
                      <SelectItem key={brgy.brgyCode} value={brgy.brgyCode}>
                        {brgyFullName}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CreationBottomBar />
      </form>
    </>
  );
}