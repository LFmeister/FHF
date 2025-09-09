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
  
  if (currency === 'COP') {
    // Colombian peso formatting: $100,000 COP (no decimals, comma thousands separator)
    return `$${new Intl.NumberFormat('es-CO').format(amount)} COP`;
  }
  
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
