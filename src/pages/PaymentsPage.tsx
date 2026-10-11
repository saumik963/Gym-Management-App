import React, { useState } from 'react';
import { Member, Payment } from '../types';
import { BulkPaymentView } from '../components/payments/BulkPaymentView';
import { Badge } from '../components/common/Badge';
import { MemberAvatar } from '../components/common/MemberAvatar';
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters';
import { useSettings } from '../contexts/SettingsContext';
import { generatePaymentReceiptPDF } from '../services/pdfService';
import { CreditCard, Grid, ListFilter, Printer, Plus } from 'lucide-react';

interface PaymentsPageProps {
  members: Member[];
  payments: Payment[];
  onQuickCollectPayment: () => void;
  onSavePayment: (paymentData: any) => Promise<Payment | undefined>;
  onShowReceipt: (member: Member, payment: Payment) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({
  members,
  payments,
  onQuickCollectPayment,
  onSavePayment,
  onShowReceipt,
}) => {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'bulk' | 'history'>('bulk');
  const [historySearch, setHistorySearch] = useState('');

  const filteredHistory = payments
    .filter(p => {
      const member = members.find(m => m.id === p.memberId);
      const query = historySearch.toLowerCase();
      if (!query) return true;
      return (
        member?.name.toLowerCase().includes(query) ||
        member?.memberId.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.paymentMethod.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Monthly Grid Collection</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Payment Audit History</span>
          </button>
        </div>

        {/* Quick Payment Button */}
        <button
          onClick={onQuickCollectPayment}
          className="inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-indigo-600/20"
        >
          <CreditCard className="w-4 h-4" />
          <span>Single Payment Entry</span>
        </button>
      </div>

      {activeTab === 'bulk' ? (
        <BulkPaymentView
          members={members}
          payments={payments}
          onSavePayment={onSavePayment}
        />
      ) : (
        /* Payment History Audit Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800">
            <input
              type="text"
              placeholder="Search history by member name, ID, receipt ID..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full max-w-md px-3.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-5">Receipt ID</th>
                  <th className="p-3.5">Member</th>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Fee</th>
                  <th className="p-3.5">Collected</th>
                  <th className="p-3.5">Due</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5 pr-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      No payment records found in audit logs.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((p) => {
                    const member = members.find(m => m.id === p.memberId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 pl-5 font-mono text-slate-500 text-xs">
                          {p.id}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2.5">
                            <MemberAvatar member={member} size="xs" rounded="lg" />
                            <span className="font-bold text-slate-900 dark:text-white">
                              {member ? member.name : 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          {getMonthName(p.month)} {p.year}
                        </td>
                        <td className="p-3.5">{formatCurrency(p.monthlyFee, settings.currency)}</td>
                        <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.collectedAmount, settings.currency)}
                        </td>
                        <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(p.remainingDue, settings.currency)}
                        </td>
                        <td className="p-3.5">
                          <Badge status={p.status} />
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {formatDate(p.paymentDate || p.updatedAt)}
                        </td>
                        <td className="p-3.5 font-medium">{p.paymentMethod}</td>
                        <td className="p-3.5 pr-5 text-right">
                          {member && (
                            <button
                              onClick={() => onShowReceipt(member, p)}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                            >
                              Print
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
