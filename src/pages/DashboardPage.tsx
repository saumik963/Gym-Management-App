import React from 'react';
import { Member, Payment, Expense } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { calculateDashboardStats } from '../utils/calculations';
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { seedSampleData } from '../database/sampleData';
import { 
  Users, 
  UserCheck, 
  UserX, 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  Plus, 
  CreditCard, 
  FileText, 
  DatabaseBackup,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Wallet
} from 'lucide-react';
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
  CartesianGrid 
} from 'recharts';

interface DashboardPageProps {
  members: Member[];
  payments: Payment[];
  expenses?: Expense[];
  onNavigate: (tab: any) => void;
  onQuickAddMember: () => void;
  onQuickCollectPayment: (member?: Member) => void;
  onViewMember: (member: Member) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  members,
  payments,
  expenses = [],
  onNavigate,
  onQuickAddMember,
  onQuickCollectPayment,
  onViewMember,
}) => {
  const { settings } = useSettings();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const stats = calculateDashboardStats(members, payments, currentMonth, currentYear);

  // Calculate expenses and net profit for current month
  const expensesThisMonth = expenses
    .filter(e => e.month === currentMonth && e.year === currentYear)
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfitThisMonth = stats.collectionThisMonth - expensesThisMonth;

  // Chart 1: Payment Status Pie Chart Data
  const currentMonthPayments = payments.filter(
    p => p.month === currentMonth && p.year === currentYear
  );

  const statusCounts = {
    Paid: currentMonthPayments.filter(p => p.status === 'Paid').length,
    Partial: currentMonthPayments.filter(p => p.status === 'Partial').length,
    Unpaid: currentMonthPayments.filter(p => p.status === 'Unpaid').length,
  };

  const pieData = [
    { name: 'Paid', value: statusCounts.Paid, color: '#10b981' },
    { name: 'Partial', value: statusCounts.Partial, color: '#f59e0b' },
    { name: 'Unpaid', value: statusCounts.Unpaid, color: '#ef4444' },
  ];

  // Chart 2: Monthly Collection Bar Chart Data (last 6 months)
  const barData = Array.from({ length: 6 }, (_, i) => {
    let m = currentMonth - 5 + i;
    let y = currentYear;
    if (m <= 0) {
      m += 12;
      y -= 1;
    }
    const monthPay = payments.filter(p => p.month === m && p.year === y);
    const collected = monthPay.reduce((acc, p) => acc + p.collectedAmount, 0);
    const due = monthPay.reduce((acc, p) => acc + p.remainingDue, 0);

    return {
      month: `${getMonthName(m).substring(0, 3)} ${y.toString().substring(2)}`,
      Collection: collected,
      Due: due,
    };
  });

  // Recent payments
  const recentPayments = [...payments]
    .filter(p => p.collectedAmount > 0)
    .sort((a, b) => new Date(b.paymentDate || b.updatedAt).getTime() - new Date(a.paymentDate || a.updatedAt).getTime())
    .slice(0, 5);

  // Recent members
  const recentMembers = [...members]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Upcoming due members
  const dueMembers = members
    .filter(m => m.status === 'active')
    .map(m => {
      const pay = currentMonthPayments.find(p => p.memberId === m.id);
      return {
        member: m,
        dueAmount: pay ? pay.remainingDue : m.monthlyFee,
      };
    })
    .filter(item => item.dueAmount > 0)
    .slice(0, 5);

  const handleSeedDemoData = async () => {
    if (confirm('Load sample demo gym members and payments for testing?')) {
      await seedSampleData(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Quick Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instant shortcuts for common gym operations
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onQuickAddMember}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
          <button
            onClick={onQuickCollectPayment}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span>Collect Fee</span>
          </button>
          <button
            onClick={() => onNavigate('expenses')}
            className="flex items-center space-x-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Expenses</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Reports</span>
          </button>
          <button
            onClick={() => onNavigate('import-export')}
            className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            <DatabaseBackup className="w-4 h-4" />
            <span>Backup</span>
          </button>
          {members.length === 0 && (
            <button
              onClick={handleSeedDemoData}
              className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-3 py-2 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Metric Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          subtitle={`Active: ${stats.activeMembers} | Inactive: ${stats.inactiveMembers}`}
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          onClick={() => onNavigate('members')}
        />

        <StatCard
          title="Monthly Collections"
          value={formatCurrency(stats.collectionThisMonth, settings.currency)}
          subtitle={`Gross for ${getMonthName(currentMonth)} ${currentYear}`}
          icon={<DollarSign className="w-5 h-5" />}
          iconBgColor="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          onClick={() => onNavigate('payments')}
        />

        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(expensesThisMonth, settings.currency)}
          subtitle="Total operational costs"
          icon={<Receipt className="w-5 h-5" />}
          iconBgColor="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          badgeText="Deducted"
          badgeType="danger"
          onClick={() => onNavigate('expenses')}
        />

        <StatCard
          title="Net Monthly Profit"
          value={formatCurrency(netProfitThisMonth, settings.currency)}
          subtitle="Collections minus expenses"
          icon={<Wallet className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          badgeText={netProfitThisMonth >= 0 ? 'Profit' : 'Loss'}
          badgeType={netProfitThisMonth >= 0 ? 'success' : 'danger'}
          onClick={() => onNavigate('reports')}
        />

        <StatCard
          title="Remaining Dues"
          value={formatCurrency(stats.totalDueAmount, settings.currency)}
          subtitle="Outstanding member fees"
          icon={<AlertCircle className="w-5 h-5" />}
          iconBgColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          badgeText="Action"
          badgeType="warning"
          onClick={() => onNavigate('payments')}
        />
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collection & Due Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Collection & Due Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparison over last 6 months
              </p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 hover:underline"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val), settings.currency)}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Collection" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Due" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Current Month Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paid vs Partial vs Unpaid
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {currentMonthPayments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No payments logged for current month</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Payments & Upcoming Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Recent Collections</h3>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {recentPayments.length === 0 ? (
              <p className="py-6 text-center text-slate-400 italic">No recent payments collected yet.</p>
            ) : (
              recentPayments.map((p) => {
                const member = members.find(m => m.id === p.memberId);
                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {member ? member.name : 'Gym Member'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {getMonthName(p.month)} {p.year} • {p.paymentMethod}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                        {formatCurrency(p.collectedAmount, settings.currency)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(p.paymentDate)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Due Members */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Members With Due</h3>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Collect All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {dueMembers.length === 0 ? (
              <p className="py-6 text-center text-emerald-600 font-medium italic">
                Awesome! All active members have paid for this month.
              </p>
            ) : (
              dueMembers.map(({ member, dueAmount }) => (
                <div key={member.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <button
                        onClick={() => onViewMember(member)}
                        className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 text-left block"
                      >
                        {member.name}
                      </button>
                      <span className="text-[11px] text-slate-400">{member.phone}</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(dueAmount, settings.currency)}
                    </span>
                    <button
                      onClick={() => onQuickCollectPayment(member)}
                      className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                    >
                      Collect
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
