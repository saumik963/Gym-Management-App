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
      <div className="space-y-5 print:p-0">
        {/* Printable Area */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 space-y-4">
          {/* Receipt Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <div className="flex items-center space-x-3">
              {settings.gymLogo && (
                <img
                  src={settings.gymLogo}
                  alt="Gym Logo"
                  className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {settings.gymName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receipt ID: #{payment.id}
                </p>
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

          {/* Member Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Member Name</span>
              <span className="font-bold text-slate-900 dark:text-white">{member.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Member ID</span>
              <span className="font-bold text-slate-900 dark:text-white">{member.memberId}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Phone</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{member.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Payment Date</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatDate(payment.paymentDate || new Date().toISOString())}
              </span>
            </div>
          </div>

          {/* Payment Summary Box */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
              <span>Billing Month:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {getMonthName(payment.month)} {payment.year}
              </span>
            </div>
            <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
              <span>Monthly Fee:</span>
              <span>{formatCurrency(payment.monthlyFee, settings.currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Collected Amount:</span>
              <span>{formatCurrency(payment.collectedAmount, settings.currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400">
              <span>Remaining Due:</span>
              <span>{formatCurrency(payment.remainingDue, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1">
              <span>Payment Method:</span>
              <span className="font-semibold">{payment.paymentMethod}</span>
            </div>
          </div>

          <p className="text-[11px] text-center text-slate-400 italic">
            {settings.receiptFooter || 'Thank you for your payment!'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
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
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
