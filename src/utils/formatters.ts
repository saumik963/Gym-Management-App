export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatCurrency(amount: number, currencySymbol: string = '৳'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${currencySymbol} 0`;
  }
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `${currencySymbol} ${formatted}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getMonthName(monthNumber: number): string {
  return MONTH_NAMES[monthNumber - 1] || `Month ${monthNumber}`;
}
