export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", decimals: 2, label: "US Dollar" },
  { code: "KRW", symbol: "₩", decimals: 0, label: "Korean Won" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const LICENSE_OPTIONS = [
  { value: "CC-BY-4.0", label: "CC BY 4.0", description: "Attribution required, commercial use allowed" },
  { value: "CC-BY-NC-4.0", label: "CC BY-NC 4.0", description: "Attribution required, non-commercial only" },
  { value: "MIT", label: "MIT License", description: "Permissive, minimal restrictions" },
  { value: "commercial", label: "Commercial", description: "Custom commercial license" },
  { value: "research-only", label: "Research Only", description: "Academic and research use only" },
] as const;

export type LicenseValue = (typeof LICENSE_OPTIONS)[number]["value"];

export const DEFAULT_PLATFORM_FEE_BPS = 1000; // 10%
export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function getCurrency(code: string) {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? SUPPORTED_CURRENCIES[0];
}

export function formatPrice(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  if (amount === 0) return "Free";
  const value = currency.decimals > 0 ? (amount / Math.pow(10, currency.decimals)).toFixed(currency.decimals) : amount.toString();
  return `${currency.symbol}${value}`;
}

export function calcSellerReceives(amount: number, feeBps: number): number {
  return Math.round(amount * (1 - feeBps / 10000));
}

export function getLicense(value: string) {
  return LICENSE_OPTIONS.find((l) => l.value === value) ?? LICENSE_OPTIONS[0];
}
