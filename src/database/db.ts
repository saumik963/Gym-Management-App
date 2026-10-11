import Dexie, { type Table } from 'dexie';
import { Member, Payment, GymSettings, Expense, MemberPhotoRecord } from '../types';

export class GymDatabase extends Dexie {
  members!: Table<Member, string>;
  payments!: Table<Payment, string>;
  settings!: Table<GymSettings, string>;
  expenses!: Table<Expense, string>;
  memberPhotos!: Table<MemberPhotoRecord, string>;

  constructor() {
    super('GymManagementDB');
    
    this.version(1).stores({
      members: 'id, memberId, name, phone, status, joiningDate',
      payments: 'id, memberId, month, year, status, [memberId+month+year], paymentDate',
      settings: 'key',
      expenses: 'id, month, year, date, expenseType'
    });

    this.version(2).stores({
      members: 'id, memberId, name, phone, status, joiningDate',
      payments: 'id, memberId, month, year, status, [memberId+month+year], paymentDate',
      settings: 'key',
      expenses: 'id, month, year, date, expenseType',
      memberPhotos: 'memberId'
    });
  }
}

export const db = new GymDatabase();

export const DEFAULT_SETTINGS: GymSettings = {
  gymName: 'Fitness Care Gym',
  gymLogo: '/logo.webp',
  defaultMonthlyFee: 1000,
  currency: '৳',
  theme: 'light',
  primaryColor: 'emerald',
  autoBackup: true,
  phonePrefix: '+880',
  receiptFooter: 'Thank you for staying fit with Fitness Care Gym! Stay Strong.',
};

/**
 * Checks for current month and automatically generates missing payment records for all active members.
 * Prevents duplicates by querying existing memberId+month+year records.
 */
export async function ensureMonthlyPaymentsGenerated(customDate?: Date): Promise<number> {
  const targetDate = customDate || new Date();
  const month = targetDate.getMonth() + 1; // 1 - 12
  const year = targetDate.getFullYear();

  const activeMembers = await db.members.where('status').equals('active').toArray();
  let createdCount = 0;

  for (const member of activeMembers) {
    // Check if payment record already exists for this member, month, and year
    const existing = await db.payments
      .where('[memberId+month+year]')
      .equals([member.id, month, year])
      .first();

    if (!existing) {
      const now = new Date().toISOString();
      const newPayment: Payment = {
        id: `PAY-${member.id.substring(0, 8)}-${year}-${month.toString().padStart(2, '0')}`,
        memberId: member.id,
        month,
        year,
        monthlyFee: member.monthlyFee,
        collectedAmount: 0,
        remainingDue: member.monthlyFee,
        paymentMethod: 'Cash',
        status: 'Unpaid',
        paymentDate: '',
        notes: 'Auto-generated monthly fee record',
        createdAt: now,
        updatedAt: now,
      };

      await db.payments.add(newPayment);
      createdCount++;
    }
  }

  return createdCount;
}

/**
 * Generates next sequential human-friendly Member ID, e.g. GYM-1001
 */
export async function generateNextMemberId(): Promise<string> {
  const members = await db.members.toArray();
  if (members.length === 0) return 'GYM-1001';

  let maxNum = 1000;
  for (const m of members) {
    const match = m.memberId.match(/GYM-(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  return `GYM-${maxNum + 1}`;
}
