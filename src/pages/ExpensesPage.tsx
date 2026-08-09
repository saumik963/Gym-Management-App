import React, { useState, useMemo } from 'react';
import { Expense, Payment } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { 
  Plus, 
  Search, 
  Receipt, 
  Trash2, 
  Edit3, 
  TrendingDown, 
  DollarSign, 
  Wallet,
  Calendar,
  Filter
} from 'lucide-react';

interface ExpensesPageProps {
  expenses: Expense[];
  payments: Payment[];
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Expense>;
  onUpdateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  addToast?: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string }) => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  payments,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  addToast,
}) => {
  const { settings } = useSettings();
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchMonth = selectedMonth === 0 || e.month === selectedMonth;
      const matchYear = selectedYear === 0 || e.year === selectedYear;
      const matchCategory = selectedCategory === 'all' || e.expenseType === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.expenseType.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q));

      return matchMonth && matchYear && matchCategory && matchSearch;
    });
  }, [expenses, selectedMonth, selectedYear, selectedCategory, searchQuery]);

  // Calculations for selected period
  const totalExpensesPeriod = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Collections for selected month & year (if month filter applied) or selected year
  const totalCollectionsPeriod = useMemo(() => {
    return payments
      .filter((p) => {
        const matchMonth = selectedMonth === 0 || p.month === selectedMonth;
        const matchYear = selectedYear === 0 || p.year === selectedYear;
        return matchMonth && matchYear;
      })
      .reduce((sum, p) => sum + p.collectedAmount, 0);
  }, [payments, selectedMonth, selectedYear]);

  const netProfit = totalCollectionsPeriod - totalExpensesPeriod;

  // Unique categories in dataset
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    expenses.forEach((e) => cats.add(e.expenseType));
    return Array.from(cats);
  }, [expenses]);

  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    try {
      await onDeleteExpense(deletingExpense.id);
      addToast?.({
        type: 'info',
        title: 'Expense Deleted',
        message: `Expense "${deletingExpense.title}" was removed.`,
      });
    } catch (err) {
      addToast?.({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not remove expense.',
      });
    } finally {
      setDeletingExpense(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Month, Year & Category selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              <option value={0}>All Months</option>
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
              <option value={0}>All Years</option>
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Add Expense CTA Button */}
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search expenses by title, category, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Summary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {/* Total Collections */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Total Fee Collections</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white block mt-0.5">
              {formatCurrency(totalCollectionsPeriod, settings.currency)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {selectedMonth ? `${getMonthName(selectedMonth)} ${selectedYear}` : 'Selected Period'}
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Total Operating Expenses</span>
            <span className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 block mt-0.5">
              {formatCurrency(totalExpensesPeriod, settings.currency)}
            </span>
            <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">
              {filteredExpenses.length} Expense Records
            </span>
          </div>
        </div>

        {/* Net Profit / Net Income */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${
            netProfit >= 0 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
          }`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Net Income (Profit After Expenses)</span>
            <span className={`text-xl sm:text-2xl font-bold block mt-0.5 ${
              netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(netProfit, settings.currency)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Collections - Expenses
            </span>
          </div>
        </div>
      </div>

      {/* Expenses List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Expense Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Applied Month</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-xs">No gym expenses recorded for this selection.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click <strong className="text-emerald-600 dark:text-emerald-400">Add Expense</strong> above to log rent, electricity, salaries, or repairs.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 pl-5 font-bold text-slate-900 dark:text-white">
                      {exp.title}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60">
                        {exp.expenseType}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {getMonthName(exp.month)} {exp.year}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {formatDate(exp.date)}
                    </td>
                    <td className="p-3.5 font-bold text-rose-600 dark:text-rose-400 text-sm">
                      {formatCurrency(exp.amount, settings.currency)}
                    </td>
                    <td className="p-3.5 text-slate-500 max-w-xs truncate">
                      {exp.notes || '-'}
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditingExpense(exp);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Expense"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingExpense(exp)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Add / Edit Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        expenseToEdit={editingExpense}
        onSave={async (data) => {
          await onAddExpense(data);
          addToast?.({
            type: 'success',
            title: 'Expense Recorded',
            message: `Expense "${data.title}" of ${formatCurrency(data.amount, settings.currency)} added.`,
          });
        }}
        onUpdate={async (id, data) => {
          await onUpdateExpense(id, data);
          addToast?.({
            type: 'success',
            title: 'Expense Updated',
            message: 'Expense details updated successfully.',
          });
        }}
      />

      {/* Expense Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Expense Record?"
        message={`Are you sure you want to delete expense "${deletingExpense?.title}" of ${deletingExpense ? formatCurrency(deletingExpense.amount, settings.currency) : ''}? This action cannot be undone.`}
        confirmText="Delete Expense"
        isDanger={true}
      />
    </div>
  );
};
