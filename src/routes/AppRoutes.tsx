import React, { useState } from 'react';
import { NavTab, Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { MobileNav } from '../components/layout/MobileNav';
import { PwaInstallPrompt } from '../components/common/PwaInstallPrompt';
import { ToastContainer, ToastMessage } from '../components/common/Toast';
import { PaymentModal } from '../components/payments/PaymentModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { MemberFormModal } from '../components/members/MemberFormModal';

import { DashboardPage } from '../pages/DashboardPage';
import { MembersPage } from '../pages/MembersPage';
import { PaymentsPage } from '../pages/PaymentsPage';
import { ExpensesPage } from '../pages/ExpensesPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ImportExportPage } from '../pages/ImportExportPage';
import { SettingsPage } from '../pages/SettingsPage';

import { useGymData } from '../hooks/useGymData';
import { Member, Payment } from '../types';

export const AppRoutes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Dexie Reactive Hook
  const {
    members,
    payments,
    expenses,
    isInitializing,
    addMember,
    updateMember,
    deleteMemberWithHistory,
    restoreMemberWithHistory,
    savePayment,
    addExpense,
    updateExpense,
    deleteExpense,
    generateNextMemberId,
  } = useGymData();

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Quick Payment Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMember, setSelectedPaymentMember] = useState<Member | null>(null);

  // Quick Add Member Modal state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [nextMemberId, setNextMemberId] = useState('GYM-1001');

  // Receipt Printable Modal state
  const [receiptMember, setReceiptMember] = useState<Member | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const handleOpenQuickAddMember = async () => {
    const nextId = await generateNextMemberId();
    setNextMemberId(nextId);
    setIsAddMemberOpen(true);
  };

  const handleOpenQuickCollect = (member?: Member) => {
    setSelectedPaymentMember(member || null);
    setIsPaymentModalOpen(true);
  };

  const handleSaveMemberQuick = async (formData: any) => {
    await addMember(formData);
    addToast({
      type: 'success',
      title: 'Member Registered',
      message: `${formData.name} added successfully!`,
    });
  };

  const handleShowReceipt = (member: Member, payment: Payment) => {
    setReceiptMember(member);
    setReceiptPayment(payment);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Gym Dashboard';
      case 'members': return 'Member Directory';
      case 'payments': return 'Monthly Collections';
      case 'expenses': return 'Expense Management & Net Profit';
      case 'reports': return 'Financial Analytics & Reports';
      case 'import-export': return 'Backup & Restore Data';
      case 'settings': return 'System Preferences';
      default: return 'Gym Management';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <PwaInstallPrompt />

      <div className="flex flex-1 relative">
        {/* Sidebar for Desktop */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
          <Header
            title={getPageTitle()}
            onQuickAddMember={handleOpenQuickAddMember}
            onQuickCollectPayment={() => handleOpenQuickCollect()}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {isInitializing ? (
              <div className="p-12 text-center text-slate-400">
                <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-semibold">Initializing IndexedDB Database...</p>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardPage
                    members={members}
                    payments={payments}
                    expenses={expenses}
                    onNavigate={setActiveTab}
                    onQuickAddMember={handleOpenQuickAddMember}
                    onQuickCollectPayment={(m) => handleOpenQuickCollect(m)}
                    onViewMember={(m) => {
                      setActiveTab('members');
                    }}
                  />
                )}

                {activeTab === 'members' && (
                  <MembersPage
                    members={members}
                    payments={payments}
                    nextMemberId={nextMemberId}
                    onAddMember={addMember}
                    onUpdateMember={updateMember}
                    onDeleteMemberWithHistory={deleteMemberWithHistory}
                    onRestoreMemberWithHistory={restoreMemberWithHistory}
                    onCollectPayment={handleOpenQuickCollect}
                    addToast={addToast}
                  />
                )}

                {activeTab === 'payments' && (
                  <PaymentsPage
                    members={members}
                    payments={payments}
                    onQuickCollectPayment={() => handleOpenQuickCollect()}
                    onSavePayment={savePayment}
                    onShowReceipt={handleShowReceipt}
                  />
                )}

                {activeTab === 'expenses' && (
                  <ExpensesPage
                    expenses={expenses}
                    payments={payments}
                    onAddExpense={addExpense}
                    onUpdateExpense={updateExpense}
                    onDeleteExpense={deleteExpense}
                    addToast={addToast}
                  />
                )}

                {activeTab === 'reports' && (
                  <ReportsPage members={members} payments={payments} expenses={expenses} />
                )}

                {activeTab === 'import-export' && (
                  <ImportExportPage />
                )}

                {activeTab === 'settings' && (
                  <SettingsPage />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Quick Collect Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        members={members}
        payments={payments}
        selectedMember={selectedPaymentMember}
        onSavePayment={savePayment}
        onShowReceipt={handleShowReceipt}
      />

      {/* Quick Add Member Modal */}
      <MemberFormModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSave={handleSaveMemberQuick}
        nextMemberId={nextMemberId}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptMember && !!receiptPayment}
        onClose={() => {
          setReceiptMember(null);
          setReceiptPayment(null);
        }}
        member={receiptMember || undefined}
        payment={receiptPayment || undefined}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
