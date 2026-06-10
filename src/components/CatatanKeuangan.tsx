import React, { useState, useMemo } from 'react';
import { 
  FinanceData, 
  Transaction, 
  ParentCategory, 
  Category, 
  Subcategory 
} from '../types';
import { 
  formatMoney, 
  todayISO, 
  MONTHS, 
  uid, 
  CURRENCY_MAP, 
  DEFAULT_COLORS 
} from '../utils';
import { 
  Plus, 
  Minus, 
  Search, 
  PieChart as ChartIcon, 
  Settings as SettingsIcon, 
  Trash2, 
  Edit, 
  FileText, 
  Download, 
  Upload, 
  Cloud, 
  RefreshCw, 
  X, 
  User, 
  Bookmark, 
  Coins, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Lock, 
  Bell, 
  History,
  TrendingUp
} from 'lucide-react';
import { GoogleDriveFile } from '../googleDrive';

// Declare types
interface CatatanKeuanganProps {
  data: FinanceData;
  onDataChange: (next: FinanceData) => void;
  googleUser: any;
  googleToken: string | null;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onBackupToDrive: () => Promise<void>;
  onRestoreFromDrive: (fileId: string) => Promise<void>;
  driveFiles: GoogleDriveFile[];
  onRefreshDriveFiles: () => Promise<void>;
  onDeleteAccountData?: () => Promise<void>;
}

