import React from 'react';
import { Modal } from '../common/Modal';
import { Member, Payment } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { formatCurrency, formatDate, getMonthName } from '../../utils/formatters';
import { calculateMemberSummary } from '../../utils/calculations';
import { Badge } from '../common/Badge';
import { MemberAvatar } from '../common/MemberAvatar';
import { generateMemberProfilePDF, generatePaymentReceiptPDF } from '../../services/pdfService';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Weight, 
  Ruler, 
  Printer, 
  Download, 
  CreditCard, 
  Edit3, 
  Trash2, 
  ShieldAlert 
} from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member | null;
  payments: Payment[];
  onEdit: (member: Member) => void;
  onDelete: (memberId: string) => void;
  onCollectPayment: (member: Member) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  payments,
  onEdit,
  onDelete,
  onCollectPayment,
}) => {
  const { settings } = useSettings();

  if (!member) return null;

  const summary = calculateMemberSummary(member.id, payments);

  const handlePrintPDF = () => {
    generateMemberProfilePDF(member, summary.payments, settings);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Member Profile: ${member.name}`}
      subtitle={`ID: ${member.memberId} • Joined ${formatDate(member.joiningDate)}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <MemberAvatar member={member} size="lg" rounded="2xl" preferFull={true} />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{member.name}</h3>
                <Badge status={member.status} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-2">
                <span>{member.phone}</span>
                <span>•</span>
                <span className="capitalize">{member.gender}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {member.address || 'No address specified'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => onCollectPayment(member)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <CreditCard className="w-4 h-4" />
              <span>Collect Fee</span>
            </button>
            <button
              onClick={() => onEdit(member)}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              title="Edit Member"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(member.id)}
              className="p-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 text-xs font-semibold"
              title="Delete Member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Financial Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-400 block font-medium">Monthly Fee</span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatCurrency(member.monthlyFee, settings.currency)}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-400 block font-medium">Current Month Due</span>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
              {formatCurrency(summary.currentMonthDue, settings.currency)}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-400 block font-medium">Total Paid (All Time)</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {formatCurrency(summary.totalPaid, settings.currency)}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-400 block font-medium">Total Remaining Due</span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
              {formatCurrency(summary.totalDue, settings.currency)}
            </span>
          </div>
        </div>

        {/* Health & Personal Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Weight</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{member.weight} kg</span>
          </div>
          <div>
            <span className="text-slate-400 block">Height</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{member.height} cm</span>
          </div>
          <div>
            <span className="text-slate-400 block">Date of Birth</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {member.dob ? formatDate(member.dob) : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Emergency Contact</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {member.emergencyContact || 'N/A'}
            </span>
          </div>
        </div>

        {member.notes && (
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold block mb-0.5">Notes / Medical Info:</span>
            <span>{member.notes}</span>
          </div>
        )}

        {/* Payment History List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Payment History</h4>
            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export History PDF</span>
            </button>
          </div>

          <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">Collected</th>
                  <th className="p-3">Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  summary.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {getMonthName(p.month)} {p.year}
                      </td>
                      <td className="p-3">{formatCurrency(p.monthlyFee, settings.currency)}</td>
                      <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.collectedAmount, settings.currency)}
                      </td>
                      <td className="p-3 font-semibold text-rose-600 dark:text-rose-400">
                        {formatCurrency(p.remainingDue, settings.currency)}
                      </td>
                      <td className="p-3">
                        <Badge status={p.status} />
                      </td>
                      <td className="p-3 text-slate-500">{p.paymentMethod}</td>
                      <td className="p-3">
                        <button
                          onClick={() => generatePaymentReceiptPDF(member, p, settings)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] font-semibold"
                        >
                          Print Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};
