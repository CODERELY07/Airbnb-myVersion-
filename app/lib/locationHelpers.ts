
import { listRegions, listProvinces, listMuncities, listBarangays } from '@jobuntux/psgc';

export function getRegionName(regionCode: string) {
  const region = listRegions().find(r => r.regCode === regionCode);
  return region ? region.regionName : 'Unknown Region';
}

export function getProvinceName(regionCode: string, provinceCode: string) {
  const province = listProvinces(regionCode).find(p => p.provCode === provinceCode);
  return province ? province.provName : 'Unknown Province';
}

export function getMunicipalityName(provinceCode: string, munCityCode: string) {
  const mun = listMuncities(provinceCode).find(m => m.munCityCode === munCityCode);
  return mun ? mun.munCityName : 'Unknown City/Municipality';
}

export function getBarangayName(munCityCode: string, barangayCode: string) {
  const brgy = listBarangays(munCityCode).find(b => b.brgyCode === barangayCode);
  return brgy ? brgy.brgyName : 'Unknown Barangay';
}

type ListingCodes = {
  regionCode?: string | null;
  provinceCode?: string | null;
  munCityCode?: string | null;
  barangayCode?: string | null;
};

// Server-side only: keeps the large PSGC data out of client bundles.
// Short label for cards, e.g. "El Nido, Palawan"
export function getListingLocation(listing: ListingCodes) {
  if (!listing.regionCode || !listing.provinceCode) return '';
  const province = getProvinceName(listing.regionCode, listing.provinceCode);
  const city = listing.munCityCode ? getMunicipalityName(listing.provinceCode, listing.munCityCode) : '';
  return [city.replace(/^City of /, '').trim(), province].filter(Boolean).join(', ');
}

// Full address for the listing page
export function getListingAddress(listing: ListingCodes) {
  if (!listing.regionCode || !listing.provinceCode || !listing.munCityCode || !listing.barangayCode) return null;
  return {
    region: getRegionName(listing.regionCode),
    province: getProvinceName(listing.regionCode, listing.provinceCode),
    city: getMunicipalityName(listing.provinceCode, listing.munCityCode).trim(),
    barangay: getBarangayName(listing.munCityCode, listing.barangayCode).trim(),
  };
}
