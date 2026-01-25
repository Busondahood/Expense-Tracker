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

export type Language = 'en' | 'th';

export const TRANSLATIONS = {
  en: {
    appTitle: 'Expense Tracker Pro',
    subTitle: 'Manage your personal finances and keep track of slips.',
    totalBalance: 'Total Balance',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expense',
    newTransaction: 'New Transaction',
    income: 'Income',
    expense: 'Expense',
    amount: 'Amount',
    category: 'Category',
    selectCategory: 'Select Category',
    addNewCategory: '+ Add New Category',
    typeCategory: 'Type category name...',
    note: 'Note (Optional)',
    notePlaceholder: 'What was this for?',
    slipImage: 'Slip Image (Optional)',
    clickToUpload: 'Click to upload slip',
    saveTransaction: 'Save Transaction',
    saving: 'Saving...',
    recentTransactions: 'Recent Transactions',
    items: 'items',
    date: 'Date',
    categoryNote: 'Category / Note',
    slip: 'Slip',
    noTransactions: 'No transactions found. Start by adding one!',
    loading: 'Loading data...',
    credit: 'Credit by Bus',
    connectionRequired: 'Connection Required',
    connectionDesc: 'To use the Expense Tracker, you need to connect it to a Supabase project. Please configure your environment variables.',
    chartTitle: 'Income vs Expense (Last 7 Active Days)',
    viewSlip: 'View Slip',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this transaction?',
    allCategories: 'All Categories',
    totalFor: 'Total for',
    filterByCategory: 'Filter by Category',
    viewDaily: 'Daily',
    viewMonthly: 'Monthly',
    monthlyChartTitle: 'Monthly Summary (Last 6 Months)'
  },
  th: {
    appTitle: 'บันทึกรายรับ-รายจ่าย',
    subTitle: 'จัดการการเงินส่วนบุคคลและเก็บรูปสลิปของคุณ',
    totalBalance: 'ยอดเงินคงเหลือ',
    totalIncome: 'รายรับรวม',
    totalExpense: 'รายจ่ายรวม',
    newTransaction: 'เพิ่มรายการใหม่',
    income: 'รายรับ',
    expense: 'รายจ่าย',
    amount: 'จำนวนเงิน',
    category: 'หมวดหมู่',
    selectCategory: 'เลือกหมวดหมู่',
    addNewCategory: '+ เพิ่มหมวดหมู่ใหม่',
    typeCategory: 'พิมพ์ชื่อหมวดหมู่...',
    note: 'บันทึกช่วยจำ (ไม่บังคับ)',
    notePlaceholder: 'รายละเอียดเพิ่มเติม...',
    slipImage: 'รูปสลิป (ไม่บังคับ)',
    clickToUpload: 'คลิกเพื่ออัปโหลดสลิป',
    saveTransaction: 'บันทึกรายการ',
    saving: 'กำลังบันทึก...',
    recentTransactions: 'รายการล่าสุด',
    items: 'รายการ',
    date: 'วันที่',
    categoryNote: 'หมวดหมู่ / บันทึก',
    slip: 'สลิป',
    noTransactions: 'ไม่พบรายการ เริ่มต้นด้วยการเพิ่มรายการแรก!',
    loading: 'กำลังโหลดข้อมูล...',
    credit: 'Credit by Bus',
    connectionRequired: 'จำเป็นต้องเชื่อมต่อระบบ',
    connectionDesc: 'เพื่อใช้งาน Expense Tracker คุณต้องเชื่อมต่อกับโปรเจกต์ Supabase โปรดตั้งค่า Environment Variables',
    chartTitle: 'รายรับ vs รายจ่าย (7 วันที่มีความเคลื่อนไหวล่าสุด)',
    viewSlip: 'ดูสลิป',
    delete: 'ลบรายการ',
    confirmDelete: 'คุณแน่ใจหรือไม่ที่จะลบรายการนี้?',
    allCategories: 'ทุกหมวดหมู่',
    totalFor: 'ยอดรวมสำหรับ',
    filterByCategory: 'กรองหมวดหมู่',
    viewDaily: 'รายวัน',
    viewMonthly: 'รายเดือน',
    monthlyChartTitle: 'สรุปผลรายเดือน (6 เดือนล่าสุด)'
  }
};