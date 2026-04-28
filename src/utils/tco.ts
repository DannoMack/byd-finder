import provincialAssumptions from '../data/provincial-assumptions.json';

export interface VehicleTcoInput {
  name: string;
  slug: string;
  bodyStyle: string;
  priceFromCAD: number;
  rangeKm: number;
  batteryKWh: number;
  driveTrain: string;
  dcFastChargeKw: number;
  efficiencyKWhPer100Km: number;
  winterRangeLossPct: number;
  insurancePerYearCAD: number;
  maintenancePerYearCAD: number;
  depreciationPct5yr: number;
}

export interface ProvinceAssumption {
  name: string;
  electricityCentsPerKWh: number;
  gasPricePerLitre: number;
  insuranceMultiplier: number;
}

type ProvincialAssumptions = typeof provincialAssumptions;

export const TCO_ASSUMPTIONS = provincialAssumptions as ProvincialAssumptions;

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function estimateWinterRangeKm(vehicle: VehicleTcoInput): number {
  return Math.round(vehicle.rangeKm * (1 - vehicle.winterRangeLossPct));
}

export function calculateFiveYearTco(
  vehicle: VehicleTcoInput,
  province: ProvinceAssumption,
  annualKm = TCO_ASSUMPTIONS.meta.annualKmDefault,
) {
  const years = TCO_ASSUMPTIONS.meta.years;
  const chargingLossMultiplier = 1 + TCO_ASSUMPTIONS.meta.chargingLossPct;
  const depreciation = vehicle.priceFromCAD * vehicle.depreciationPct5yr;
  const electricity = ((annualKm / 100) * vehicle.efficiencyKWhPer100Km * chargingLossMultiplier)
    * years
    * (province.electricityCentsPerKWh / 100);
  const insurance = vehicle.insurancePerYearCAD * province.insuranceMultiplier * years;
  const maintenance = vehicle.maintenancePerYearCAD * years;
  const total = depreciation + electricity + insurance + maintenance;

  return {
    annualKm,
    years,
    depreciation,
    electricity,
    insurance,
    maintenance,
    total,
  };
}
