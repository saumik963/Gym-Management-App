import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Expense, ExpenseCategory } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { DollarSign, Tag, Calendar, FileText, PlusCircle } from 'lucide-react';
import { getMonthName } from '../../utils/formatters';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (id: string, expenseData: Partial<Expense>) => Promise<void>;
  expenseToEdit?: Expense | null;
}

const CATEGORIES: ExpenseCategory[] = [
  'Rent',
  'Electricity Bill',
  'Water Bill',
  'Trainer Salary',
  'Staff Salary',
  'Equipment Purchase',
  'Equipment Repair',
  'Internet & Utility',
  'Marketing & Ads',
  'Cleaning & Supplies',
  'Other',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  expenseToEdit,
}) => {
  const { settings } = useSettings();
  const now = new Date();

  const [title, setTitle] = useState('');
  const [expenseType, setExpenseType] = useState<string>('Rent');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [date, setDate] = useState<string>(now.toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setTitle(expenseToEdit.title);
        if (CATEGORIES.includes(expenseToEdit.expenseType as ExpenseCategory)) {
          setExpenseType(expenseToEdit.expenseType);
          setCustomCategory('');
        } else {
          setExpenseType('Other');
          setCustomCategory(expenseToEdit.expenseType);
        }
        setAmount(expenseToEdit.amount.toString());
        setMonth(expenseToEdit.month);
        setYear(expenseToEdit.year);
        setDate(expenseToEdit.date || now.toISOString().split('T')[0]);
        setNotes(expenseToEdit.notes || '');
      } else {
        setTitle('');
        setExpenseType('Rent');
        setCustomCategory('');
        setAmount('');
        setMonth(now.getMonth() + 1);
        setYear(now.getFullYear());
        setDate(now.toISOString().split('T')[0]);
        setNotes('');
      }
      setError(null);
    }
  }, [isOpen, expenseToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive expense amount.');
      return;
    }

    const finalTitle = title.trim() || `${expenseType} - ${getMonthName(month)} ${year}`;
    const finalType = expenseType === 'Other' && customCategory.trim() ? customCategory.trim() : expenseType;

    setIsSubmitting(true);
    try {
      if (expenseToEdit && onUpdate) {
        await onUpdate(expenseToEdit.id, {
          title: finalTitle,
          expenseType: finalType,
          amount: numAmount,
          month,
          year,
          date,
          notes: notes.trim(),
        });
      } else {
        await onSave({
          title: finalTitle,
          expenseType: finalType,
          amount: numAmount,
          month,
          year,
          date,
          notes: notes.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Gym Expense' : 'Record Gym Expense'}
      subtitle="Add operational costs to deduct from monthly collections."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-600 dark:text-rose-400 font-semibold">
            {error}
          </div>
        )}

        {/* Expense Category & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Category *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Title / Item Name
            </label>
            <input
              type="text"
              placeholder="e.g. Electricity Bill, Floor Rent..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Custom Category if "Other" is selected */}
        {expenseType === 'Other' && (
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Category Name *
            </label>
            <input
              type="text"
              placeholder="Enter custom expense type..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        )}

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount ({settings.currency}) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (e.target.value) {
                    const d = new Date(e.target.value);
                    if (!isNaN(d.getTime())) {
                      setMonth(d.getMonth() + 1);
                      setYear(d.getFullYear());
                    }
                  }
                }}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Month & Year Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Applied Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
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
              Applied Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes / Details
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. Paid via Bkash / Cash receipt #104..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : expenseToEdit ? 'Update Expense' : 'Save Expense'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
