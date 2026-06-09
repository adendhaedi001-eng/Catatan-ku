export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  parentCategory: string;
  category: string;
  subcategory: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  source?: string;
  syncKey?: string;
}

export interface ParentCategory {
  id: string;
  type: TransactionType;
  name: string;
  color: string;
}

export interface Category {
  id: string;
  parentId: string;
  type: TransactionType;
  name: string;
  color: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  no?: string;
  status?: string;
}

export interface AppSettings {
  pinEnabled: boolean;
  pinHash: string;
  theme: 'light' | 'dark';
  primary: string;
  currency: string;
  currencySymbol: string;
  decimals: number;
  useGrouping: boolean;
  symbolPosition: 'before' | 'after';
  carryOver: boolean;
  startingBalance: number;
  cloudKey: string;
  quickOpen: string[];
  reminderEnabled: boolean;
  reminderTime: string;
  lastBackup: string;
  noAds: boolean;
}

export interface FinanceData {
  version: number;
  createdAt: string;
  updatedAt: string;
  transactions: Transaction[];
  parentCategories: ParentCategory[];
  categories: Category[];
  subcategories: Subcategory[];
  settings: AppSettings;
}

export interface Payment {
  nominal: number;
  status: 'Lunas' | 'Belum';
  tanggal: string; // YYYY-MM-DD
  catatan: string;
  syncSource?: string;
  syncKey?: string;
  financeTransactionId?: string;
}

export interface Student {
  id: string;
  no: string;
  nama: string;
  status?: string;
  financeParentId?: string;
  financeCategoryId?: string;
  financeSubcategoryId?: string;
  pembayaran: Record<string, Payment>;
}

export interface Bagian {
  id: string;
  nama: string;
  students: Student[];
}

export interface Kelas {
  id: string;
  nama: string;
  catatan: string;
  deskripsi: string;
  pilihan: string[];
  activePilihan: string;
  activeBagianId: string;
  bagianList: Bagian[];
  students: Student[];
}

export interface AdminRekapSetting {
  mode: 'bulanan' | 'harian' | 'custom';
  bulan: string; // 'semua' | month name
  tanggal: string; // YYYY-MM-DD
  mulai: string; // YYYY-MM-DD
  sampai: string; // YYYY-MM-DD
}

export interface IuranData {
  nominalDefault: number;
  nominalManualFixed: boolean;
  nominalBebasManual: boolean;
  students: Student[];
  activeKelasId?: string;
  kelasList?: Kelas[];
  adminRekap?: AdminRekapSetting;
}
