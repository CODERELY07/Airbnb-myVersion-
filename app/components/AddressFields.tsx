"use client";

import { useEffect, useState } from "react";
import { listBarangays, listMuncities, listProvinces, listRegions } from "@jobuntux/psgc";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface AddressCodes {
  regionCode?: string | null;
  provinceCode?: string | null;
  munCityCode?: string | null;
  barangayCode?: string | null;
}

// Region → province → city → barangay pickers, shared by the create and edit pages.
// Writes the codes into hidden inputs for the surrounding <form>.
export function AddressFields({ initial }: { initial?: AddressCodes | null }) {
  const [regionCode, setRegionCode] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [munCityCode, setMunCityCode] = useState("");
  const [barangayCode, setBarangayCode] = useState("");

  // Prefill once the saved address arrives (edit page)
  useEffect(() => {
    if (!initial) return;
    setRegionCode(initial.regionCode ?? "");
    setProvinceCode(initial.provinceCode ?? "");
    setMunCityCode(initial.munCityCode ?? "");
    setBarangayCode(initial.barangayCode ?? "");
  }, [initial]);

  const provinces = regionCode ? listProvinces(regionCode) : [];
  const muncities = provinceCode ? listMuncities(provinceCode) : [];
  // Highly urbanized cities are their own "province" with a single city entry
  const isHUC = provinces.find((p) => p.provCode === provinceCode)?.cityClass === "HUC";
  const effectiveMunCityCode = isHUC ? muncities[0]?.munCityCode ?? "" : munCityCode;
  const barangays = effectiveMunCityCode ? listBarangays(effectiveMunCityCode) : [];

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="regionCode" value={regionCode} />
      <input type="hidden" name="provinceCode" value={provinceCode} />
      <input type="hidden" name="munCityCode" value={effectiveMunCityCode} />
      <input type="hidden" name="barangayCode" value={barangayCode} />

      <PlaceSelect
        label="Region"
        placeholder="Select a region"
        value={regionCode}
        options={listRegions().map((r) => ({ value: r.regCode, label: r.regionName }))}
        onChange={(value) => {
          setRegionCode(value);
          setProvinceCode("");
          setMunCityCode("");
          setBarangayCode("");
        }}
      />
      <PlaceSelect
        label="Province"
        placeholder="Select a province"
        value={provinceCode}
        disabled={!regionCode}
        options={provinces.map((p) => ({ value: p.provCode as string, label: p.provName }))}
        onChange={(value) => {
          setProvinceCode(value);
          setMunCityCode("");
          setBarangayCode("");
        }}
      />
      <PlaceSelect
        label="City / Municipality"
        placeholder={isHUC ? "Same as province" : "Select a city or municipality"}
        value={isHUC ? "" : munCityCode}
        disabled={!provinceCode || isHUC}
        options={muncities.map((m) => ({ value: m.munCityCode, label: m.munCityName.trim() }))}
        onChange={(value) => {
          setMunCityCode(value);
          setBarangayCode("");
        }}
      />
      <PlaceSelect
        label="Barangay"
        placeholder="Select a barangay"
        value={barangayCode}
        disabled={!effectiveMunCityCode}
        options={barangays.map((b) => ({
          value: b.brgyCode,
          label: b.brgyOldName ? `${b.brgyName.trim()} (${b.brgyOldName})` : b.brgyName.trim(),
        }))}
        onChange={setBarangayCode}
      />
    </div>
  );
}

function PlaceSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Select
        required
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          // Radix re-fires this (sometimes with '') when the value is set from code
          if (!next || next === value) return;
          onChange(next);
        }}
      >
        <SelectTrigger className="h-11 w-full rounded-xl bg-card">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72 rounded-xl">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
