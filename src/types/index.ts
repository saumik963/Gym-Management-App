export type Gender = 'male' | 'female' | 'other';
export type MemberStatus = 'active' | 'inactive';

export interface Member {
  id: string; // Internal unique ID (UUID/string)
  memberId: string; // Human readable ID like "GYM-1001"
  name: string;
  phone: string;
  address: string;
  joiningDate: string; // YYYY-MM-DD
  monthlyFee: number;
  weight: number; // in kg
  height: number; // in cm
  gender: Gender;
  dob?: string; // YYYY-MM-DD
  emergencyContact?: string;
  notes?: string;
  photo?: string; // base64 or avatar string
  status: MemberStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type PaymentMethod = 'Cash' | 'Bkash' | 'Nagad' | 'Card' | 'Bank' | 'Other';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface Payment {
  id: string; // Internal UUID
  memberId: string; // References Member.id
  month: number; // 1 to 12
  year: number; // e.g. 2026
  monthlyFee: number; // Fee for that month
  collectedAmount: number; // Amount collected so far
  remainingDue: number; // monthlyFee - collectedAmount
  paymentDate?: string; // YYYY-MM-DD or ISO of last collection
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GymSettings {
  gymName: string;
  gymLogo?: string;
  defaultMonthlyFee: number;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  primaryColor: 'emerald' | 'indigo' | 'blue' | 'violet' | 'amber' | 'rose';
  autoBackup: boolean;
  phonePrefix: string;
  receiptFooter: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  totalMonthlyCollection: number;
  totalDueAmount: number;
  collectedToday: number;
  collectionThisMonth: number;
  collectionThisYear: number;
}

export interface ImportSummary {
  importedMembersCount: number;
  importedPaymentsCount: number;
  skippedMembersCount: number;
  skippedPaymentsCount: number;
  errors: string[];
}

export type ExpenseCategory = 
  | 'Rent' 
  | 'Electricity Bill' 
  | 'Water Bill' 
  | 'Trainer Salary' 
  | 'Staff Salary' 
  | 'Equipment Purchase' 
  | 'Equipment Repair' 
  | 'Internet & Utility' 
  | 'Marketing & Ads' 
  | 'Cleaning & Supplies' 
  | 'Other';

export interface Expense {
  id: string; // e.g. EXP-1700000000
  title: string; // e.g. "Monthly Gym Space Rent"
  expenseType: ExpenseCategory | string; // Category or custom string
  amount: number;
  month: number; // 1 to 12
  year: number; // e.g. 2026
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  settings: GymSettings;
  members: Member[];
  payments: Payment[];
  expenses?: Expense[];
}
