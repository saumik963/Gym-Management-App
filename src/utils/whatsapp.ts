import { Member, Payment, GymSettings } from '../types';
import { getMonthName, formatDate } from './formatters';

export function formatPhoneNumberForWhatsApp(phone: string, defaultPrefix: string = '+880'): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  const prefixDigits = defaultPrefix.replace(/\D/g, '');

  if (digits.startsWith('0')) {
    digits = prefixDigits + digits.substring(1);
  } else if (!digits.startsWith(prefixDigits) && digits.length <= 10) {
    digits = prefixDigits + digits;
  }

  return digits;
}

export function generateInvoiceWhatsAppMessage(
  member: Member,
  payment: Payment,
  settings: GymSettings
): string {
  const gymName = settings.gymName || 'Fitness Care Gym';
  const payDate = formatDate(payment.paymentDate || new Date().toISOString());
  const monthName = getMonthName(payment.month);

  return (
    `*${gymName.toUpperCase()}*\n` +
    `*OFFICIAL PAYMENT RECEIPT*\n\n` +
    `*Receipt ID:* #${payment.id}\n` +
    `*Payment Date:* ${payDate}\n\n` +
    `*MEMBER DETAILS*\n` +
    `• *Name:* ${member.name}\n` +
    `• *Member ID:* ${member.memberId}\n` +
    `• *Phone:* ${member.phone}\n\n` +
    `*PAYMENT BREAKDOWN*\n` +
    `• *Billing Month:* ${monthName} ${payment.year}\n` +
    `• *Monthly Fee:* ${settings.currency}${payment.monthlyFee}\n` +
    `• *Collected Amount:* ${settings.currency}${payment.collectedAmount}\n` +
    `• *Remaining Due:* ${settings.currency}${payment.remainingDue}\n` +
    `• *Payment Method:* ${payment.paymentMethod}\n` +
    `• *Status:* *${payment.status.toUpperCase()}*\n\n` +
    `_${settings.receiptFooter || 'Thank you for staying fit with Fitness Care Gym! Stay Strong.'}_`
  );
}

export function openWhatsAppInvoice(
  member: Member,
  payment: Payment,
  settings: GymSettings
) {
  const formattedPhone = formatPhoneNumberForWhatsApp(member.phone, settings.phonePrefix);
  const text = generateInvoiceWhatsAppMessage(member, payment, settings);
  const encodedText = encodeURIComponent(text);

  let url = formattedPhone 
    ? `https://wa.me/${formattedPhone}?text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  window.open(url, '_blank');
}
