import React, { useState, useMemo } from 'react';
import { Member, Payment, Expense } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { generateCollectionReportPDF } from '../services/pdfService';
import { exportPaymentsCSV } from '../services/exportImportService';
import { Printer, Download, FileSpreadsheet, Search, Filter, Calendar, Receipt, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';

interface ReportsPageProps {
  members: Member[];
  payments: Payment[];
  expenses?: Expense[];
}

type ReportRange = 'daily' | 'monthly' | 'yearly' | 'custom';

export const ReportsPage: React.FC<ReportsPageProps> = ({ members, payments, expenses = [] }) => {
  const { settings } = useSettings();
  const now = new Date();

  const [rangeType, setRangeType] = useState<ReportRange>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [startDate, setStartDate] = useState<string>(now.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(now.toISOString().split('T')[0]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Partial' | 'Unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter payments based on range type and filters
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Range Filter
      let matchRange = false;
      if (rangeType === 'monthly') {
        matchRange = p.month === selectedMonth && p.year === selectedYear;
      } else if (rangeType === 'yearly') {
        matchRange = p.year === selectedYear;
      } else if (rangeType === 'daily') {
        const todayStr = new Date().toISOString().split('T')[0];
        matchRange = p.paymentDate ? p.paymentDate.startsWith(todayStr) : false;
      } else if (rangeType === 'custom') {
        if (!p.paymentDate) return false;
        matchRange = p.paymentDate >= startDate && p.paymentDate <= endDate;
      }

      // Status Filter
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;

      // Member Search
      const member = members.find(m => m.id === p.memberId);
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        p.id.toLowerCase().includes(query) ||
        (member && (member.name.toLowerCase().includes(query) || member.memberId.toLowerCase().includes(query)));

      return matchRange && matchStatus && matchSearch;
    });
  }, [payments, members, rangeType, selectedMonth, selectedYear, startDate, endDate, statusFilter, searchQuery]);

  // Filter expenses based on range type
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (rangeType === 'monthly') {
        return e.month === selectedMonth && e.year === selectedYear;
      } else if (rangeType === 'yearly') {
        return e.year === selectedYear;
      } else if (rangeType === 'daily') {
        const todayStr = new Date().toISOString().split('T')[0];
        return e.date ? e.date.startsWith(todayStr) : false;
      } else if (rangeType === 'custom') {
        if (!e.date) return false;
        return e.date >= startDate && e.date <= endDate;
      }
      return true;
    });
  }, [expenses, rangeType, selectedMonth, selectedYear, startDate, endDate]);

  // Financial Summaries
  const totalFee = filteredPayments.reduce((acc, p) => acc + p.monthlyFee, 0);
  const totalCollected = filteredPayments.reduce((acc, p) => acc + p.collectedAmount, 0);
  const totalDue = filteredPayments.reduce((acc, p) => acc + p.remainingDue, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalCollected - totalExpenses;

  const paidCount = filteredPayments.filter(p => p.status === 'Paid').length;
  const partialCount = filteredPayments.filter(p => p.status === 'Partial').length;
  const unpaidCount = filteredPayments.filter(p => p.status === 'Unpaid').length;

  // Chart data
  const pieData = [
    { name: 'Paid', value: paidCount, color: '#10b981' },
    { name: 'Partial', value: partialCount, color: '#f59e0b' },
    { name: 'Unpaid', value: unpaidCount, color: '#ef4444' },
  ];

  const handleExportPDF = () => {
    generateCollectionReportPDF(
      `Gym Financial Collection Report (${rangeType.toUpperCase()})`,
      filteredPayments,
      members,
      settings,
      totalExpenses
    );
  };

  const handleExportCSV = async () => {
    const csv = await exportPaymentsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gym_Payments_Report_${rangeType}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Range Selector Pills */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            {(['daily', 'monthly', 'yearly', 'custom'] as ReportRange[]).map((type) => (
              <button
                key={type}
                onClick={() => setRangeType(type)}
                className={`px-3.5 py-2 rounded-lg capitalize transition-all ${
                  rangeType === type
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Export & Print */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Dynamic Controls based on Range */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {rangeType === 'monthly' && (
            <div className="flex items-center space-x-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
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
                className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {rangeType === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}

          {rangeType === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
          >
            <option value="all">Status: All</option>
            <option value="Paid">Paid Only</option>
            <option value="Partial">Partial Only</option>
            <option value="Unpaid">Unpaid Only</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-xs">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-slate-400 block font-medium text-[11px]">Gross Collection</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatCurrency(totalCollected, settings.currency)}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
            {paidCount} Members Paid
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-slate-400 block font-medium text-[11px]">Gym Expenses</span>
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1 block">
            -{formatCurrency(totalExpenses, settings.currency)}
          </span>
          <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">
            {filteredExpenses.length} Expense Entries
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-slate-400 block font-medium text-[11px]">Net Income (Profit)</span>
          <span className={`text-lg font-bold mt-1 block ${
            netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(netProfit, settings.currency)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Collected - Expenses
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-slate-400 block font-medium text-[11px]">Outstanding Due</span>
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1 block">
            {formatCurrency(totalDue, settings.currency)}
          </span>
          <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">
            {unpaidCount + partialCount} Members Due
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-slate-400 block font-medium text-[11px]">Collection Rate</span>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
            {totalFee > 0 ? Math.round((totalCollected / totalFee) * 100) : 0}%
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Overall Rate</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
            Payment Status Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
            Financial & Net Income Summary
          </h3>
          <div className="space-y-3 text-xs pt-1">
            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Gross Collection ({paidCount} Paid Members)
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                +{formatCurrency(totalCollected, settings.currency)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-800/40">
              <span className="font-semibold text-rose-800 dark:text-rose-300">
                Total Expenses ({filteredExpenses.length} Items)
              </span>
              <span className="font-bold text-rose-700 dark:text-rose-400">
                -{formatCurrency(totalExpenses, settings.currency)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                Net Profit / Income
              </span>
              <span className={`font-black text-sm ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(netProfit, settings.currency)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
              <span>Outstanding Member Dues ({unpaidCount + partialCount} Members)</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(totalDue, settings.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Member ID</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Period</th>
                <th className="p-3.5">Fee</th>
                <th className="p-3.5">Collected</th>
                <th className="p-3.5">Due</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    No payment records match the current report filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const member = members.find(m => m.id === p.memberId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-900 dark:text-white">
                        {member ? member.memberId : '-'}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {member ? member.name : 'Unknown'}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
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
                      <td className="p-3.5 pr-5 text-slate-500">
                        {formatDate(p.paymentDate)}
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
