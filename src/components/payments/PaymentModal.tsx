import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Member, Payment, PaymentMethod } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { formatCurrency, getMonthName } from '../../utils/formatters';
import { calculateMemberSummary } from '../../utils/calculations';
import { DollarSign, Search, Calendar, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  payments: Payment[];
  selectedMember?: Member | null;
  onSavePayment: (paymentData: any) => Promise<Payment | undefined>;
  onShowReceipt?: (member: Member, payment: Payment) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Bkash', 'Nagad', 'Card', 'Bank', 'Other'];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  members,
  payments,
  selectedMember: initialMember,
  onSavePayment,
  onShowReceipt,
}) => {
  const { settings } = useSettings();

  const now = new Date();
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(initialMember || null);

  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const [collectedInput, setCollectedInput] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(now.toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialMember) {
        setSelectedMember(initialMember);
      } else {
        setSelectedMember(null);
      }
      setMemberSearch('');
      setError(null);
    }
  }, [initialMember, isOpen]);

  // Compute existing payment for selected member, month, year
  const existingPayment = payments.find(
    p => p.memberId === selectedMember?.id && p.month === month && p.year === year
  );

  const monthlyFee = selectedMember?.monthlyFee || settings.defaultMonthlyFee || 1000;
  const alreadyPaid = existingPayment?.collectedAmount || 0;
  const remainingDue = monthlyFee - alreadyPaid;

  useEffect(() => {
    // Default fill collected input to remaining due
    if (remainingDue > 0) {
      setCollectedInput(remainingDue.toString());
    } else {
      setCollectedInput('0');
    }
  }, [selectedMember, month, year, remainingDue]);

  const isSearching = memberSearch.trim().length > 0;
  const filteredMembers = isSearching
    ? members.filter(m =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.memberId.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.phone.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : [];

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setError('Please select a member');
      return;
    }

    const enteredAmount = parseFloat(collectedInput) || 0;
    if (enteredAmount < 0) {
      setError('Amount cannot be negative');
      return;
    }

    const totalNewCollected = alreadyPaid + enteredAmount;
    if (totalNewCollected > monthlyFee) {
      setError(`Total collection (${totalNewCollected}) cannot exceed Monthly Fee (${monthlyFee})`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const saved = await onSavePayment({
        memberId: selectedMember.id,
        month,
        year,
        monthlyFee,
        collectedAmount: totalNewCollected,
        paymentDate,
        paymentMethod,
        notes,
      });

      onClose();
      if (saved && onShowReceipt) {
        onShowReceipt(selectedMember, saved);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collect Member Fee"
      subtitle="Record fee collection. Remaining dues and dashboards will update automatically."
      maxWidth="lg"
    >
      <form onSubmit={handleCollectSubmit} className="space-y-4 text-xs sm:text-sm">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Member Search & Selector */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Select Member
          </label>
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search member by name, ID, or phone..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {isSearching ? (
              filteredMembers.length > 0 ? (
                filteredMembers.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMember(m);
                      setMemberSearch('');
                    }}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      selectedMember?.id === m.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{m.memberId}</span>
                      <span className="font-medium">{m.name}</span>
                      <span className="text-[11px] text-slate-400">({m.phone})</span>
                    </div>
                    <span className="text-xs font-semibold">{formatCurrency(m.monthlyFee, settings.currency)}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No members found matching "{memberSearch}"
                </div>
              )
            ) : selectedMember ? (
              <div className="p-2.5 flex items-center justify-between bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[11px] font-bold">
                    {selectedMember.memberId}
                  </span>
                  <span className="font-bold text-sm">{selectedMember.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">({selectedMember.phone})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold">{formatCurrency(selectedMember.monthlyFee, settings.currency)}</span>
                  <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline font-semibold ml-1"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                Search member by name, ID, or phone number above...
              </div>
            )}
          </div>
        </div>

        {/* Month & Year Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {getMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Breakdown Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Monthly Fee</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {formatCurrency(monthlyFee, settings.currency)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Already Paid</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatCurrency(alreadyPaid, settings.currency)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Remaining Due</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
              {formatCurrency(remainingDue, settings.currency)}
            </span>
          </div>
        </div>

        {/* Collected Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Now Collecting Amount ({settings.currency}) *
            </label>
            {/* Quick Presets for Mobile/Fast Entry */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setCollectedInput(remainingDue.toString())}
                className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md hover:bg-emerald-200"
              >
                Full Due
              </button>
              <button
                type="button"
                onClick={() => setCollectedInput(Math.round(monthlyFee / 2).toString())}
                className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md hover:bg-slate-200"
              >
                Half Fee
              </button>
              <button
                type="button"
                onClick={() => setCollectedInput('0')}
                className="px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="number"
              value={collectedInput}
              onChange={(e) => setCollectedInput(e.target.value)}
              placeholder="0"
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-base focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Payment Date & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Payment Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="Transaction ID, reference note, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Payment & Print'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
