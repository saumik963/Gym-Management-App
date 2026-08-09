import { db } from './db';
import { Member, Payment } from '../types';

export async function seedSampleData(overwrite: boolean = false): Promise<{ membersCount: number; paymentsCount: number }> {
  if (overwrite) {
    await db.payments.clear();
    await db.members.clear();
  } else {
    const count = await db.members.count();
    if (count > 0) {
      return { membersCount: 0, paymentsCount: 0 };
    }
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const sampleMembers: Omit<Member, 'id'>[] = [
    {
      memberId: 'GYM-1001',
      name: 'Tanvir Hossain',
      phone: '01711223344',
      address: 'House 42, Road 7, Dhanmondi, Dhaka',
      joiningDate: '2025-01-15',
      monthlyFee: 1500,
      weight: 78,
      height: 175,
      gender: 'male',
      dob: '1995-06-12',
      emergencyContact: '01811223344 (Brother)',
      notes: 'Focusing on weight training & hypertrophy',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      status: 'active',
      createdAt: new Date('2025-01-15').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      memberId: 'GYM-1002',
      name: 'Nusrat Jahan',
      phone: '01822334455',
      address: 'Flat 4B, Green Road, Dhaka',
      joiningDate: '2025-02-01',
      monthlyFee: 1200,
      weight: 62,
      height: 162,
      gender: 'female',
      dob: '1998-09-20',
      emergencyContact: '01722334455 (Father)',
      notes: 'Cardio & Strength training',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      status: 'active',
      createdAt: new Date('2025-02-01').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      memberId: 'GYM-1003',
      name: 'Rahim Chowdhury',
      phone: '01933445566',
      address: 'Sector 4, Uttara, Dhaka',
      joiningDate: '2025-03-10',
      monthlyFee: 1000,
      weight: 85,
      height: 180,
      gender: 'male',
      dob: '1990-03-15',
      emergencyContact: '01900112233',
      notes: 'Morning shift workouts',
      status: 'active',
      createdAt: new Date('2025-03-10').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      memberId: 'GYM-1004',
      name: 'Sadia Islam',
      phone: '01644556677',
      address: 'Block C, Banani, Dhaka',
      joiningDate: '2025-04-05',
      monthlyFee: 1500,
      weight: 55,
      height: 158,
      gender: 'female',
      dob: '2000-11-05',
      emergencyContact: '01611223344',
      notes: 'Personal training client',
      status: 'active',
      createdAt: new Date('2025-04-05').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      memberId: 'GYM-1005',
      name: 'Arifur Rahman',
      phone: '01555667788',
      address: 'Mirpur-10, Dhaka',
      joiningDate: '2025-05-12',
      monthlyFee: 1000,
      weight: 92,
      height: 172,
      gender: 'male',
      dob: '1988-01-30',
      notes: 'Fat loss program',
      status: 'active',
      createdAt: new Date('2025-05-12').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      memberId: 'GYM-1006',
      name: 'Mahmuda Begum',
      phone: '01766778899',
      address: 'Mohakhali DOHS, Dhaka',
      joiningDate: '2025-06-01',
      monthlyFee: 1200,
      weight: 68,
      height: 165,
      gender: 'female',
      status: 'inactive',
      createdAt: new Date('2025-06-01').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      memberId: 'GYM-1007',
      name: 'Kamrul Hasan',
      phone: '01877889900',
      address: 'Gulshan 2, Dhaka',
      joiningDate: '2025-07-20',
      monthlyFee: 2000,
      weight: 74,
      height: 178,
      gender: 'male',
      notes: 'VIP Membership',
      status: 'active',
      createdAt: new Date('2025-07-20').toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const addedMembers: Member[] = [];
  for (let i = 0; i < sampleMembers.length; i++) {
    const id = `mem-${Date.now()}-${i + 1}`;
    const fullMember: Member = {
      ...sampleMembers[i],
      id,
    };
    await db.members.add(fullMember);
    addedMembers.push(fullMember);
  }

  // Generate historical payments for current year (e.g. 2026) for previous months and current month
  const payments: Payment[] = [];
  const methods: ('Cash' | 'Bkash' | 'Nagad' | 'Card')[] = ['Cash', 'Bkash', 'Nagad', 'Card'];

  for (const member of addedMembers) {
    if (member.status === 'inactive') continue;

    // Generate payments for last 3 months up to currentMonth
    for (let m = Math.max(1, currentMonth - 2); m <= currentMonth; m++) {
      let collected = member.monthlyFee;
      let status: 'Paid' | 'Partial' | 'Unpaid' = 'Paid';
      let method = methods[Math.floor(Math.random() * methods.length)];

      if (m === currentMonth) {
        // Some paid, some partial, some unpaid for current month test
        const rand = Math.random();
        if (rand < 0.4) {
          collected = member.monthlyFee;
          status = 'Paid';
        } else if (rand < 0.7) {
          collected = Math.floor(member.monthlyFee / 2);
          status = 'Partial';
        } else {
          collected = 0;
          status = 'Unpaid';
        }
      }

      const remainingDue = member.monthlyFee - collected;
      const paymentDate = collected > 0 ? `${currentYear}-${m.toString().padStart(2, '0')}-05` : '';

      const pay: Payment = {
        id: `PAY-${member.id}-${currentYear}-${m}`,
        memberId: member.id,
        month: m,
        year: currentYear,
        monthlyFee: member.monthlyFee,
        collectedAmount: collected,
        remainingDue,
        paymentMethod: method,
        status,
        paymentDate,
        notes: status === 'Paid' ? 'Full payment received' : status === 'Partial' ? 'Partial installment' : 'Pending payment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      payments.push(pay);
      await db.payments.add(pay);
    }
  }

  return { membersCount: addedMembers.length, paymentsCount: payments.length };
}
