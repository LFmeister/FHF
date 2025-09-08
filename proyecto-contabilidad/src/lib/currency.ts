// Currency utilities for the accounting app

export type Currency = 'COP' | 'AUD';

export const CURRENCIES = {
  COP: {
    code: 'COP',
    symbol: '$',
    name: 'Peso Colombiano',
    locale: 'es-CO'
  },
  AUD: {
    code: 'AUD', 
    symbol: 'A$',
    name: 'Dólar Australiano',
    locale: 'en-AU'
  }
} as const;

export function formatCurrency(amount: number, currency: Currency = 'COP'): string {
  const currencyInfo = CURRENCIES[currency];
  
  return new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currencyInfo.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencySymbol(currency: Currency = 'COP'): string {
  return CURRENCIES[currency].symbol;
}

export function getCurrencyName(currency: Currency = 'COP'): string {
  return CURRENCIES[currency].name;
}
