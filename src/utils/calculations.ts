import { Member, Payment, DashboardStats } from '../types';

export function calculateDashboardStats(
  members: Member[],
  payments: Payment[],
  currentMonth: number,
  currentYear: number
): DashboardStats {
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const inactiveMembers = members.filter(m => m.status === 'inactive').length;

  const todayStr = new Date().toISOString().split('T')[0];

  let totalMonthlyCollection = 0;
  let totalDueAmount = 0;
  let collectedToday = 0;
  let collectionThisMonth = 0;
  let collectionThisYear = 0;

  payments.forEach(p => {
    // Current month stats
    if (p.year === currentYear && p.month === currentMonth) {
      collectionThisMonth += p.collectedAmount || 0;
      totalDueAmount += p.remainingDue || 0;
    }

    // Yearly stats
    if (p.year === currentYear) {
      collectionThisYear += p.collectedAmount || 0;
    }

    // Collected Today
    if (p.paymentDate && p.paymentDate.startsWith(todayStr)) {
      collectedToday += p.collectedAmount || 0;
    }
  });

  totalMonthlyCollection = collectionThisMonth;

  return {
    totalMembers,
    activeMembers,
    inactiveMembers,
    totalMonthlyCollection,
    totalDueAmount,
    collectedToday,
    collectionThisMonth,
    collectionThisYear,
  };
}

export function calculateMemberSummary(memberId: string, payments: Payment[]) {
  const memberPayments = payments.filter(p => p.memberId === memberId);
  
  let totalPaid = 0;
  let totalDue = 0;

  memberPayments.forEach(p => {
    totalPaid += p.collectedAmount || 0;
    totalDue += p.remainingDue || 0;
  });

  // Current month payment status
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentMonthPayment = memberPayments.find(
    p => p.month === currentMonth && p.year === currentYear
  );

  return {
    payments: memberPayments,
    totalPaid,
    totalDue,
    currentMonthStatus: currentMonthPayment ? currentMonthPayment.status : 'Unpaid',
    currentMonthDue: currentMonthPayment ? currentMonthPayment.remainingDue : 0,
    currentMonthCollected: currentMonthPayment ? currentMonthPayment.collectedAmount : 0,
  };
}
