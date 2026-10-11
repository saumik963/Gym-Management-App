import React from 'react';
import { Modal } from './Modal';
import { Member, Payment } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { formatCurrency, formatDate, getMonthName } from '../../utils/formatters';
import { generatePaymentReceiptPDF } from '../../services/pdfService';
import { openWhatsAppInvoice } from '../../utils/whatsapp';
import { Printer, Download, MessageCircle } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member;
  payment?: Payment;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  member,
  payment,
}) => {
  const { settings } = useSettings();

  if (!member || !payment) return null;

  const handleDownloadPdf = () => {
    generatePaymentReceiptPDF(member, payment, settings);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    // Auto-generate PDF receipt for member download/attachment
    generatePaymentReceiptPDF(member, payment, settings);
    // Open WhatsApp with prefilled structured invoice text
    openWhatsAppInvoice(member, payment, settings);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Receipt" maxWidth="md">
      <div className="space-y-4">
        {/* Printable 58mm Thermal Receipt Container */}
        <div className="thermal-receipt bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 space-y-2.5 shadow-xs">
          
          {/* On-screen only top header with Gym Logo & Status Pill */}
          <div className="flex items-center justify-between no-print pb-1">
            <div className="flex items-center space-x-2.5">
              {settings.gymLogo && (
                <img
                  src={settings.gymLogo}
                  alt="Gym Logo"
                  className="w-10 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Receipt #{payment.id}
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {formatDate(payment.paymentDate || new Date().toISOString())}
                </span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                payment.status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : payment.status === 'Partial'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {payment.status.toUpperCase()}
            </span>
          </div>

          {/* Centered Gym Name & Receipt Heading (Printed & On-Screen) */}
          <div className="text-center space-y-0.5">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white print:text-[13px] print:leading-tight uppercase tracking-tight">
              {settings.gymName || 'Fitness Care Gym'}
            </h3>
            <p className="font-semibold text-xs text-slate-500 dark:text-slate-400 print:text-[11px] print:text-black uppercase tracking-wider">
              Official Payment Receipt
            </p>
          </div>

          {/* Receipt ID & Date (Print Only compact header line) */}
          <div className="hidden print:flex justify-between items-baseline text-[9px] text-black">
            <span>Receipt: #{payment.id}</span>
            <span>Date: {formatDate(payment.paymentDate || new Date().toISOString())}</span>
          </div>

          {/* Thin dashed separator */}
          <div className="thermal-divider border-b border-dashed border-slate-300 dark:border-slate-700 print:border-black my-2 print:my-1" />

          {/* Member Details */}
          <div className="space-y-1.5 print:space-y-0.5 text-xs print:text-[10px]">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-slate-500 dark:text-slate-400 print:text-black font-medium shrink-0">
                Member:
              </span>
              <span className="font-bold text-slate-900 dark:text-white print:text-black text-right break-words">
                {member.name}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-slate-500 dark:text-slate-400 print:text-black font-medium shrink-0">
                Member ID:
              </span>
              <span className="font-bold text-slate-900 dark:text-white print:text-black text-right">
                {member.memberId}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-slate-500 dark:text-slate-400 print:text-black font-medium shrink-0">
                Phone:
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 print:text-black text-right">
                {member.phone}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-2 no-print">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                Payment Date:
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                {formatDate(payment.paymentDate || new Date().toISOString())}
              </span>
            </div>
          </div>

          {/* Thin dashed separator */}
          <div className="thermal-divider border-b border-dashed border-slate-300 dark:border-slate-700 print:border-black my-2 print:my-1" />

          {/* Payment Breakdown */}
          <div className="space-y-1.5 print:space-y-0.5 text-xs print:text-[10px]">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-slate-600 dark:text-slate-400 print:text-black font-medium">
                Billing Month:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white print:text-black text-right">
                {getMonthName(payment.month)} {payment.year}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-slate-600 dark:text-slate-400 print:text-black font-medium">
                Monthly Fee:
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200 print:text-black text-right">
                {formatCurrency(payment.monthlyFee, settings.currency)}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-2 font-bold text-emerald-600 dark:text-emerald-400 print:text-black print:text-[10.5px]">
              <span>Collected Amount:</span>
              <span className="text-right">
                {formatCurrency(payment.collectedAmount, settings.currency)}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-2 font-bold text-rose-600 dark:text-rose-400 print:text-black print:text-[10.5px]">
              <span>Remaining Due:</span>
              <span className="text-right">
                {formatCurrency(payment.remainingDue, settings.currency)}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-2 text-slate-600 dark:text-slate-400 print:text-black">
              <span className="font-medium">Payment Method:</span>
              <span className="font-medium text-right">{payment.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-slate-600 dark:text-slate-400 print:text-black font-medium">
                Payment Status:
              </span>
              <span className="font-bold uppercase text-right print:text-black">
                {payment.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Thin dashed separator */}
          <div className="thermal-divider border-b border-dashed border-slate-300 dark:border-slate-700 print:border-black my-2 print:my-1" />

          {/* Footer note */}
          <p className="text-[11px] print:text-[9px] print:leading-tight text-center text-slate-400 print:text-black italic print:not-italic pt-0.5">
            {settings.receiptFooter || 'Thank you for staying fit! Stay Strong.'}
          </p>
        </div>

        {/* Action buttons (Hidden during print) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 no-print">
          <button
            onClick={handleSendWhatsApp}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-emerald-600/20 active:scale-95"
            title="Send structured invoice message directly to member's WhatsApp and download PDF"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send to WhatsApp</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Print on 58mm Thermal Printer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt (58mm)</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
