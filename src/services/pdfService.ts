import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member, Payment, GymSettings } from '../types';
import { formatPdfCurrency, formatDate, getMonthName } from '../utils/formatters';

/**
 * Generates a clean, simple, and beautifully aligned downloaded PDF payment receipt.
 * Simple layout without cluttered boxes, balanced margins, proper column widths,
 * and standard PDF-compatible currency representation ('Tk').
 */
export function generatePaymentReceiptPDF(
  member: Member,
  payment: Payment,
  settings: GymSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const gymTitle = settings.gymName || 'Fitness Care Gym';
  const currency = settings.currency || '৳';
  const issueDate = formatDate(payment.paymentDate || payment.createdAt || new Date().toISOString());
  const billingMonthName = `${getMonthName(payment.month)} ${payment.year}`;

  // 1. Top Clean Accent Line
  doc.setFillColor(15, 118, 110); // Emerald accent #0f766e
  doc.rect(0, 0, 210, 4, 'F');

  // 2. Header Section (Starts safely at Y = 22mm to prevent clipping)
  // Left: Gym Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(gymTitle, 20, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('Official Payment Receipt', 20, 26);

  // Right: Receipt Label, ID & Date (Right-aligned, no clipping, no small boxes)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('RECEIPT', 190, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Receipt #: ${payment.id}`, 190, 26, { align: 'right' });
  doc.text(`Issue Date: ${issueDate}`, 190, 31, { align: 'right' });

  // Header Divider Line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.line(20, 37, 190, 37);

  // 3. Member & Payment Information Section (Simple, clean, open layout)
  // Left: Billed To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 118, 110);
  doc.text('BILLED TO', 20, 46);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(member.name || 'Member', 20, 53);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Member ID:   ${member.memberId}`, 20, 60);
  doc.text(`Phone:          ${member.phone || 'N/A'}`, 20, 66);
  doc.text(`Status:          ${member.status.toUpperCase()}`, 20, 72);

  // Right: Payment Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 118, 110);
  doc.text('PAYMENT DETAILS', 120, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Billing Month:', 120, 53);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(billingMonthName, 190, 53, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Payment Method:', 120, 60);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(payment.paymentMethod || 'Cash', 190, 60, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Payment Status:', 120, 67);
  doc.setFont('helvetica', 'bold');
  if (payment.status === 'Paid') {
    doc.setTextColor(5, 150, 105); // Emerald-600
    doc.text('FULLY PAID', 190, 67, { align: 'right' });
  } else if (payment.status === 'Partial') {
    doc.setTextColor(217, 119, 6); // Amber-600
    doc.text('PARTIAL PAYMENT', 190, 67, { align: 'right' });
  } else {
    doc.setTextColor(225, 29, 72); // Rose-600
    doc.text('UNPAID', 190, 67, { align: 'right' });
  }

  // 4. Clean Itemized Table (jspdf-autotable)
  // Perfectly proportioned 170mm width (20mm to 190mm) without header wrapping
  autoTable(doc, {
    startY: 80,
    margin: { left: 20, right: 20 },
    head: [['Description', 'Billing Period', 'Monthly Fee', 'Paid Amount', 'Due Amount']],
    body: [
      [
        'Gym Membership Monthly Fee',
        billingMonthName,
        formatPdfCurrency(payment.monthlyFee, currency),
        formatPdfCurrency(payment.collectedAmount, currency),
        formatPdfCurrency(payment.remainingDue, currency),
      ],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249], // Slate-100 clean header
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 66 },
      1: { halign: 'center', cellWidth: 34 },
      2: { halign: 'right', cellWidth: 23 },
      3: { halign: 'right', cellWidth: 23, fontStyle: 'bold', textColor: [5, 150, 105] },
      4: { halign: 'right', cellWidth: 24, fontStyle: 'bold', textColor: payment.remainingDue > 0 ? [225, 29, 72] : [71, 85, 105] },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // 5. Clean Totals & Remarks Section (No competing boxes)
  // Left: Simple receipt note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Payment received via ${payment.paymentMethod}.`, 20, finalY + 4);
  doc.text('Thank you for choosing us to reach your fitness goals!', 20, finalY + 9);

  // Right: Financial Summary Rows (Clean alignment with table columns)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Monthly Fee:', 130, finalY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatPdfCurrency(payment.monthlyFee, currency), 190, finalY + 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Amount Paid:', 130, finalY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(formatPdfCurrency(payment.collectedAmount, currency), 190, finalY + 11, { align: 'right' });

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(130, finalY + 16, 190, finalY + 16);

  // Remaining Due
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  if (payment.remainingDue > 0) {
    doc.setTextColor(225, 29, 72); // Rose-600
  } else {
    doc.setTextColor(71, 85, 105);
  }
  doc.text('Remaining Due:', 130, finalY + 23);
  doc.text(formatPdfCurrency(payment.remainingDue, currency), 190, finalY + 23, { align: 'right' });

  // 6. Footer (Clean and simple at the bottom)
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(20, 265, 190, 265);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 118, 110);
  doc.text(settings.receiptFooter || 'Thank you for staying fit with Fitness Care Gym! Stay Strong.', 105, 271, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Payment Receipt • Fitness Care Gym Management System • 100% Offline PWA', 105, 276, { align: 'center' });

  doc.save(`Receipt-${member.memberId}-${payment.year}-${payment.month}.pdf`);
}

