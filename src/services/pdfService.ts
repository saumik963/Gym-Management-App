import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Member, Payment, GymSettings } from '../types';
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters';

export function generatePaymentReceiptPDF(
  member: Member,
  payment: Payment,
  settings: GymSettings
) {
  const doc = new jsPDF();
  const primaryColor = [16, 185, 129]; // Emerald primary accent

  // Header Box
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 32, 'F');

  // Gym Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(settings.gymName || 'Gym Management', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL PAYMENT RECEIPT', 150, 20);

  // Receipt Meta Info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.text(`Receipt No: ${payment.id}`, 14, 42);
  doc.text(`Date: ${formatDate(payment.paymentDate || new Date().toISOString())}`, 14, 48);
  doc.text(`Payment Method: ${payment.paymentMethod}`, 14, 54);

  // Member Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, 62, 182, 36, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MEMBER DETAILS', 20, 72);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Member ID: ${member.memberId}`, 20, 80);
  doc.text(`Name: ${member.name}`, 20, 86);
  doc.text(`Phone: ${member.phone}`, 110, 80);
  doc.text(`Status: ${member.status.toUpperCase()}`, 110, 86);

  // Payment Breakdown Table
  autoTable(doc, {
    startY: 106,
    head: [['Description', 'Month / Year', 'Monthly Fee', 'Paid Amount', 'Remaining Due']],
    body: [
      [
        'Gym Membership Monthly Fee',
        `${getMonthName(payment.month)} ${payment.year}`,
        formatCurrency(payment.monthlyFee, settings.currency),
        formatCurrency(payment.collectedAmount, settings.currency),
        formatCurrency(payment.remainingDue, settings.currency),
      ],
    ],
    headStyles: {
      fillColor: primaryColor as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 6,
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // Status Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  if (payment.status === 'Paid') {
    doc.setTextColor(16, 185, 129);
    doc.text('STATUS: FULLY PAID', 14, finalY);
  } else if (payment.status === 'Partial') {
    doc.setTextColor(245, 158, 11);
    doc.text('STATUS: PARTIAL PAYMENT', 14, finalY);
  } else {
    doc.setTextColor(239, 68, 68);
    doc.text('STATUS: UNPAID', 14, finalY);
  }

  // Footer / Signatures
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(settings.receiptFooter || 'Thank you for your payment!', 14, 270);

  doc.setDrawColor(200, 200, 200);
  doc.line(140, 260, 196, 260);
  doc.text('Authorized Signature', 145, 266);

  doc.save(`Receipt-${member.memberId}-${payment.year}-${payment.month}.pdf`);
}

export function generateMemberProfilePDF(
  member: Member,
  payments: Payment[],
  settings: GymSettings
) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(settings.gymName || 'Gym Management', 14, 18);
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

  doc.text(`Monthly Fee: ${formatCurrency(member.monthlyFee, settings.currency)}`, 110, 48);
  doc.text(`Weight: ${member.weight} kg`, 110, 54);
  doc.text(`Height: ${member.height} cm`, 110, 60);
  doc.text(`Gender: ${member.gender}`, 110, 66);

  // Payment History
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Payment History', 14, 80);

  const tableRows = payments.map(p => [
    `${getMonthName(p.month)} ${p.year}`,
    formatCurrency(p.monthlyFee, settings.currency),
    formatCurrency(p.collectedAmount, settings.currency),
    formatCurrency(p.remainingDue, settings.currency),
    p.status,
    p.paymentDate ? formatDate(p.paymentDate) : '-',
    p.paymentMethod,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Month', 'Fee', 'Collected', 'Due', 'Status', 'Date', 'Method']],
    body: tableRows,
    headStyles: {
      fillColor: [16, 185, 129],
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
      formatCurrency(p.monthlyFee, settings.currency),
      formatCurrency(p.collectedAmount, settings.currency),
      formatCurrency(p.remainingDue, settings.currency),
      p.status,
      p.paymentMethod,
    ];
  });

  const netProfit = totalCollected - totalExpenses;

  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(settings.gymName || 'Gym Management', 14, 18);
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
  doc.text(`Gross Collection: ${formatCurrency(totalCollected, settings.currency)}`, 18, 51);
  doc.text(`Gym Expenses: -${formatCurrency(totalExpenses, settings.currency)}`, 80, 51);
  doc.text(`Net Income: ${formatCurrency(netProfit, settings.currency)}`, 140, 51);
  doc.text(`Outstanding Due: ${formatCurrency(totalDue, settings.currency)}`, 18, 59);

  autoTable(doc, {
    startY: 72,
    head: [['Member ID', 'Name', 'Month', 'Fee', 'Collected', 'Due', 'Status', 'Method']],
    body: rows,
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 8.5,
    },
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}
