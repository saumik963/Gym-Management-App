import React, { useState, useMemo } from 'react';
import { Member, Payment } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { calculateMemberSummary } from '../../utils/calculations';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Edit3, 
  Trash2, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  UserPlus,
  PhoneCall,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';

interface MemberTableProps {
  members: Member[];
  payments: Payment[];
  onViewMember: (member: Member) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onCollectPayment: (member: Member) => void;
  onAddMember: () => void;
}

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  payments,
  onViewMember,
  onEditMember,
  onDeleteMember,
  onCollectPayment,
  onAddMember,
}) => {
  const { settings } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dueFilter, setDueFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [sortField, setSortField] = useState<'name' | 'memberId' | 'joiningDate' | 'monthlyFee'>('memberId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Compute stats per member for search/filter
  const memberSummaries = useMemo(() => {
    return members.map(m => {
      const summary = calculateMemberSummary(m.id, payments);
      return {
        member: m,
        currentDue: summary.currentMonthDue,
        currentStatus: summary.currentMonthStatus,
      };
    });
  }, [members, payments]);

  const filteredMembers = useMemo(() => {
    return memberSummaries
      .filter(({ member, currentDue }) => {
        // Search query
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          member.name.toLowerCase().includes(query) ||
          member.memberId.toLowerCase().includes(query) ||
          member.phone.toLowerCase().includes(query) ||
          member.address.toLowerCase().includes(query);

        // Status Filter
        const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

        // Due Filter
        const matchesDue =
          dueFilter === 'all' ||
          (dueFilter === 'due' && currentDue > 0) ||
          (dueFilter === 'paid' && currentDue === 0);

        return matchesQuery && matchesStatus && matchesDue;
      })
      .sort((a, b) => {
        let valA = a.member[sortField];
        let valB = b.member[sortField];

        if (typeof valA === 'string') {
          valA = (valA as string).toLowerCase();
          valB = (valB as string).toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [memberSummaries, searchQuery, statusFilter, dueFilter, sortField, sortOrder]);

  // Paginated slice
  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const toggleSort = (field: 'name' | 'memberId' | 'joiningDate' | 'monthlyFee') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Search, Filter & Actions Bar */}
      <div className="p-3.5 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name, phone, member ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Status: All</option>
            <option value="active">Active Members</option>
            <option value="inactive">Inactive Members</option>
          </select>

          {/* Due Filter */}
          <select
            value={dueFilter}
            onChange={(e) => {
              setDueFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Payment: All</option>
            <option value="due">Pending Due</option>
            <option value="paid">Fully Paid</option>
          </select>

          {/* View Switcher Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' || viewMode === 'auto'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Add Member Button */}
          <button
            onClick={onAddMember}
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* MOBILE CARD VIEW (Default on mobile screens) */}
      <div className={`p-3 space-y-3 ${viewMode === 'cards' ? 'block' : viewMode === 'table' ? 'hidden' : 'block md:hidden'}`}>
        {paginatedMembers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No gym members found matching criteria.
          </div>
        ) : (
          paginatedMembers.map(({ member, currentDue, currentStatus }) => (
            <div
              key={member.id}
              className="bg-slate-50/60 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-3"
            >
              {/* Header: Photo, Name, ID, Badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center overflow-hidden shrink-0 shadow-xs text-base">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => onViewMember(member)}
                      className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 text-sm text-left block leading-tight"
                    >
                      {member.name}
                    </button>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                      {member.memberId}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge status={member.status} />
                  <Badge status={currentStatus} />
                </div>
              </div>

              {/* Phone, Monthly Fee & Due Amount */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone</span>
                  <a
                    href={`tel:${member.phone}`}
                    className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 mt-0.5"
                  >
                    <PhoneCall className="w-3 h-3 shrink-0" />
                    <span className="truncate">{member.phone}</span>
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Monthly Fee</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                    {formatCurrency(member.monthlyFee, settings.currency)}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-500 font-medium text-[11px]">Current Month Due:</span>
                  <span className="font-bold text-sm">
                    {currentDue > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400">
                        {formatCurrency(currentDue, settings.currency)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        0 (Paid)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                <button
                  onClick={() => onCollectPayment(member)}
                  className="flex-1 inline-flex items-center justify-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Collect Fee</span>
                </button>
                <button
                  onClick={() => onViewMember(member)}
                  className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEditMember(member)}
                  className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700"
                  title="Edit Member"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteMember(member.id)}
                  className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900"
                  title="Delete Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className={`overflow-x-auto ${viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'}`}>
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 select-none">
            <tr>
              <th className="p-3.5 pl-5">Profile</th>
              <th
                onClick={() => toggleSort('memberId')}
                className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('name')}
                className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="p-3.5">Phone</th>
              <th
                onClick={() => toggleSort('joiningDate')}
                className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white hidden md:table-cell"
              >
                <div className="flex items-center space-x-1">
                  <span>Joined</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('monthlyFee')}
                className="p-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Fee</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="p-3.5">Current Due</th>
              <th className="p-3.5">Current Status</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {paginatedMembers.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400">
                  No gym members found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedMembers.map(({ member, currentDue, currentStatus }) => (
                <tr
                  key={member.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="p-3.5 pl-5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    {member.memberId}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    <button
                      onClick={() => onViewMember(member)}
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 text-left"
                    >
                      {member.name}
                    </button>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                    <a href={`tel:${member.phone}`} className="hover:text-emerald-600 hover:underline">
                      {member.phone}
                    </a>
                  </td>
                  <td className="p-3.5 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                    {formatDate(member.joiningDate)}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(member.monthlyFee, settings.currency)}
                  </td>
                  <td className="p-3.5 font-bold">
                    {currentDue > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400">
                        {formatCurrency(currentDue, settings.currency)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        0
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <Badge status={currentStatus} />
                  </td>
                  <td className="p-3.5">
                    <Badge status={member.status} />
                  </td>
                  <td className="p-3.5 pr-5 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onCollectPayment(member)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                        title="Collect Payment"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onViewMember(member)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditMember(member)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Member"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMember(member.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                        title="Delete Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing {filteredMembers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredMembers.length)} of {filteredMembers.length} members
        </span>

        <div className="flex items-center space-x-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