export function generateMemberProfilePDF(
  member: Member,
  payments: Payment[],
  settings: GymSettings
) {
  const doc = new jsPDF();
  const currency = settings.currency || '৳';

  // Header
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(settings.gymName || 'Fitness Care Gym', 14, 18);
  doc.setFontSize(11);
  doc.text('MEMBER PROFILE REPORT', 140, 18);

  // Profile Details
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.text(`${member.name} (${member.memberId})`, 14, 40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Phone: ${member.phone}`, 14, 48);
  doc.text(`Address: ${member.address || 'N/A'}`, 14, 54);
  doc.text(`Joining Date: ${formatDate(member.joiningDate)}`, 14, 60);
  doc.text(`Status: ${member.status.toUpperCase()}`, 14, 66);

  doc.text(`Monthly Fee: ${formatPdfCurrency(member.monthlyFee, currency)}`, 110, 48);
  doc.text(`Weight: ${member.weight} kg`, 110, 54);
  doc.text(`Height: ${member.height} cm`, 110, 60);
  doc.text(`Gender: ${member.gender}`, 110, 66);

  // Payment History
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Payment History', 14, 80);

  const tableRows = payments.map(p => [
    `${getMonthName(p.month)} ${p.year}`,
    formatPdfCurrency(p.monthlyFee, currency),
    formatPdfCurrency(p.collectedAmount, currency),
    formatPdfCurrency(p.remainingDue, currency),
    p.status,
    p.paymentDate ? formatDate(p.paymentDate) : '-',
    p.paymentMethod,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Month', 'Fee', 'Collected', 'Due', 'Status', 'Date', 'Method']],
    body: tableRows,
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 9,
    },
  });

  doc.save(`Member-Profile-${member.memberId}.pdf`);
}

export function generateCollectionReportPDF(
  title: string,
  payments: Payment[],
  members: Member[],
  settings: GymSettings,
  totalExpenses: number = 0
) {
  const doc = new jsPDF();
  const currency = settings.currency || '৳';
  const memberMap = new Map(members.map(m => [m.id, m]));

  let totalFee = 0;
  let totalCollected = 0;
  let totalDue = 0;

  const rows = payments.map(p => {
    const member = memberMap.get(p.memberId);
    totalFee += p.monthlyFee;
    totalCollected += p.collectedAmount;
    totalDue += p.remainingDue;

    return [
      member ? member.memberId : '-',
      member ? member.name : 'Unknown',
      `${getMonthName(p.month)} ${p.year}`,
      formatPdfCurrency(p.monthlyFee, currency),
      formatPdfCurrency(p.collectedAmount, currency),
      formatPdfCurrency(p.remainingDue, currency),
      p.status,
      p.paymentMethod,
    ];
  });

  const netProfit = totalCollected - totalExpenses;

  // Header
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(settings.gymName || 'Fitness Care Gym', 14, 18);
  doc.setFontSize(10);
  doc.text('FINANCIAL & COLLECTION REPORT', 135, 18);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.text(title, 14, 38);

  // Summary box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, 42, 182, 24, 2, 2, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Gross Collection: ${formatPdfCurrency(totalCollected, currency)}`, 18, 51);
  doc.text(`Gym Expenses: -${formatPdfCurrency(totalExpenses, currency)}`, 80, 51);
  doc.text(`Net Income: ${formatPdfCurrency(netProfit, currency)}`, 140, 51);
  doc.text(`Outstanding Due: ${formatPdfCurrency(totalDue, currency)}`, 18, 59);

  autoTable(doc, {
    startY: 72,
    head: [['Member ID', 'Name', 'Month', 'Fee', 'Collected', 'Due', 'Status', 'Method']],
    body: rows,
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 8.5,
    },
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}