export const CatatanKeuangan: React.FC<CatatanKeuanganProps> = ({
  data,
  onDataChange,
  googleUser,
  googleToken,
  onGoogleSignIn,
  onGoogleSignOut,
  onBackupToDrive,
  onRestoreFromDrive,
  driveFiles,
  onRefreshDriveFiles,
  onDeleteAccountData
}) => {
  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transaction' | 'search' | 'chart' | 'settings'>('dashboard');
  const [showTroubleshoot, setShowTroubleshoot] = useState<boolean>(false);
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [periodDate, setPeriodDate] = useState<Date>(new Date());
  
  // Transaction Form State
  const [txEditId, setTxEditId] = useState<string | null>(null);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(todayISO());
  const [txParentId, setTxParentId] = useState<string>('');
  const [txCategoryId, setTxCategoryId] = useState<string>('');
  const [txSubcategoryId, setTxSubcategoryId] = useState<string>('');
  const [txNote, setTxNote] = useState<string>('');

  // Category Configuration Forms State
  const [newParentType, setNewParentType] = useState<'income' | 'expense'>('income');
  const [newParentName, setNewParentName] = useState<string>('');
  const [newParentColor, setNewParentColor] = useState<string>('#ef5350');
  
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('income');
  const [newCatParent, setNewCatParent] = useState<string>('');
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>('#ef5350');
  
  const [newSubType, setNewSubType] = useState<'income' | 'expense'>('income');
  const [newSubCat, setNewSubCat] = useState<string>('');
  const [newSubName, setNewSubName] = useState<string>('');

  // Edit category/subcategory states
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [editingParentName, setEditingParentName] = useState<string>('');
  const [editingParentColor, setEditingParentColor] = useState<string>('');
  const [editingParentType, setEditingParentType] = useState<'income' | 'expense'>('income');

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>('');
  const [editingCategoryColor, setEditingCategoryColor] = useState<string>('');
  const [editingCategoryParent, setEditingCategoryParent] = useState<string>('');

  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [editingSubcategoryName, setEditingSubcategoryName] = useState<string>('');
  const [editingSubcategoryParent, setEditingSubcategoryParent] = useState<string>('');

  // Search/Filter State
  const [searchQuery, setSearchQ] = useState<string>('');
  const [searchTxType, setSearchType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchParentId, setSearchParentId] = useState<string>('all');
  const [searchCategoryId, setSearchCategoryId] = useState<string>('all');
  const [searchSubcategoryId, setSearchSubcategory] = useState<string>('all');
  const [searchPreset, setSearchPreset] = useState<string>('all');
  const [searchStart, setSearchStart] = useState<string>('');
  const [searchEnd, setSearchEnd] = useState<string>('');
  const [searchSort, setSearchSort] = useState<string>('newest');
  const [selectedFilterCats, setSelectedFilterCats] = useState<string[]>([]);

  // Modals state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [reportTitle, setReportTitle] = useState<string>('Laporan Keuangan');
  const [reportFormat, setReportFormat] = useState<'json' | 'csv' | 'txt'>('json');
  const [isDriveLoading, setIsDriveLoading] = useState<boolean>(false);

  // Settings Forms State
  const [startingBalanceInput, setStartingBalanceInput] = useState<string>(String(data.settings.startingBalance || 0));
  const [customNameInput, setCustomNameInput] = useState<string>(data.settings.customAccountName || '');
  const [customEmailInput, setCustomEmailInput] = useState<string>(data.settings.customAccountEmail || '');

  React.useEffect(() => {
    setCustomNameInput(data.settings.customAccountName || '');
    setCustomEmailInput(data.settings.customAccountEmail || '');
  }, [data.settings.customAccountName, data.settings.customAccountEmail]);

  // Alert/Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const askConfirmation = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmText: string = 'Hapus',
    type: 'danger' | 'warning' | 'info' | 'success' = 'danger',
    cancelText: string = 'Batal'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      type
    });
  };

  // Safe Helpers
  const parentCats = (type?: 'income' | 'expense' | null) => {
    return (data.parentCategories || []).filter(p => !type || p.type === type).sort((a,b) => a.name.localeCompare(b.name));
  };
  const parentObj = (id: string) => {
    return (data.parentCategories || []).find(x => x.id === id) || { id: '', name: 'Tanpa Induk', color: '#78909c', type: 'expense' as const };
  };
  const cats = (type?: 'income' | 'expense' | null) => {
    return (data.categories || []).filter(c => !type || c.type === type).sort((a,b) => a.name.localeCompare(b.name));
  };
  const catsByParent = (parentId: string) => {
    return (data.categories || []).filter(c => c.parentId === parentId).sort((a,b) => a.name.localeCompare(b.name));
  };
  const subcats = (catId: string) => {
    return (data.subcategories || []).filter(s => s.categoryId === catId).sort((a,b) => a.name.localeCompare(b.name));
  };
  const subName = (id: string) => {
    return (data.subcategories || []).find(x => x.id === id)?.name || '';
  };
  const catObj = (id: string) => {
    return (data.categories || []).find(x => x.id === id) || { id: '', name: 'Tanpa Kategori', color: '#78909c', parentId: '' };
  };

  // Totals calculations
  const calculateTotals = (txList: Transaction[]) => {
    let income = 0;
    let expense = 0;
    txList.forEach(t => {
      if (t.type === 'income') income += Number(t.amount) || 0;
      else expense += Number(t.amount) || 0;
    });
    const start = Number(data.settings.startingBalance || 0);
    return {
      income,
      expense,
      balance: start + income - expense,
      net: income - expense
    };
  };

  const allTotals = useMemo(() => calculateTotals(data.transactions), [data.transactions, data.settings.startingBalance]);

  // Date Range of Selection
  const periodRange = useMemo(() => {
    const d = periodDate;
    let start: Date;
    let end: Date;
    if (periodType === 'daily') {
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    } else if (periodType === 'weekly') {
      const day = (d.getDay() + 6) % 7;
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    } else if (periodType === 'monthly') {
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    } else {
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date(d.getFullYear() + 1, 0, 1);
    }
    return { start, end };
  }, [periodType, periodDate]);

  const periodLabel = useMemo(() => {
    const d = periodDate;
    if (periodType === 'daily') {
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    } else if (periodType === 'weekly') {
      const { start, end } = periodRange;
      const endCal = new Date(end);
      endCal.setDate(endCal.getDate() - 1);
      return start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' - ' + endCal.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } else if (periodType === 'monthly') {
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    return String(d.getFullYear());
  }, [periodType, periodDate, periodRange]);

  const periodTransactions = useMemo(() => {
    const { start, end } = periodRange;
    return data.transactions.filter(t => {
      const dt = new Date(t.date + 'T00:00:00');
      return dt >= start && dt < end;
    }).sort((a,b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [data.transactions, periodRange]);

  const periodTotals = useMemo(() => calculateTotals(periodTransactions), [periodTransactions]);

  const handleMovePeriod = (delta: number) => {
    const d = periodDate;
    if (periodType === 'daily') {
      setPeriodDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta));
    } else if (periodType === 'weekly') {
      setPeriodDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + (delta * 7)));
    } else if (periodType === 'monthly') {
      setPeriodDate(new Date(d.getFullYear(), d.getMonth() + delta, 1));
    } else {
      setPeriodDate(new Date(d.getFullYear() + delta, 0, 1));
    }
  };

  // Search tx helper filters
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const sorted = [...data.transactions].filter(t => {
      if (searchTxType !== 'all' && t.type !== searchTxType) return false;
      const tCatParent = t.parentCategory || catObj(t.category).parentId;
      if (searchParentId !== 'all' && tCatParent !== searchParentId) return false;
      if (searchCategoryId !== 'all' && t.category !== searchCategoryId) return false;
      if (selectedFilterCats.length > 0 && !selectedFilterCats.includes(t.category)) return false;
      if (searchSubcategoryId !== 'all' && t.subcategory !== searchSubcategoryId) return false;
      if (searchStart && t.date < searchStart) return false;
      if (searchEnd && t.date > searchEnd) return false;
      
      if (q) {
        const textToSearch = `${t.note} ${parentObj(tCatParent).name} ${catObj(t.category).name} ${subName(t.subcategory)} ${t.date} ${t.amount}`.toLowerCase();
        if (!textToSearch.includes(q)) return false;
      }
      return true;
    });

    sorted.sort((a,b) => {
      if (searchSort === 'oldest') return a.date.localeCompare(b.date);
      if (searchSort === 'high') return b.amount - a.amount;
      if (searchSort === 'low') return a.amount - b.amount;
      return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
    });

    return sorted;
  }, [data.transactions, searchQuery, searchTxType, searchParentId, searchCategoryId, selectedFilterCats, searchSubcategoryId, searchStart, searchEnd, searchSort]);

  // Accumulate parent categories totals within the current search results
  const parentCategoryTotals = useMemo(() => {
    const totals: Record<string, { income: number; expense: number; name: string; type: 'income' | 'expense'; color: string }> = {};
    
    searchResults.forEach(t => {
      const pId = t.parentCategory || catObj(t.category).parentId || 'unknown';
      if (!totals[pId]) {
        const parentInformation = parentObj(pId);
        totals[pId] = {
          income: 0,
          expense: 0,
          name: parentInformation.name,
          type: parentInformation.type,
          color: parentInformation.color
        };
      }
      if (t.type === 'income') {
        totals[pId].income += Number(t.amount) || 0;
      } else {
        totals[pId].expense += Number(t.amount) || 0;
      }
    });

    return Object.entries(totals)
      .map(([id, val]) => ({ id, ...val }))
      .filter(v => v.income > 0 || v.expense > 0);
  }, [searchResults, data.parentCategories, data.categories]);

  // Chart view breakdowns
  const chartTypeToggle = useState<'income' | 'expense'>('expense');
  const [chartTypeState] = chartTypeToggle;

  const categoryBreakdown = useMemo(() => {
    const segments: Record<string, { id: string; name: string; color: string; total: number; count: number }> = {};
    periodTransactions.filter(t => t.type === chartTypeState).forEach(t => {
      const c = catObj(t.category);
      if (!segments[t.category]) {
        segments[t.category] = { id: t.category, name: c.name, color: c.color || '#e2e8f0', total: 0, count: 0 };
      }
      segments[t.category].total += Number(t.amount) || 0;
      segments[t.category].count += 1;
    });
    return Object.values(segments).sort((a,b) => b.total - a.total);
  }, [periodTransactions, chartTypeState]);

  // Form Initializers / State Changers
  const handleOpenAddTx = (type: 'income' | 'expense') => {
    setTxEditId(null);
    setTxType(type);
    setTxAmount('');
    setTxDate(todayISO());
    setTxNote('');
    
    const pCats = parentCats(type);
    const dfParent = pCats[0]?.id || '';
    setTxParentId(dfParent);

    const dfCats = catsByParent(dfParent);
    const dfCat = dfCats[0]?.id || '';
    setTxCategoryId(dfCat);

    const dfSubs = subcats(dfCat);
    setTxSubcategoryId(dfSubs[0]?.id || '');

    setActiveTab('transaction');
  };

  const handleOpenEditTx = (t: Transaction) => {
    setTxEditId(t.id);
    setTxType(t.type);
    setTxAmount(String(t.amount));
    setTxDate(t.date);
    setTxNote(t.note);
    setTxParentId(t.parentCategory || catObj(t.category).parentId);
    setTxCategoryId(t.category);
    setTxSubcategoryId(t.subcategory);
    setActiveTab('transaction');
  };

  const handleParentCategoryChangeInForm = (parentId: string) => {
    setTxParentId(parentId);
    const relatedCats = catsByParent(parentId);
    const firstCat = relatedCats[0]?.id || '';
    setTxCategoryId(firstCat);
    const relatedSubs = subcats(firstCat);
    setTxSubcategoryId(relatedSubs[0]?.id || '');
  };

  const handleCategoryChangeInForm = (catId: string) => {
    setTxCategoryId(catId);
    const relatedSubs = subcats(catId);
    setTxSubcategoryId(relatedSubs[0]?.id || '');
  };

  const handleSaveTransaction = () => {
    const numAmt = Number(txAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert('Nominal transaksi harus lebih besar dari 0!');
      return;
    }
    if (!txParentId) {
      alert('Harap pilih Induk Kategori!');
      return;
    }
    if (!txCategoryId) {
      alert('Harap pilih Kategori!');
      return;
    }

    const payload: Transaction = {
      id: txEditId || uid('tx'),
      type: txType,
      amount: numAmt,
      date: txDate,
      parentCategory: txParentId,
      category: txCategoryId,
      subcategory: txSubcategoryId,
      note: txNote.trim(),
      createdAt: txEditId ? (data.transactions.find(t => t.id === txEditId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let nextTx = [...data.transactions];
    if (txEditId) {
      nextTx = nextTx.map(t => t.id === txEditId ? payload : t);
      showToast('Transaksi berhasil diperbarui.');
    } else {
      nextTx.push(payload);
      showToast('Transaksi berhasil ditambahkan.');
    }

    onDataChange({
      ...data,
      transactions: nextTx,
      updatedAt: new Date().toISOString()
    });

    setTxEditId(null);
    setActiveTab('dashboard');
  };

  const handleDeleteTransaction = (id: string) => {
    askConfirmation(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini? Data iuran siswa yang tersinkronisasi juga akan dikembalikan menjadi belum lunas.',
      () => {
        onDataChange({
          ...data,
          transactions: data.transactions.filter(t => t.id !== id),
          updatedAt: new Date().toISOString()
        });
        showToast('Transaksi berhasil dihapus.');
      }
    );
  };

  // Admin Configurations edits.
  const handleAddParentCategory = () => {
    if (!newParentName.trim()) return alert('Nama induk kategori wajib diisi!');
    if ((data.parentCategories || []).some(p => p.type === newParentType && p.name.toLowerCase() === newParentName.trim().toLowerCase())) {
      return alert('Nama induk kategori sudah ada.');
    }

    const p: ParentCategory = {
      id: uid(newParentType === 'income' ? 'parent_income' : 'parent_expense'),
      type: newParentType,
      name: newParentName.trim(),
      color: newParentColor
    };

    onDataChange({
      ...data,
      parentCategories: [...(data.parentCategories || []), p],
      updatedAt: new Date().toISOString()
    });

    setNewParentName('');
    showToast('Induk kategori ditambah.');
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return alert('Nama kategori wajib diisi!');
    if (!newCatParent) return alert('Pilih induk kategori!');
    
    const duplicate = data.categories.some(c => c.parentId === newCatParent && c.name.toLowerCase() === newCatName.trim().toLowerCase());
    if (duplicate) return alert('Kategori sudah ada di induk ini!');

    const c: Category = {
      id: uid(newCatType),
      parentId: newCatParent,
      type: newCatType,
      name: newCatName.trim(),
      color: newCatColor
    };

    const nextSubs = [...data.subcategories];
    // Automatically provision "Umum" default subcategory
    nextSubs.push({
      id: uid('sub'),
      categoryId: c.id,
      name: 'Umum'
    });

    onDataChange({
      ...data,
      categories: [...data.categories, c],
      subcategories: nextSubs,
      updatedAt: new Date().toISOString()
    });

    setNewCatName('');
    showToast('Kategori ditambah.');
  };

  const handleAddSubcategory = () => {
    if (!newSubName.trim()) return alert('Nama sub kategori wajib diisi!');
    if (!newSubCat) return alert('Pilih kategori!');

    const duplicate = (data.subcategories || []).some(s => s.categoryId === newSubCat && s.name.toLowerCase() === newSubName.trim().toLowerCase());
    if (duplicate) return alert('Sub kategori sudah ada.');

    const sc: Subcategory = {
      id: uid('sub'),
      categoryId: newSubCat,
      name: newSubName.trim()
    };

    onDataChange({
      ...data,
      subcategories: [...(data.subcategories || []), sc],
      updatedAt: new Date().toISOString()
    });

    setNewSubName('');
    showToast('Sub kategori ditambah.');
  };

  // Actions edits
  const handleEditParent = (p: ParentCategory) => {
    setEditingParentId(p.id);
    setEditingParentName(p.name);
    setEditingParentColor(p.color);
    setEditingParentType(p.type);
  };

  const handleSaveParentEdit = () => {
    if (!editingParentId || !editingParentName.trim()) return;
    onDataChange({
      ...data,
      parentCategories: data.parentCategories.map(p => p.id === editingParentId ? { ...p, name: editingParentName.trim(), color: editingParentColor, type: editingParentType } : p),
      updatedAt: new Date().toISOString()
    });
    setEditingParentId(null);
    showToast('Induk kategori berhasil diperbarui.');
  };

  const handleDeleteParent = (pId: string) => {
    const childCatIds = data.categories.filter(c => c.parentId === pId).map(c => c.id);
    
    askConfirmation(
      'Hapus Induk Kategori',
      'Apakah Anda yakin ingin menghapus induk kategori ini? Semua kategori anak, sub kategori, dan klasifikasi transaksi terkait akan dihapus atau disesuaikan.',
      () => {
        onDataChange({
          ...data,
          parentCategories: data.parentCategories.filter(p => p.id !== pId),
          categories: data.categories.filter(c => c.parentId !== pId),
          subcategories: data.subcategories.filter(sc => !childCatIds.includes(sc.categoryId)),
          transactions: data.transactions.map(t => {
            const matchesParent = t.parentCategory === pId;
            const matchesCategory = childCatIds.includes(t.category);
            return {
              ...t,
              parentCategory: matchesParent ? "" : t.parentCategory,
              category: matchesCategory ? "" : t.category,
              subcategory: matchesCategory ? "" : t.subcategory
            };
          }),
          updatedAt: new Date().toISOString()
        });
        showToast('Induk kategori berhasil dihapus.');
      }
    );
  };

  const handleEditCategory = (c: Category) => {
    setEditingCategoryId(c.id);
    setEditingCategoryName(c.name);
    setEditingCategoryColor(c.color);
    setEditingCategoryParent(c.parentId);
  };

  const handleSaveCategoryEdit = () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    onDataChange({
      ...data,
      categories: data.categories.map(c => c.id === editingCategoryId ? { ...c, name: editingCategoryName.trim(), color: editingCategoryColor, parentId: editingCategoryParent } : c),
      updatedAt: new Date().toISOString()
    });
    setEditingCategoryId(null);
    showToast('Kategori berhasil diperbarui.');
  };

  const handleDeleteCategory = (cId: string) => {
    askConfirmation(
      'Hapus Kategori',
      'Apakah Anda yakin ingin menghapus kategori beserta seluruh sub kategorinya? Hubungan kategori pada transaksi terkait akan dikosongkan.',
      () => {
        onDataChange({
          ...data,
          categories: data.categories.filter(c => c.id !== cId),
          subcategories: data.subcategories.filter(sc => sc.categoryId !== cId),
          transactions: data.transactions.map(t => t.category === cId ? { ...t, category: "", subcategory: "" } : t),
          updatedAt: new Date().toISOString()
        });
        showToast('Kategori berhasil dihapus.');
      }
    );
  };

  const handleEditSubcategory = (sc: Subcategory) => {
    setEditingSubcategoryId(sc.id);
    setEditingSubcategoryName(sc.name);
    setEditingSubcategoryParent(sc.categoryId);
  };

  const handleSaveSubcategoryEdit = () => {
    if (!editingSubcategoryId || !editingSubcategoryName.trim()) return;
    onDataChange({
      ...data,
      subcategories: data.subcategories.map(sc => sc.id === editingSubcategoryId ? { ...sc, name: editingSubcategoryName.trim(), categoryId: editingSubcategoryParent } : sc),
      updatedAt: new Date().toISOString()
    });
    setEditingSubcategoryId(null);
    showToast('Sub kategori berhasil diperbarui.');
  };

  const handleDeleteSubcategory = (scId: string) => {
    askConfirmation(
      'Hapus Sub Kategori',
      'Apakah Anda yakin ingin menghapus sub kategori ini? Hubungan sub kategori pada transaksi terkait akan dikosongkan.',
      () => {
        onDataChange({
          ...data,
          subcategories: data.subcategories.filter(sc => sc.id !== scId),
          transactions: data.transactions.map(t => t.subcategory === scId ? { ...t, subcategory: "" } : t),
          updatedAt: new Date().toISOString()
        });
        showToast('Sub kategori berhasil dihapus.');
      }
    );
  };

  // Google Drive Handlers
  const handleBackupToDriveLocal = async () => {
    setIsDriveLoading(true);
    try {
      await onBackupToDrive();
      showToast('Cadangan berhasil diunggah ke Google Drive.');
    } catch (err: any) {
      alert(`Ups, gagal mengunggah cadangan ke Google Drive: ${err.message || err}`);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleRestoreFromDriveLocal = (fileId: string) => {
    askConfirmation(
      'Pulihkan Cadangan',
      'Apakah Anda benar-benar ingin menimpa data saat ini dengan cadangan Google Drive ini?',
      async () => {
        setIsDriveLoading(true);
        try {
          await onRestoreFromDrive(fileId);
          showToast('Cadangan berhasil dipulihkan dari Google Drive.');
        } catch (err: any) {
          alert(`Gagal memulihkan cadangan: ${err.message || err}`);
        } finally {
          setIsDriveLoading(false);
        }
      },
      'Pulihkan',
      'success'
    );
  };

  // Local File Backup Actions
  const handleDownloadLocalBackup = () => {
    const fileData = {
      app: 'Catatan Keuangan 4U',
      version: data.version,
      exportedAt: new Date().toISOString(),
      data: data
    };
    const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-catatan-keuangan-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Berkas cadangan JSON berhasil diunduh.');
  };

  const handleUploadLocalBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result as string);
        const incoming = parsed.data || parsed;
        if (!incoming.transactions || !incoming.categories) {
          throw new Error('Format berkas backup tidak sesuai.');
        }

        askConfirmation(
          'Unggah Cadangan Lokal',
          'Apakah Anda yakin ingin mengganti data saat ini dengan berkas cadangan ini?',
          () => {
            onDataChange({
              ...data,
              ...incoming,
              transactions: incoming.transactions.map((t: any) => ({ ...t, subcategory: t.subcategory ?? '' })),
              updatedAt: new Date().toISOString()
            });
            showToast('Berkas cadangan berhasil diunggah.');
          },
          'Pulihkan',
          'success'
        );
      } catch (err) {
        alert('Berkas cadangan tidak valid!');
      }
    };
    r.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white border border-slate-700 px-5 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <Bookmark className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main View Router */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Main Indicators Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 p-4 rounded-3xl shadow-lg shadow-emerald-500/5">
              <span className="text-xs font-bold text-emerald-400 block mb-1">TOTAL PEMASUKAN</span>
              <span className="text-2xl font-black text-emerald-300 block">{formatMoney(periodTotals.income, data.settings)}</span>
            </div>
            <div className="bg-rose-500/10 backdrop-blur-md border border-rose-500/20 p-4 rounded-3xl shadow-lg shadow-rose-500/5">
              <span className="text-xs font-bold text-rose-400 block mb-1">TOTAL PENGELUARAN</span>
              <span className="text-2xl font-black text-rose-400 block">{formatMoney(periodTotals.expense, data.settings)}</span>
            </div>
          </div>

          {/* Quick Buttons Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex gap-3 shadow-lg">
            <button 
              onClick={() => handleOpenAddTx('income')}
              className="flex-1 py-3 px-4 rounded-2xl font-black text-sm text-center bg-gradient-to-tr from-emerald-600 to-teal-500 hover:opacity-95 text-white transition shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Masuk
            </button>
            <button 
              onClick={() => handleOpenAddTx('expense')}
              className="flex-1 py-3 px-4 rounded-2xl font-black text-sm text-center bg-gradient-to-tr from-rose-600 to-pink-500 hover:opacity-95 text-white transition shadow-lg shadow-rose-600/15 flex items-center justify-center gap-1.5"
            >
              <Minus className="w-4 h-4" /> Keluar
            </button>
          </div>

          {/* Period Select Dashboard Tabs */}
          <div className="bg-white/5 border border-white/10 p-1.5 rounded-2xl grid grid-cols-4 gap-1 shadow-inner">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(pType => (
              <button
                key={pType}
                onClick={() => setPeriodType(pType)}
                className={`py-2 rounded-xl text-xs font-extrabold capitalize transition ${periodType === pType ? 'bg-white/10 text-blue-300 font-black shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {pType === 'daily' ? 'Harian' : pType === 'weekly' ? 'Minggu' : pType === 'monthly' ? 'Bulan' : 'Tahun'}
              </button>
            ))}
          </div>

          {/* Date Slider Controls Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-lg">
            <button onClick={() => handleMovePeriod(-1)} className="p-2 hover:bg-white/10 rounded-xl text-slate-300 transition border border-transparent hover:border-white/5">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-black text-white">{periodLabel}</span>
            <button onClick={() => handleMovePeriod(1)} className="p-2 hover:bg-white/10 rounded-xl text-slate-300 transition border border-transparent hover:border-white/5">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Ledger Lists Header */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-base font-black text-white tracking-wide">DAFTAR TRANSAKSI</h3>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('search')} className="bg-white/5 hover:bg-white/10 border border-white/10 p-2.5 rounded-xl text-slate-300 shadow-sm transition">
                <Search className="w-4 h-4" />
              </button>
              <button onClick={() => setActiveTab('chart')} className="bg-white/5 hover:bg-white/10 border border-white/10 p-2.5 rounded-xl text-slate-300 shadow-sm transition">
                <ChartIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ledger Transactions Lists */}
          <div className="space-y-4">
            {periodTransactions.length === 0 ? (
              <div className="text-center py-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-3 shadow-lg">
                <Bookmark className="w-12 h-12 text-slate-500 mx-auto" />
                <h4 className="font-extrabold text-slate-200 text-sm">Belum Ada Transaksi</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">Mulai dengan mencatat pemasukan atau pengeluaran baru menggunakan tombol di atas.</p>
              </div>
            ) : (
              // Grouped by dates
              Object.entries(
                periodTransactions.reduce<Record<string, Transaction[]>>((acc, t) => {
                  acc[t.date] = acc[t.date] || [];
                  acc[t.date].push(t);
                  return acc;
                }, {})
              ).map(([date, items]) => {
                const titleStr = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                return (
                  <div key={date} className="space-y-2">
                    <h4 className="text-xs font-black text-blue-400 pt-1 tracking-wider uppercase">{titleStr}</h4>
                    <div className="space-y-2">
                      {(items as Transaction[]).map(t => {
                        const cat = catObj(t.category);
                        const parent = parentObj(t.parentCategory || cat.parentId);
                        const isIncome = t.type === 'income';
                        return (
                          <div key={t.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex items-center justify-between hover:scale-[1.01] transition duration-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shrink-0 shadow-md relative" style={{ backgroundColor: cat.color || '#42a5f5' }}>
                                <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
                                <span className="relative z-10">{isIncome ? '+' : '-'}</span>
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-sm block text-white truncate">{parent.name} › {cat.name}</span>
                                <span className="text-xs text-slate-400 block truncate">
                                  {subName(t.subcategory) && `${subName(t.subcategory)} • `}{t.note || 'Tanpa Catatan'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right pl-3 shrink-0">
                              <span className={`text-sm md:text-base font-black block tracking-tight ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isIncome ? '+' : '-'}{formatMoney(t.amount, data.settings)}
                              </span>
                              <div className="flex gap-2 justify-end mt-1">
                                <button onClick={() => handleOpenEditTx(t)} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded transition">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteTransaction(t.id)} className="text-slate-400 hover:text-rose-400 p-1 hover:bg-white/5 rounded transition">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'transaction' && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-6 shadow-xl text-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-white">{txEditId ? 'Edit Transaksi' : 'Catat Transaksi'}</h3>
            <button onClick={() => setActiveTab('dashboard')} className="text-sm font-semibold hover:text-rose-400 text-slate-400 transition">
              Batal
            </button>
          </div>

          {/* Toggle type type buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                setTxType('income');
                const pCats = parentCats('income');
                if (pCats[0]) handleParentCategoryChangeInForm(pCats[0].id);
              }}
              className={`py-3 rounded-2xl font-black text-sm text-center border capitalize transition ${txType === 'income' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-transparent border-white/10 text-slate-400'}`}
            >
              Pemasukan
            </button>
            <button 
              onClick={() => {
                setTxType('expense');
                const pCats = parentCats('expense');
                if (pCats[0]) handleParentCategoryChangeInForm(pCats[0].id);
              }}
              className={`py-3 rounded-2xl font-black text-sm text-center border capitalize transition ${txType === 'expense' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-transparent border-white/10 text-slate-400'}`}
            >
              Pengeluaran
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Nominal</label>
              <input 
                type="number"
                placeholder="0"
                value={txAmount}
                onChange={e => setTxAmount(e.target.value)}
                className="w-full text-xl font-bold bg-white/5 border border-white/10 p-3 rounded-2xl text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Tanggal</label>
              <input 
                type="date"
                value={txDate}
                onChange={e => setTxDate(e.target.value)}
                className="w-full font-semibold bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Parent Category selection dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 mt-2 block">Induk Kategori</label>
              <select
                value={txParentId}
                onChange={e => handleParentCategoryChangeInForm(e.target.value)}
                className="w-full font-semibold bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-sm"
              >
                <option value="" className="bg-slate-900 text-white">Pilih Induk Kategori...</option>
                {parentCats(txType).map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>
                ))}
              </select>
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 mt-2 block">Kategori</label>
              <select
                value={txCategoryId}
                onChange={e => handleCategoryChangeInForm(e.target.value)}
                className="w-full font-semibold bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-sm"
              >
                <option value="" className="bg-slate-900 text-white">Pilih Kategori...</option>
                {catsByParent(txParentId).map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
                ))}
              </select>
            </div>

            {/* Subcategory selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 mt-2 block">Sub Kategori</label>
              <select
                value={txSubcategoryId}
                onChange={e => setTxSubcategoryId(e.target.value)}
                className="w-full font-semibold bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-sm"
              >
                <option value="" className="bg-slate-900 text-white">Tanpa Sub Kategori</option>
                {subcats(txCategoryId).map(sc => (
                  <option key={sc.id} value={sc.id} className="bg-slate-900 text-white">{sc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Log text notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 mt-2 block">Deskripsi / Catatan</label>
            <input 
              type="text"
              placeholder="Contoh: Belanja mingguan, makan malam, bayar listrik..."
              value={txNote}
              onChange={e => setTxNote(e.target.value)}
              className="w-full font-semibold bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => setActiveTab('settings')}
              className="flex-1 py-3 px-4 rounded-2xl font-black text-sm text-center border border-white/10 text-slate-300 bg-white/5 hover:bg-white/10 transition"
            >
              Ubah Kategori
            </button>
            <button 
              onClick={handleSaveTransaction}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-black text-sm text-center shadow-lg shadow-blue-500/20 hover:opacity-95 transition"
            >
              Simpan Transaksi
            </button>
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl text-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Kata Kunci Hasil Penyaringan</label>
              <input 
                type="text"
                placeholder="Cari transaksi, ketik deskripsi, kategori, dll..."
                value={searchQuery}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Jenis</label>
                <select
                  value={searchTxType}
                  onChange={e => setSearchType(e.target.value as any)}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-xs"
                >
                  <option value="all" className="bg-slate-900 text-white">Semua Jenis</option>
                  <option value="income" className="bg-slate-900 text-white">Pemasukan</option>
                  <option value="expense" className="bg-slate-900 text-white">Pengeluaran</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Induk</label>
                <select
                  value={searchParentId}
                  onChange={e => {
                    setSearchParentId(e.target.value);
                    setSearchCategoryId('all');
                    setSearchSubcategory('all');
                  }}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-xs"
                >
                  <option value="all" className="bg-slate-900 text-white">Semua Induk</option>
                  {parentCats(null).map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Kategori</label>
                <select
                  value={searchCategoryId}
                  onChange={e => {
                    setSearchCategoryId(e.target.value);
                    setSearchSubcategory('all');
                  }}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-xs"
                >
                  <option value="all" className="bg-slate-900 text-white">Semua Kategori</option>
                  {catsByParent(searchParentId === 'all' ? '' : searchParentId).map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Sub Kategori</label>
                <select
                  value={searchSubcategoryId}
                  onChange={e => setSearchSubcategory(e.target.value)}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-xs"
                >
                  <option value="all" className="bg-slate-900 text-white">Semua Sub Kategori</option>
                  {subcats(searchCategoryId === 'all' ? '' : searchCategoryId).map(sc => (
                    <option key={sc.id} value={sc.id} className="bg-slate-900 text-white">{sc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Dari Tanggal</label>
                <input 
                  type="date"
                  value={searchStart}
                  onChange={e => setSearchStart(e.target.value)}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-2.5 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Sampai Tanggal</label>
                <input 
                  type="date"
                  value={searchEnd}
                  onChange={e => setSearchEnd(e.target.value)}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-2.5 rounded-2xl focus:outline-none text-white focus:border-blue-500/50 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => {
                  setSearchQ('');
                  setSearchType('all');
                  setSearchParentId('all');
                  setSearchCategoryId('all');
                  setSearchSubcategory('all');
                  setSearchStart('');
                  setSearchEnd('');
                }}
                className="py-2.5 px-4 text-xs font-black text-slate-400 hover:text-rose-450 transition border border-white/10 rounded-xl bg-white/5 hover:bg-white/10"
              >
                Atur Ulang
              </button>
            </div>
          </div>

          {/* Akumulasi Induk Kategori */}
          {parentCategoryTotals.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-3 shadow-xl">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Akumulasi per Induk Kategori</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parentCategoryTotals.map(p => {
                  const isIncome = p.type === 'income';
                  const totalAmount = isIncome ? p.income : p.expense;
                  return (
                    <div key={p.id} className="relative bg-white/5 border border-white/5 p-3.5 rounded-2xl flex items-center justify-between overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: p.color || '#42a5f5' }}></div>
                      <div className="pl-3 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">{p.name}</span>
                        <span className="text-xs text-white font-extrabold mt-0.5 block truncate">
                          {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-sm font-black ${isIncome ? 'text-emerald-400' : 'text-rose-450'}`}>
                          {isIncome ? '+' : '-'}{formatMoney(totalAmount, data.settings)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-black text-white">HASIL PENCARIAN ({searchResults.length})</h3>
            <button onClick={() => window.print()} className="bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-xl text-slate-350 flex items-center gap-1.5 text-xs font-black transition">
              <Printer className="w-3.5 h-3.5" /> PDF
            </button>
          </div>

          <div className="space-y-3">
            {searchResults.length === 0 ? (
              <p className="text-center py-12 font-bold text-xs text-slate-400 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-lg">
                Tidak ada hasil pencarian yang cocok.
              </p>
            ) : (
              searchResults.map(t => {
                const cat = catObj(t.category);
                const isIncome = t.type === 'income';
                return (
                  <div key={t.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-white text-xs relative" style={{ backgroundColor: cat.color || '#ef5350' }}>
                        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
                        <span className="relative z-10">{isIncome ? '+' : '-'}</span>
                      </div>
                      <div>
                        <span className="font-extrabold text-[10px] text-slate-450 block uppercase tracking-wider">{t.date}</span>
                        <span className="font-extrabold text-sm text-white block">{cat.name}</span>
                        <span className="text-xs text-slate-400">{t.note || 'Tanpa Catatan'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm md:text-base font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIncome ? '+' : '-'}{formatMoney(t.amount, data.settings)}
                      </span>
                      <div className="flex gap-2 justify-end mt-1">
                        <button onClick={() => handleOpenEditTx(t)} className="text-slate-400 hover:text-white p-0.5 hover:bg-white/5 rounded">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="text-slate-400 hover:text-rose-400 p-0.5 hover:bg-white/5 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'chart' && (
        <div className="space-y-6">
          {/* Main indicators */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white">Chart Kategori</h3>
              <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex gap-1 text-xs font-bold text-slate-300">
                <button 
                  onClick={() => chartTypeToggle[1]('income')}
                  className={`py-1.5 px-3 rounded-lg transition ${chartTypeState === 'income' ? 'bg-white/10 text-emerald-400 font-extrabold shadow-sm border border-white/5' : 'text-slate-400'}`}
                >
                  Masuk
                </button>
                <button 
                  onClick={() => chartTypeToggle[1]('expense')}
                  className={`py-1.5 px-3 rounded-lg transition ${chartTypeState === 'expense' ? 'bg-white/10 text-rose-400 font-extrabold shadow-sm border border-white/5' : 'text-slate-400'}`}
                >
                  Keluar
                </button>
              </div>
            </div>

            {/* Custom SVG Pie Chart representation */}
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              {categoryBreakdown.length === 0 ? (
                <div className="text-center py-10">
                  <Bookmark className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-400 mt-2">Tidak ada data untuk diagram lingkaran pada periode ini.</p>
                </div>
              ) : (
                <>
                  <div className="w-36 h-36 rounded-full border border-white/10 shadow-lg relative flex items-center justify-center p-2.5 overflow-hidden">
                    {/* SVG Pie Chart */}
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {categoryBreakdown.reduce<{ accumAng: number; elements: any[] }>((acc, value, index) => {
                        const totalSums = categoryBreakdown.reduce((sum, item) => sum + item.total, 0) || 1;
                        const sliceAng = (value.total / totalSums) * 360;
                        const arcStart = acc.accumAng;
                        const arcEnd = acc.accumAng + sliceAng;
                        acc.accumAng = arcEnd;

                        const radStart = (arcStart * Math.PI) / 180;
                        const radEnd = (arcEnd * Math.PI) / 180;

                        const x1 = 50 + 40 * Math.cos(radStart);
                        const y1 = 50 + 40 * Math.sin(radStart);
                        const x2 = 50 + 40 * Math.cos(radEnd);
                        const y2 = 50 + 40 * Math.sin(radEnd);

                        const largeArc = sliceAng > 180 ? 1 : 0;
                        const d = sliceAng === 360 ? `M 50 10 A 40 40 0 1 1 49.99 10 Z` : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

                        acc.elements.push(
                          <path 
                            key={index} 
                            d={d} 
                            fill={value.color} 
                            className="hover:opacity-90 transition duration-150 cursor-pointer"
                          />
                        );
                        return acc;
                      }, { accumAng: 0, elements: [] }).elements}
                    </svg>
                    {/* Center cutout */}
                    <div className="absolute w-20 h-20 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 flex items-center justify-center">
                      <span className="text-xs font-black text-center text-slate-300">UTAMA</span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="w-full space-y-2 border-t border-white/10 pt-4">
                    {categoryBreakdown.map(value => (
                      <div key={value.id} className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: value.color }}></span>
                          <span className="text-slate-300">{value.name} ({value.count})</span>
                        </div>
                        <span className="font-extrabold text-white">{formatMoney(value.total, data.settings)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl text-slate-200">
            <h3 className="font-extrabold text-base text-white">Laporan Tabel Persentase</h3>
            <table className="w-full text-xs font-semibold text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-widest font-black">
                  <th className="pb-3 text-[10px]">Kategori</th>
                  <th className="pb-3 text-[10px] text-right">Jumlah</th>
                  <th className="pb-3 text-[10px] text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categoryBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">Belum ada rincian data.</td>
                  </tr>
                ) : (
                  categoryBreakdown.map(value => {
                    const totalSum = categoryBreakdown.reduce((sum, item) => sum + item.total, 0) || 1;
                    const percent = Math.round((value.total / totalSum) * 100);
                    return (
                      <tr key={value.id} className="text-slate-300">
                        <td className="py-3 font-extrabold">{value.name}</td>
                        <td className="py-3 text-right font-black text-white">{formatMoney(value.total, data.settings)}</td>
                        <td className="py-3 text-right text-rose-400 font-extrabold">{percent}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Main indicators */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl shadow-xl">
            <h3 className="font-extrabold text-base text-white mb-4">Pengaturan Format &amp; Bawaan</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Mata Uang Kunci</label>
                <select
                  value={data.settings.currency}
                  onChange={e => {
                    const nextCur = e.target.value;
                    const meta = CURRENCY_MAP[nextCur] || CURRENCY_MAP.IDR;
                    onDataChange({
                      ...data,
                      settings: {
                        ...data.settings,
                        currency: nextCur,
                        currencySymbol: meta.symbol,
                        decimals: meta.decimals
                      },
                      updatedAt: new Date().toISOString()
                    });
                    showToast('Format mata uang diperbarui.');
                  }}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white text-sm"
                >
                  {Object.keys(CURRENCY_MAP).map(k => (
                    <option key={k} value={k} className="bg-slate-900 text-white">{k} - {CURRENCY_MAP[k].symbol}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Saldo Awal Cadangan</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    value={startingBalanceInput}
                    onChange={e => setStartingBalanceInput(e.target.value)}
                    className="flex-1 font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white text-sm"
                  />
                  <button 
                    onClick={() => {
                      onDataChange({
                        ...data,
                        settings: {
                          ...data.settings,
                          startingBalance: Number(startingBalanceInput) || 0
                        },
                        updatedAt: new Date().toISOString()
                      });
                      showToast('Saldo awal berhasil diperbarui.');
                    }}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs px-5 rounded-2xl transition shadow-lg shadow-rose-500/15"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Backup Google Drive & Local Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-white flex items-center gap-1.5">
              <Cloud className="w-5 h-5 text-sky-400" /> Sinkron &amp; Cadangan Google
            </h3>
            
            {googleUser ? (
              <div className="space-y-4 text-xs font-semibold">
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Tersambung sebagai:</span>
                  <div className="flex items-center gap-2.5">
                    {googleUser.photoURL ? (
                      <img src={googleUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-black text-xs shrink-0">
                        {(data.settings.customAccountName || googleUser.displayName || googleUser.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-white text-xs font-black block truncate">
                        {data.settings.customAccountName || googleUser.displayName || googleUser.email}
                      </span>
                      <span className="text-[10px] text-slate-400 font-extrabold block truncate">
                        {data.settings.customAccountEmail || googleUser.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={isDriveLoading}
                    onClick={handleBackupToDriveLocal}
                    className="bg-indigo-600 text-white rounded-2xl py-3 px-4 font-black transition hover:bg-indigo-750 flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50 shadow-lg shadow-indigo-600/15"
                  >
                    {isDriveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Backup ke Drive
                  </button>
                  
                  <button
                    onClick={() => askConfirmation('Cabut Sambungan', 'Apakah Anda yakin ingin memutuskan sambungan dari akun Google?', onGoogleSignOut, 'Putuskan', 'warning')}
                    className="bg-white/5 border border-white/10 text-slate-300 rounded-2xl py-3 px-4 font-black transition hover:bg-white/10 flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    Cabut Sambungan
                  </button>
                </div>

                {/* List available backup files on Google Drive path */}
                <div className="space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-rose-450 block uppercase tracking-wider text-[10px]">DAFTAR CADANGAN DI DRIVE</span>
                    <button onClick={onRefreshDriveFiles} className="p-1 hover:bg-white/10 border border-white/5 rounded-lg text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {driveFiles.length === 0 ? (
                    <p className="text-center py-6 text-slate-450 font-bold bg-white/5 border border-white/10 rounded-2xl">
                      Tidak ditemukan berkas cadangan JSON di Drive.
                    </p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto space-y-2 border border-white/10 p-2 rounded-2xl">
                      {driveFiles.map(f => (
                        <div key={f.id} className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl text-[11px] border border-white/5">
                          <div className="min-w-0 pr-2">
                            <span className="font-extrabold text-white block truncate">{f.name}</span>
                            <span className="text-[10px] text-slate-400 block">{f.modifiedTime ? `Diubah: ${new Date(f.modifiedTime).toLocaleDateString()}` : ''}</span>
                          </div>
                          <button
                            disabled={isDriveLoading}
                            onClick={() => handleRestoreFromDriveLocal(f.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold shrink-0 shadow-sm"
                          >
                            Pulihkan
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center py-4">
                <p className="text-xs font-semibold text-slate-350 leading-relaxed max-w-sm mx-auto">
                  Hubungkan dengan Google untuk menikmati pencadangan data Google Drive secara otomatis dan aman lintas perangkat.
                </p>
                <button
                  onClick={onGoogleSignIn} // Trigger sign in correctly
                  className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs px-6 py-3 rounded-2xl transition inline-flex items-center gap-2 shadow-lg shadow-rose-500/20 cursor-pointer"
                >
                  <Cloud className="w-4 h-4" /> Hubungkan Google Drive
                </button>
              </div>
            )}

            {/* Troubleshoot Panel */}
            <div className="pt-3 border-t border-white/5 mt-3">
              <button
                onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-blue-300 transition flex items-center justify-between"
              >
                <span>⚠️ Butuh Bantuan Login Google / Mengatasi Masalah Cloudflare?</span>
                <span className="text-xs">{showTroubleshoot ? '✕ Tutup' : '🔍 Lihat Petunjuk'}</span>
              </button>

              {showTroubleshoot && (
                <div className="mt-3 bg-slate-950/40 border border-blue-500/20 p-4 rounded-2xl text-[11px] text-slate-300 space-y-3.5 text-left leading-relaxed">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-blue-400 uppercase tracking-wider text-[9px]">1. MASALAH DOMAIN DI CLOUDFLARE (Gagal Popup)</h4>
                    <p>
                      Jika aplikasi dipasang di Cloudflare (misal domain kustom <code className="text-emerald-300 bg-emerald-950/40 px-1 py-0.5 rounded">domainanda.com</code> atau <code className="text-emerald-300 bg-emerald-950/40 px-1 py-0.5 rounded">*.pages.dev</code>), Google Sign-In popup akan menolak koneksi karena domain tersebut belum diizinkan oleh Firebase.
                    </p>
                    <p className="bg-white/5 p-2.5 rounded-xl text-slate-400 mt-1 font-sans">
                      <strong>Cara mengatasi:</strong> Masuk ke <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Firebase Console</a> &rarr; Pilih Proyek &rarr; Menu <strong>Authentication</strong> &rarr; Tab <strong>Settings</strong> &rarr; Bagian <strong>Authorized domains</strong> &rarr; Klik <strong>Add domain</strong> &rarr; Masukkan domain Cloudflare Anda.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-blue-400 uppercase tracking-wider text-[9px]">2. AGAR BISA DIAKSES BANYAK ORANG</h4>
                    <p>
                      Secara default, proyek Firebase baru berada dalam status pengujian (<strong>Testing</strong>). Dalam status ini, hanya orang yang didaftarkan sebagai "Test User" secara manual yang bisa login. Akun Google lain akan diblokir dengan pesan error.
                    </p>
                    <p className="bg-white/5 p-2.5 rounded-xl text-slate-400 mt-1 font-sans">
                      <strong>Cara mengatasi:</strong> Masuk ke <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a> &rarr; Pilih Proyek Anda &rarr; Pilih menu <strong>APIs & Services</strong> &rarr; <strong>OAuth Consent Screen</strong> &rarr; Pada bagian <strong>Publishing status</strong>, klik tombol <span className="text-white font-extrabold">"PUBLISH APP"</span> untuk mengubah status menjadi <strong>In Production</strong>.
                    </p>
                    <p className="text-slate-400 mt-1">
                      <em>Catatan:</em> Setelah diproduksi, akun Google mana saja (Gmail / Drive) dapat masuk. Peringatan "Aplikasi tidak diverifikasi" bisa dilewati dengan mengklik <strong>Lanjutan (Advanced)</strong> &rarr; <strong>Buka [Nama Aplikasi] (tidak aman)</strong>.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-blue-400 uppercase tracking-wider text-[9px]">3. RESET DATABASES / SINKRONISASI</h4>
                    <p>
                      Semua data catatan keuangan & iuran siswa disimpan aman secara otomatis per akun Google di Firestore database. Setiap orang yang login menggunakan akun Google-nya masing-masing akan memiliki database terpisah yang aman dan tersinkronisasi otomatis.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Account Identity Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-white flex items-center gap-1.5">
              <User className="w-5 h-5 text-emerald-400" /> Profil &amp; Akun Kustom
            </h3>
            <p className="text-xs font-semibold text-slate-350 leading-relaxed text-slate-400">
              Sesuaikan nama tampilan akun dan alamat email yang dipasang pada menu, share, dan laporan jika Google profile data Anda telah berubah.
            </p>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-405">Nama Akun / Lembaga (Tampilan Kustom)</label>
                <input 
                  type="text"
                  placeholder={googleUser?.displayName || "Masukkan nama lembaga kustom"}
                  value={customNameInput}
                  onChange={e => setCustomNameInput(e.target.value)}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-405">Alamat Email Tampilan (Kustom)</label>
                <input 
                  type="email"
                  placeholder={googleUser?.email || "Masukkan alamat email kustom"}
                  value={customEmailInput}
                  onChange={e => setCustomEmailInput(e.target.value)}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white text-sm"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button 
                  onClick={() => {
                    onDataChange({
                      ...data,
                      settings: {
                        ...data.settings,
                        customAccountName: customNameInput,
                        customAccountEmail: customEmailInput
                      },
                      updatedAt: new Date().toISOString()
                    });
                    showToast('Profil akun kustom berhasil disimpan.');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition shadow-lg shadow-emerald-600/15 cursor-pointer"
                >
                  Simpan Profil
                </button>

                {(data.settings.customAccountName || data.settings.customAccountEmail) && (
                  <button 
                    onClick={() => {
                      setCustomNameInput('');
                      setCustomEmailInput('');
                      onDataChange({
                        ...data,
                        settings: {
                          ...data.settings,
                          customAccountName: '',
                          customAccountEmail: ''
                        },
                        updatedAt: new Date().toISOString()
                      });
                      showToast('Profil disetel ulang ke default Google.');
                    }}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-extrabold text-xs px-4 py-3 rounded-2xl transition cursor-pointer"
                  >
                    Reset ke Google
                  </button>
                )}
              </div>
            </div>

            {googleUser && onDeleteAccountData && (
              <div className="pt-4 border-t border-white/5 mt-3 space-y-2">
                <h4 className="font-extrabold text-slate-400 text-xs uppercase tracking-wider">Keamanan &amp; Hapus Akun</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Jika Anda ingin menghapus seluruh rekaman iuran &amp; transaksi untuk akun Google yang terhubung saat ini dari database cloud Firestore, gunakan tombol di bawah.
                </p>
                <button
                  onClick={onDeleteAccountData}
                  className="w-full bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/30 font-extrabold text-xs py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-950/20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Seluruh Data Akun di Cloud &amp; Reset Aplikasi
                </button>
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-white">Ekspor / Impor Manual Lokal</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button 
                onClick={handleDownloadLocalBackup}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl py-3 px-3 font-bold transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Ekspor JSON
              </button>
              
              <label 
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl py-3 px-3 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Upload className="w-4 h-4" /> Impor JSON
                <input type="file" accept=".json" hidden onChange={handleUploadLocalBackup} />
              </label>
            </div>
          </div>

          {/* Categories Management Form UI */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-6 shadow-xl text-slate-200">
            <h3 className="font-extrabold text-base text-white">Daftar Pengaturan &amp; Kelola Kategori</h3>

            {/* Editing Cards alerts */}
            {editingParentId && (
              <div className="border border-rose-500/30 rounded-3xl p-4 space-y-3 bg-rose-950/20 backdrop-blur-sm">
                <span className="font-black text-rose-400 text-xs block">EDIT INDUK KATEGORI</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={editingParentName} onChange={e => setEditingParentName(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs font-semibold focus:outline-none text-white" />
                  <input type="color" value={editingParentColor} onChange={e => setEditingParentColor(e.target.value)} className="w-full h-10 border border-white/10 rounded-xl cursor-pointer" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingParentId(null)} className="flex-1 bg-white/5 border border-white/10 text-slate-300 font-bold p-2 text-xs rounded-xl">Batal</button>
                  <button onClick={handleSaveParentEdit} className="flex-1 bg-rose-600 text-white font-bold p-2 text-xs rounded-xl">Simpan</button>
                </div>
              </div>
            )}

            {editingCategoryId && (
              <div className="border border-rose-500/30 rounded-3xl p-4 space-y-3 bg-rose-950/20 backdrop-blur-sm">
                <span className="font-black text-rose-400 text-xs block">EDIT KATEGORI</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={editingCategoryName} onChange={e => setEditingCategoryName(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs font-semibold focus:outline-none text-white" />
                  <input type="color" value={editingCategoryColor} onChange={e => setEditingCategoryColor(e.target.value)} className="w-full h-10 border border-white/10 rounded-xl cursor-pointer" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingCategoryId(null)} className="flex-1 bg-white/5 border border-white/10 text-slate-300 font-bold p-2 text-xs rounded-xl">Batal</button>
                  <button onClick={handleSaveCategoryEdit} className="flex-1 bg-rose-600 text-white font-bold p-2 text-xs rounded-xl">Simpan</button>
                </div>
              </div>
            )}

            {editingSubcategoryId && (
              <div className="border border-emerald-500/30 rounded-3xl p-4 space-y-3 bg-emerald-950/20 backdrop-blur-sm">
                <span className="font-black text-emerald-400 text-xs block">EDIT SUB KATEGORI</span>
                <input type="text" value={editingSubcategoryName} onChange={e => setEditingSubcategoryName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-semibold focus:outline-none text-white" />
                <div className="flex gap-2">
                  <button onClick={() => setEditingSubcategoryId(null)} className="flex-1 bg-white/5 border border-white/10 text-slate-300 font-bold p-2 text-xs rounded-xl">Batal</button>
                  <button onClick={handleSaveSubcategoryEdit} className="flex-1 bg-emerald-600 text-white font-bold p-2 text-xs rounded-xl">Simpan</button>
                </div>
              </div>
            )}

            {/* Parent Add */}
            <div className="border border-white/10 p-4 rounded-2xl space-y-3 bg-white/5">
              <span className="font-extrabold text-xs text-rose-400 block">TAMBAH INDUK KATEGORI</span>
              <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex gap-1 text-[10px] font-bold text-slate-300">
                <button onClick={() => setNewParentType('income')} className={`flex-1 py-1 px-3 rounded-lg transition ${newParentType === 'income' ? 'bg-white/10 text-emerald-400 font-extrabold shadow-sm' : ''}`}>Masuk</button>
                <button onClick={() => setNewParentType('expense')} className={`flex-1 py-1 px-3 rounded-lg transition ${newParentType === 'expense' ? 'bg-white/10 text-rose-400 font-extrabold shadow-sm' : ''}`}>Keluar</button>
              </div>
              <input type="text" placeholder="Nama Induk Kategori..." value={newParentName} onChange={e => setNewParentName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-2.5 text-xs font-semibold focus:outline-none text-white rounded-xl" />
              <div className="flex gap-2">
                <input type="color" value={newParentColor} onChange={e => setNewParentColor(e.target.value)} className="w-12 h-8 rounded-lg cursor-pointer border border-white/10 p-0" />
                <button onClick={handleAddParentCategory} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition">Tambah Induk</button>
              </div>
            </div>

            {/* Category Add */}
            <div className="border border-white/10 p-4 rounded-2xl space-y-3 bg-white/5">
              <span className="font-extrabold text-xs text-rose-400 block">TAMBAH KATEGORI</span>
              <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex gap-1 text-[10px] font-bold text-slate-300">
                <button onClick={() => { setNewCatType('income'); setNewCatParent(''); }} className={`flex-1 py-1 px-3 rounded-lg transition ${newCatType === 'income' ? 'bg-white/10 text-emerald-400 font-extrabold shadow-sm' : ''}`}>Masuk</button>
                <button onClick={() => { setNewCatType('expense'); setNewCatParent(''); }} className={`flex-1 py-1 px-3 rounded-lg transition ${newCatType === 'expense' ? 'bg-white/10 text-rose-400 font-extrabold shadow-sm' : ''}`}>Keluar</button>
              </div>
              <select value={newCatParent} onChange={e => setNewCatParent(e.target.value)} className="w-full bg-white/5 border border-white/10 p-2.5 text-xs font-semibold focus:outline-none text-white rounded-xl">
                <option value="" className="bg-slate-900 text-white">Pilih Induk Kategori...</option>
                {parentCats(newCatType).map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>
                ))}
              </select>
              <input type="text" placeholder="Nama Kategori..." value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-2.5 text-xs font-semibold focus:outline-none text-white rounded-xl" />
              <div className="flex gap-2">
                <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-12 h-8 rounded-lg cursor-pointer border border-white/10 p-0" />
                <button onClick={handleAddCategory} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition">Tambah Kategori</button>
              </div>
            </div>

            {/* Subcategory Add */}
            <div className="border border-white/10 p-4 rounded-2xl space-y-3 bg-white/5">
              <span className="font-extrabold text-xs text-rose-400 block">TAMBAH SUB KATEGORI</span>
              <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex gap-1 text-[10px] font-bold text-slate-300">
                <button onClick={() => { setNewSubType('income'); setNewSubCat(''); }} className={`flex-1 py-1 px-3 rounded-lg transition ${newSubType === 'income' ? 'bg-white/10 text-emerald-400 font-extrabold shadow-sm' : ''}`}>Masuk</button>
                <button onClick={() => { setNewSubType('expense'); setNewSubCat(''); }} className={`flex-1 py-1 px-3 rounded-lg transition ${newSubType === 'expense' ? 'bg-white/10 text-rose-400 font-extrabold shadow-sm' : ''}`}>Keluar</button>
              </div>
              <select value={newSubCat} onChange={e => setNewSubCat(e.target.value)} className="w-full bg-white/5 border border-white/10 p-2.5 text-xs font-semibold focus:outline-none text-white rounded-xl">
                <option value="" className="bg-slate-900 text-white">Pilih Kategori...</option>
                {cats(newSubType).map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">{parentObj(c.parentId).name} › {c.name}</option>
                ))}
              </select>
              <input type="text" placeholder="Nama Sub Kategori..." value={newSubName} onChange={e => setNewSubName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-2.5 text-xs font-semibold focus:outline-none text-white rounded-xl" />
              <button onClick={handleAddSubcategory} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-emerald-600/15">Tambah Sub Kategori</button>
            </div>

            {/* Hierarchical list of configured categories */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <span className="font-extrabold text-sm text-white block uppercase">STRUKTUR KATEGORI</span>
              
              <div className="space-y-4">
                {(['income', 'expense'] as const).map(type => (
                  <div key={type} className="space-y-2">
                    <span className="font-black text-rose-400 uppercase tracking-widest text-[10px] block">{type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'}</span>
                    <div className="space-y-3">
                      {parentCats(type).map(p => {
                        const childCats = catsByParent(p.id);
                        return (
                          <div key={p.id} className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                              <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                                {p.name}
                              </span>
                              <div className="flex gap-2">
                                <button onClick={() => handleEditParent(p)} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded transition">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteParent(p.id)} className="text-slate-400 hover:text-rose-405 p-1 hover:bg-white/5 rounded transition">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3 pl-3">
                              {childCats.map(c => {
                                const listSubs = subcats(c.id);
                                return (
                                  <div key={c.id} className="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-[11px] text-slate-200">{c.name}</span>
                                      <div className="flex gap-1.5">
                                        <button onClick={() => handleEditCategory(c)} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded transition">
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => handleDeleteCategory(c.id)} className="text-slate-400 hover:text-rose-450 p-1 hover:bg-white/5 rounded transition">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                    {/* Subcategories pills */}
                                    <div className="flex flex-wrap gap-1">
                                      {listSubs.map(sc => (
                                        <span key={sc.id} className="inline-flex items-center gap-1 bg-white/5 border border-white/10 py-1 px-2 rounded-lg text-[10px] font-semibold text-slate-300 group">
                                          {sc.name}
                                          <button onClick={() => handleEditSubcategory(sc)} className="text-slate-400 hover:text-white ml-0.5">✎</button>
                                          <button onClick={() => handleDeleteSubcategory(sc.id)} className="text-slate-400 hover:text-rose-400">🗑</button>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav footer toolbar */}
      <div className="h-28"></div>
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/70 backdrop-blur-lg border-t border-white/10 py-3.5 px-4 z-40 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1.5 text-[10px] font-extrabold transition-colors ${activeTab === 'dashboard' ? 'text-blue-400 font-black' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Bookmark className="w-5 h-5" /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center gap-1.5 text-[10px] font-extrabold transition-colors ${activeTab === 'search' ? 'text-blue-400 font-black' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Search className="w-5 h-5" /> Cari
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={`flex flex-col items-center gap-1.5 text-[10px] font-extrabold transition-colors ${activeTab === 'chart' ? 'text-blue-400 font-black' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <ChartIcon className="w-5 h-5" /> Grafik
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1.5 text-[10px] font-extrabold transition-colors ${activeTab === 'settings' ? 'text-blue-400 font-black' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <SettingsIcon className="w-5 h-5" /> Pengaturan
        </button>
      </div>

      {confirmModal && confirmModal.isOpen && (() => {
        // Compute colors and icon based on confirmModal properties
        let iconComponent = <Trash2 className="w-6 h-6" />;
        let iconBg = "bg-rose-500/10 text-rose-450";
        let confirmBtnClass = "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20";

        if (confirmModal.type === 'success') {
          iconComponent = <History className="w-6 h-6" />;
          iconBg = "bg-emerald-500/10 text-emerald-400";
          confirmBtnClass = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20";
        } else if (confirmModal.type === 'warning') {
          iconComponent = <RefreshCw className="w-6 h-6 animate-spin-slow" />;
          iconBg = "bg-amber-500/10 text-amber-500";
          confirmBtnClass = "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20";
        } else if (confirmModal.type === 'info') {
          iconComponent = <History className="w-6 h-6" />;
          iconBg = "bg-blue-500/10 text-blue-400";
          confirmBtnClass = "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20";
        }

        const confirmLabel = confirmModal.confirmText || 'Hapus';
        const cancelLabel = confirmModal.cancelText || 'Batal';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-250">
            <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
              <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mx-auto`}>
                {iconComponent}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{confirmModal.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-bold">
                <button 
                  onClick={() => setConfirmModal(null)} 
                  className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl py-3 px-4 transition active:scale-95 cursor-pointer"
                >
                  {cancelLabel}
                </button>
                <button 
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }} 
                  className={`${confirmBtnClass} rounded-xl py-3 px-4 transition active:scale-95 cursor-pointer`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
