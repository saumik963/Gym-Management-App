import React, { useState } from 'react';
import { Member, Payment } from '../types';
import { MemberTable } from '../components/members/MemberTable';
import { MemberFormModal } from '../components/members/MemberFormModal';
import { MemberDetailModal } from '../components/members/MemberDetailModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { ToastMessage } from '../components/common/Toast';

interface MembersPageProps {
  members: Member[];
  payments: Payment[];
  nextMemberId: string;
  onAddMember: (memberData: any) => Promise<any>;
  onUpdateMember: (id: string, updates: any) => Promise<void>;
  onDeleteMemberWithHistory: (id: string) => Promise<{ deletedMember: Member; deletedPayments: Payment[] }>;
  onRestoreMemberWithHistory: (member: Member, payments: Payment[]) => Promise<void>;
  onCollectPayment: (member: Member) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const MembersPage: React.FC<MembersPageProps> = ({
  members,
  payments,
  nextMemberId,
  onAddMember,
  onUpdateMember,
  onDeleteMemberWithHistory,
  onRestoreMemberWithHistory,
  onCollectPayment,
  addToast,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [selectedDetailMember, setSelectedDetailMember] = useState<Member | null>(null);

  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const handleSaveMember = async (formData: any) => {
    if (editingMember) {
      await onUpdateMember(editingMember.id, formData);
      addToast({
        type: 'success',
        title: 'Member Updated',
        message: `${formData.name}'s profile has been updated.`,
      });
    } else {
      await onAddMember(formData);
      addToast({
        type: 'success',
        title: 'Member Added',
        message: `${formData.name} was successfully registered!`,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMemberId) return;
    const targetId = deletingMemberId;
    setDeletingMemberId(null);

    try {
      const { deletedMember, deletedPayments } = await onDeleteMemberWithHistory(targetId);

      if (selectedDetailMember?.id === targetId) {
        setSelectedDetailMember(null);
      }

      // Add Undo Toast with 10 sec countdown
      addToast({
        type: 'undo',
        title: 'Member Deleted',
        message: `${deletedMember.name} and payment history deleted.`,
        duration: 10000,
        onUndo: async () => {
          await onRestoreMemberWithHistory(deletedMember, deletedPayments);
          addToast({
            type: 'success',
            title: 'Deletion Restored',
            message: `${deletedMember.name}'s profile has been restored!`,
          });
        },
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err?.message || 'Could not delete member.',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Main Table */}
      <MemberTable
        members={members}
        payments={payments}
        onViewMember={(m) => setSelectedDetailMember(m)}
        onEditMember={(m) => {
          setEditingMember(m);
          setIsFormOpen(true);
        }}
        onDeleteMember={(id) => setDeletingMemberId(id)}
        onCollectPayment={(m) => onCollectPayment(m)}
        onAddMember={() => {
          setEditingMember(null);
          setIsFormOpen(true);
        }}
      />

      {/* Add / Edit Form Modal */}
      <MemberFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveMember}
        initialData={editingMember}
        nextMemberId={nextMemberId}
      />

      {/* Detailed Profile View Modal */}
      <MemberDetailModal
        isOpen={!!selectedDetailMember}
        onClose={() => setSelectedDetailMember(null)}
        member={selectedDetailMember}
        payments={payments}
        onEdit={(m) => {
          setSelectedDetailMember(null);
          setEditingMember(m);
          setIsFormOpen(true);
        }}
        onDelete={(id) => {
          setDeletingMemberId(id);
        }}
        onCollectPayment={(m) => {
          setSelectedDetailMember(null);
          onCollectPayment(m);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingMemberId}
        onClose={() => setDeletingMemberId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Gym Member?"
        message="This action will permanently delete the member and all associated payment history. You will have 10 seconds to Undo."
        confirmText="Delete Member & History"
        isDanger={true}
      />
    </div>
  );
};
