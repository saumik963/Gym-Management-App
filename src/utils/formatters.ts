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
  const symbol = currencySymbol || '৳';
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol} 0`;
  }
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `${symbol} ${formatted}`;
}

/**
 * Formats currency specifically for PDF generation.
 * Standard jsPDF Type 1 fonts (Helvetica/Times) only support WinAnsi encoding and cannot render
 * Bengali Unicode '৳' (U+09F3), which causes it to render as 'ó'.
 * This function cleanly maps '৳' or 'tk' to 'Tk' for flawless PDF rendering.
 */
export function formatPdfCurrency(amount: number, currencySymbol: string = '৳'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Tk 0';
  }
  const formatted = Math.round(amount).toLocaleString('en-US');
  let symbol = currencySymbol?.trim();
  if (!symbol || symbol === '৳' || symbol.toLowerCase() === 'tk') {
    symbol = 'Tk';
  }
  return `${symbol} ${formatted}`;
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
