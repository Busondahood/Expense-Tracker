export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

// Changed from Enum to const array for easier extension
export const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Utilities',
  'Salary',
  'Rent',
  'Entertainment',
  'Other'
] as const;

export interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: TransactionType;
  category: string;
  slip_url: string | null;
  description?: string;
}

export interface Stats {
  balance: number;
  income: number;
  expense: number;
}