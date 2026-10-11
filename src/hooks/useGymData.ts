import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureMonthlyPaymentsGenerated, generateNextMemberId } from '../database/db';
import { Member, Payment, Expense, MemberPhotoRecord } from '../types';
import { useEffect, useState } from 'react';
import { saveMemberPhoto, deleteMemberPhoto, getMemberPhoto } from '../services/photoService';

export function useGymData() {
  const [isInitializing, setIsInitializing] = useState(true);

  // Auto-generate current month payment records on app mount
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        await ensureMonthlyPaymentsGenerated();
      } catch (err) {
        console.error('Error auto-generating payments:', err);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Reactive Dexie query for members
  const members = useLiveQuery(() => db.members.toArray(), []) || [];

  // Reactive Dexie query for payments
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  // Reactive Dexie query for expenses
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];

  // Helper functions for Expense management
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const newExpense: Expense = {
      ...expenseData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await db.expenses.add(newExpense);
    return newExpense;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const now = new Date().toISOString();
    await db.expenses.update(id, {
      ...updates,
      updatedAt: now,
    });
  };

  const deleteExpense = async (id: string) => {
    await db.expenses.delete(id);
  };

  // Helper functions
  const addMember = async (
    memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>,
    photoBlobs?: { fullBlob: Blob; thumbnailBlob?: Blob }
  ) => {
    const now = new Date().toISOString();
    const id = `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // If photoBlobs provided, store photo in separate memberPhotos table
    if (photoBlobs?.fullBlob) {
      await saveMemberPhoto(id, photoBlobs.fullBlob, photoBlobs.thumbnailBlob);
      memberData.photo = 'local';
    }

    const newMember: Member = {
      ...memberData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await db.members.add(newMember);

    // If active, immediately generate current month's payment record for this new member
    if (newMember.status === 'active') {
      const targetDate = new Date();
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const newPayment: Payment = {
        id: `PAY-${id}-${year}-${month.toString().padStart(2, '0')}`,
        memberId: id,
        month,
        year,
        monthlyFee: newMember.monthlyFee,
        collectedAmount: 0,
        remainingDue: newMember.monthlyFee,
        paymentMethod: 'Cash',
        status: 'Unpaid',
        paymentDate: '',
        notes: 'Auto-generated on member joining',
        createdAt: now,
        updatedAt: now,
      };

      await db.payments.add(newPayment);
    }

    return newMember;
  };

  const updateMember = async (
    id: string,
    updates: Partial<Member>,
    photoBlobs?: { fullBlob: Blob; thumbnailBlob?: Blob } | null
  ) => {
    const now = new Date().toISOString();

    // Photo updates
    if (photoBlobs === null) {
      // User requested photo removal
      await deleteMemberPhoto(id);
      updates.photo = undefined;
    } else if (photoBlobs?.fullBlob) {
      // User replaced photo with new image
      await saveMemberPhoto(id, photoBlobs.fullBlob, photoBlobs.thumbnailBlob);
      updates.photo = 'local';
    }

    await db.members.update(id, {
      ...updates,
      updatedAt: now,
    });
  };

  const deleteMemberWithHistory = async (
    memberId: string
  ): Promise<{ deletedMember: Member; deletedPayments: Payment[]; deletedPhoto?: MemberPhotoRecord }> => {
    const member = await db.members.get(memberId);
    if (!member) throw new Error('Member not found');

    const memberPayments = await db.payments.where('memberId').equals(memberId).toArray();
    const photoRecord = await getMemberPhoto(memberId);

    // Delete member, payments, and photo record in a safe transaction
    await db.transaction('rw', db.members, db.payments, db.memberPhotos, async () => {
      await db.payments.where('memberId').equals(memberId).delete();
      await db.memberPhotos.delete(memberId);
      await db.members.delete(memberId);
    });

    return { deletedMember: member, deletedPayments: memberPayments, deletedPhoto: photoRecord };
  };

  const restoreMemberWithHistory = async (
    member: Member,
    paymentsList: Payment[],
    photoRecord?: MemberPhotoRecord
  ) => {
    await db.transaction('rw', db.members, db.payments, db.memberPhotos, async () => {
      await db.members.put(member);
      for (const p of paymentsList) {
        await db.payments.put(p);
      }
      if (photoRecord) {
        await db.memberPhotos.put(photoRecord);
      }
    });
  };

  const savePayment = async (paymentData: Partial<Payment> & { memberId: string; month: number; year: number; collectedAmount: number; monthlyFee: number }) => {
    const now = new Date().toISOString();
    
    // Find existing or create new
    const existing = await db.payments
      .where('[memberId+month+year]')
      .equals([paymentData.memberId, paymentData.month, paymentData.year])
      .first();

    const monthlyFee = paymentData.monthlyFee ?? existing?.monthlyFee ?? 1000;
    const collectedAmount = Math.min(monthlyFee, Math.max(0, paymentData.collectedAmount));
    const remainingDue = monthlyFee - collectedAmount;

    let status: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (collectedAmount >= monthlyFee) {
      status = 'Paid';
    } else if (collectedAmount > 0) {
      status = 'Partial';
    }

    const paymentDate = paymentData.paymentDate || new Date().toISOString().split('T')[0];

    if (existing) {
      await db.payments.update(existing.id, {
        collectedAmount,
        remainingDue,
        status,
        paymentDate,
        paymentMethod: paymentData.paymentMethod || existing.paymentMethod || 'Cash',
        notes: paymentData.notes ?? existing.notes ?? '',
        updatedAt: now,
      });
      return await db.payments.get(existing.id);
    } else {
      const newPay: Payment = {
        id: `PAY-${paymentData.memberId}-${paymentData.year}-${paymentData.month}`,
        memberId: paymentData.memberId,
        month: paymentData.month,
        year: paymentData.year,
        monthlyFee,
        collectedAmount,
        remainingDue,
        status,
        paymentDate,
        paymentMethod: paymentData.paymentMethod || 'Cash',
        notes: paymentData.notes || '',
        createdAt: now,
        updatedAt: now,
      };
      await db.payments.add(newPay);
      return newPay;
    }
  };

  return {
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
  };
}
