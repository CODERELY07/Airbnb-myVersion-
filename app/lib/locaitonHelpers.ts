
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
