import React, { useState, useEffect } from 'react';
import { Member, Payment } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { formatCurrency, getMonthName } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { MemberAvatar } from '../common/MemberAvatar';
import { generateCollectionReportPDF } from '../../services/pdfService';
import { Save, Printer, Download, Search, Check, RefreshCw } from 'lucide-react';

interface BulkPaymentViewProps {
  members: Member[];
  payments: Payment[];
  onSavePayment: (paymentData: any) => Promise<Payment | undefined>;
}

export const BulkPaymentView: React.FC<BulkPaymentViewProps> = ({
  members,
  payments,
  onSavePayment,
}) => {
  const { settings } = useSettings();
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  // Local draft state for bulk edits: memberId -> string amount
  const [draftCollections, setDraftCollections] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const activeMembers = members.filter(m => m.status === 'active');

  // Initialize draft inputs when month/year changes or payments update
  useEffect(() => {
    const initialDrafts: Record<string, string> = {};
    activeMembers.forEach(m => {
      const existing = payments.find(p => p.memberId === m.id && p.month === selectedMonth && p.year === selectedYear);
      initialDrafts[m.id] = existing ? existing.collectedAmount.toString() : '0';
    });
    setDraftCollections(initialDrafts);
  }, [selectedMonth, selectedYear, members, payments]);

  const handleInputChange = (memberId: string, val: string) => {
    setDraftCollections(prev => ({ ...prev, [memberId]: val }));
  };

  const handleBulkSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      for (const member of activeMembers) {
        const valStr = draftCollections[member.id] || '0';
        const numVal = parseFloat(valStr) || 0;

        await onSavePayment({
          memberId: member.id,
          month: selectedMonth,
          year: selectedYear,
          monthlyFee: member.monthlyFee,
          collectedAmount: numVal,
          paymentMethod: 'Cash',
          paymentDate: new Date().toISOString().split('T')[0],
          notes: 'Bulk payment entry',
        });
      }
      setSaveSuccessMsg('All payment records updated successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Bulk save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered members list
  const filteredList = activeMembers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrintReport = () => {
    const monthPayments = payments.filter(p => p.month === selectedMonth && p.year === selectedYear);
    generateCollectionReportPDF(
      `Monthly Collection Report (${getMonthName(selectedMonth)} ${selectedYear})`,
      monthPayments,
      members,
      settings
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Selectors */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          {saveSuccessMsg && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>{saveSuccessMsg}</span>
            </span>
          )}

          <button
            onClick={handlePrintReport}
            className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Report</span>
            <span className="sm:hidden">Print</span>
          </button>

          <button
            onClick={handleBulkSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Bulk Save</span>
          </button>
        </div>
      </div>

      {/* Grid Table & Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Mobile View (< md) */}
        <div className="md:hidden p-3 space-y-3">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No active members found for collection entry.
            </div>
          ) : (
            filteredList.map((m) => {
              const draftVal = draftCollections[m.id] ?? '0';
              const collectedNum = parseFloat(draftVal) || 0;
              const remainingDue = m.monthlyFee - collectedNum;

              let status: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
              if (collectedNum >= m.monthlyFee) status = 'Paid';
              else if (collectedNum > 0) status = 'Partial';

              return (
                <div
                  key={m.id}
                  className="bg-slate-50/60 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <MemberAvatar member={m} size="xs" rounded="lg" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm block">
                          {m.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {m.memberId} • Fee: {formatCurrency(m.monthlyFee, settings.currency)}
                        </span>
                      </div>
                    </div>
                    <Badge status={status} />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={draftVal}
                        onChange={(e) => handleInputChange(m.id, e.target.value)}
                        className="w-24 px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange(m.id, m.monthlyFee.toString())}
                        className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                      >
                        Full
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Due</span>
                      <span className="font-bold">
                        {remainingDue > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatCurrency(remainingDue, settings.currency)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">0</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Member ID</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Fee</th>
                <th className="p-3.5">Collected Amount</th>
                <th className="p-3.5">Remaining Due</th>
                <th className="p-3.5 pr-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No active members found for collection entry.
                  </td>
                </tr>
              ) : (
                filteredList.map((m) => {
                  const draftVal = draftCollections[m.id] ?? '0';
                  const collectedNum = parseFloat(draftVal) || 0;
                  const remainingDue = m.monthlyFee - collectedNum;

                  let status: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
                  if (collectedNum >= m.monthlyFee) status = 'Paid';
                  else if (collectedNum > 0) status = 'Partial';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-900 dark:text-white">
                        {m.memberId}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          <MemberAvatar member={m} size="xs" rounded="lg" />
                          <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400">{m.phone}</td>
                      <td className="p-3.5 font-semibold">
                        {formatCurrency(m.monthlyFee, settings.currency)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            value={draftVal}
                            onChange={(e) => handleInputChange(m.id, e.target.value)}
                            className="w-28 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleInputChange(m.id, m.monthlyFee.toString())}
                            className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                            title="Set full payment"
                          >
                            Full
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold">
                        {remainingDue > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatCurrency(remainingDue, settings.currency)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">0</span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5">
                        <Badge status={status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
