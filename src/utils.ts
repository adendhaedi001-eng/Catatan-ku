import { FinanceData, IuranData, ParentCategory, Category, Subcategory, Student, AppSettings, Transaction } from './types';

export const DEFAULT_COLORS = [
  '#ef5350', // Red
  '#009688', // Teal
  '#42a5f5', // Blue
  '#7e57c2', // Purple
  '#ffa726', // Orange
  '#66bb6a', // Green
  '#ec407a', // Pink
  '#8d6e63', // Brown
  '#26c6da', // Cyan
  '#ffca28'  // Golden
];

export const CURRENCY_MAP: Record<string, { symbol: string; locale: string; decimals: number }> = {
  IDR: { symbol: 'Rp', locale: 'id-ID', decimals: 0 },
  USD: { symbol: '$', locale: 'en-US', decimals: 2 },
  MYR: { symbol: 'RM', locale: 'ms-MY', decimals: 2 },
  SGD: { symbol: 'S$', locale: 'en-SG', decimals: 2 },
  EUR: { symbol: '€', locale: 'de-DE', decimals: 2 },
  JPY: { symbol: '¥', locale: 'ja-JP', decimals: 0 },
  SAR: { symbol: '﷼', locale: 'ar-SA', decimals: 2 }
};

export const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const CK_ALH_PARENT_ID = 'parent_al_hidayah';
export const CK_ALH_CATEGORY_ID = 'cat_al_hidayah_semua';

export function uid(prefix: string = 'id'): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function todayISO(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function todayISOForBulan(bulan: string): string {
  const d = new Date();
  const i = MONTHS.indexOf(bulan);
  const m = i >= 0 ? String(i + 1).padStart(2, '0') : String(d.getMonth() + 1).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + String(d.getDate()).padStart(2, '0');
}

export function getMonthFromISO(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return MONTHS[new Date().getMonth()];
  return MONTHS[d.getMonth()];
}

export const DEFAULT_PARENT_CATEGORIES: ParentCategory[] = [
  { id: 'parent_income_umum', type: 'income', name: 'Pemasukan Umum', color: '#009688' },
  { id: 'parent_expense_umum', type: 'expense', name: 'Pengeluaran Umum', color: '#ef5350' },
  { id: CK_ALH_PARENT_ID, type: 'income', name: 'Al-hidayah', color: '#42a5f5' }
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'income_gaji', parentId: 'parent_income_umum', type: 'income', name: 'Gaji', color: '#009688' },
  { id: 'income_bonus', parentId: 'parent_income_umum', type: 'income', name: 'Bonus', color: '#26a69a' },
  { id: 'income_usaha', parentId: 'parent_income_umum', type: 'income', name: 'Usaha', color: '#66bb6a' },
  { id: 'income_lainnya', parentId: 'parent_income_umum', type: 'income', name: 'Lainnya', color: '#42a5f5' },
  { id: CK_ALH_CATEGORY_ID, parentId: CK_ALH_PARENT_ID, type: 'income', name: 'Semua', color: '#42a5f5' },
  { id: 'expense_makan', parentId: 'parent_expense_umum', type: 'expense', name: 'Makan', color: '#ef5350' },
  { id: 'expense_transport', parentId: 'parent_expense_umum', type: 'expense', name: 'Transport', color: '#ffa726' },
  { id: 'expense_belanja', parentId: 'parent_expense_umum', type: 'expense', name: 'Belanja', color: '#ec407a' },
  { id: 'expense_tagihan', parentId: 'parent_expense_umum', type: 'expense', name: 'Tagihan', color: '#7e57c2' },
  { id: 'expense_kesehatan', parentId: 'parent_expense_umum', type: 'expense', name: 'Kesehatan', color: '#26c6da' },
  { id: 'expense_pendidikan', parentId: 'parent_expense_umum', type: 'expense', name: 'Pendidikan', color: '#8d6e63' },
  { id: 'expense_lainnya', parentId: 'parent_expense_umum', type: 'expense', name: 'Lainnya', color: '#78909c' }
];

export const DEFAULT_SUBCATEGORIES: Subcategory[] = [
  { id: 'sub_gaji_pokok', categoryId: 'income_gaji', name: 'Gaji Pokok' },
  { id: 'sub_gaji_lembur', categoryId: 'income_gaji', name: 'Lembur' },
  { id: 'sub_bonus_bulanan', categoryId: 'income_bonus', name: 'Bonus Bulanan' },
  { id: 'sub_bonus_hadiah', categoryId: 'income_bonus', name: 'Hadiah' },
  { id: 'sub_usaha_jualan', categoryId: 'income_usaha', name: 'Jualan' },
  { id: 'sub_usaha_jasa', categoryId: 'income_usaha', name: 'Jasa' },
  { id: 'sub_income_lain_umum', categoryId: 'income_lainnya', name: 'Umum' },
  { id: 'sub_makan_sarapan', categoryId: 'expense_makan', name: 'Sarapan' },
  { id: 'sub_makan_siang', categoryId: 'expense_makan', name: 'Makan Siang' },
  { id: 'sub_makan_malam', categoryId: 'expense_makan', name: 'Makan Malam' },
  { id: 'sub_transport_bensin', categoryId: 'expense_transport', name: 'Bensin' },
  { id: 'sub_transport_angkutan', categoryId: 'expense_transport', name: 'Angkutan' },
  { id: 'sub_belanja_dapur', categoryId: 'expense_belanja', name: 'Belanja Dapur' },
  { id: 'sub_belanja_pribadi', categoryId: 'expense_belanja', name: 'Belanja Pribadi' },
  { id: 'sub_tagihan_listrik', categoryId: 'expense_tagihan', name: 'Listrik' },
  { id: 'sub_tagihan_internet', categoryId: 'expense_tagihan', name: 'Internet' },
  { id: 'sub_kesehatan_obat', categoryId: 'expense_kesehatan', name: 'Obat' },
  { id: 'sub_pendidikan_buku', categoryId: 'expense_pendidikan', name: 'Buku' },
  { id: 'sub_expense_lain_umum', categoryId: 'expense_lainnya', name: 'Umum' }
];

export const INITIAL_STUDENT_TEMPLATES = [
  { no: '1', nama: 'Agnia Fitri Ramadani' },
  { no: '2', nama: 'Al-Fatih Hilal Nurjaman' },
  { no: '3', nama: 'Alika Aulia Putri' },
  { no: '4.5', nama: 'Alika Luthfi Fauziah / Aliya Hazimah Zinnirah' },
  { no: '6', nama: 'Alysa Putri Nabila' },
  { no: '7', nama: 'Apipah' },
  { no: '8', nama: 'Ayska Aqila Qirani' },
  { no: '9', nama: 'Desita Ramia Bunga' },
  { no: '10.11', nama: 'Dhea Nur Fauziah Shaqi / Dinda Ockthanthi Shaqi' },
  { no: '12', nama: 'Elgi Ferdiansyah' },
  { no: '13', nama: 'Fitri Nurhalimah' },
  { no: '14', nama: 'Hilal Muzaki R' },
  { no: '15', nama: 'Iqbal Hambali' },
  { no: '16', nama: 'Keyzha Ramadhania Putri' },
  { no: '17', nama: 'Khanza Aqila Khoirunisa' },
  { no: '18', nama: 'Kintan Aulia' },
  { no: '19', nama: 'M.Candra Saputra' },
  { no: '20', nama: 'Maqil Azzam Nugraha' },
  { no: '21', nama: 'Maulidiya Nabilah' },
  { no: '22.23', nama: 'Milka / Dafa Risaldi' },
  { no: '24', nama: 'Muhammad Aprizza' },
  { no: '25', nama: 'Muhammad Zaidan' },
  { no: '26', nama: 'Nabila Asyifa Naura' },
  { no: '27', nama: 'Nahda Rafanda Alifa' },
  { no: '28.29', nama: 'Nahya Sri N L / Alifiya N S' },
  { no: '30', nama: 'Nuri Rizkia' },
  { no: '31', nama: 'Rahmi Sri Lestari' },
  { no: '32.33.34', nama: 'Raihan Maulana / Juwita Rahmawati / Puput' },
  { no: '35.36', nama: 'Raisa Putri Nadia Sari / Alwi Herdiansyah Al Fariq' },
  { no: '37', nama: 'Regi Saputra' },
  { no: '38', nama: 'Revi Meylani Hasanah' },
  { no: '39', nama: 'Reyhan Cahya Ryansyah' },
  { no: '40.41', nama: 'Ridwan Maulana / Nur Muhammad Ghozali' },
  { no: '42.43', nama: 'Rizky Maulana / Gisan Ardian' },
  { no: '44.45', nama: 'Rosalinda / Ripa' },
  { no: '46', nama: 'Sani Saputra' },
  { no: '47', nama: 'Silviana Dyra' },
  { no: '48', nama: 'Tiara Indah Putri' },
  { no: '49.50', nama: 'Ujang Farhan / Yusup Nurhidayat' },
  { no: '51', nama: 'Zahda Al Ghazali' },
  { no: '52', nama: 'Muhammad Zidan' }
];

export function getDefaultFinanceData(): FinanceData {
  return {
    version: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: [],
    parentCategories: DEFAULT_PARENT_CATEGORIES.map(p => ({ ...p })),
    categories: DEFAULT_CATEGORIES.map(c => ({ ...c })),
    subcategories: [
      ...DEFAULT_SUBCATEGORIES.map(sc => ({ ...sc })),
      ...INITIAL_STUDENT_TEMPLATES.map((st, index) => ({
        id: `sub_al_hidayah_${String(index + 1).padStart(2, '0')}`,
        categoryId: CK_ALH_CATEGORY_ID,
        name: st.nama
      }))
    ],
    settings: {
      pinEnabled: false,
      pinHash: '',
      theme: 'light',
      primary: '#ef5350',
      currency: 'IDR',
      currencySymbol: 'Rp',
      decimals: 0,
      useGrouping: true,
      symbolPosition: 'before',
      carryOver: true,
      startingBalance: 0,
      cloudKey: 'default',
      quickOpen: ['home', 'search', 'chart', 'input'],
      reminderEnabled: false,
      reminderTime: '20:00',
      lastBackup: '',
      noAds: true,
      customAccountName: '',
      customAccountEmail: ''
    }
  };
}

export function getDefaultIuranData(targetMonth: string = 'Mei'): IuranData {
  const students: Student[] = INITIAL_STUDENT_TEMPLATES.map((st, index) => ({
    id: `s_${String(index + 1).padStart(3, '0')}`,
    no: st.no,
    nama: st.nama,
    pembayaran: {
      [targetMonth]: {
        nominal: 0,
        status: 'Belum',
        tanggal: '',
        catatan: ''
      }
    }
  }));

  return {
    nominalDefault: 0,
    nominalManualFixed: true,
    nominalBebasManual: true,
    students,
    activeKelasId: 'lembaga-kelas',
    kelasList: [
      {
        id: 'lembaga-kelas',
        nama: 'Kelas',
        catatan: 'Mengikuti data iuran siswa utama',
        deskripsi: 'Mengikuti data iuran siswa utama',
        pilihan: ['Kelas 1'],
        activePilihan: 'Kelas 1',
        activeBagianId: 'bagian_kelas_1',
        bagianList: [
          { id: 'bagian_kelas_1', nama: 'Kelas 1', students }
        ],
        students
      },
      {
        id: 'lembaga-musola',
        nama: 'Musola',
        catatan: 'Mengikuti data Musola',
        deskripsi: 'Mengikuti data Musola',
        pilihan: ['Musola Utama'],
        activePilihan: 'Musola Utama',
        activeBagianId: 'bagian_musola_1',
        bagianList: [
          { id: 'bagian_musola_1', nama: 'Musola Utama', students: [] }
        ],
        students: []
      },
      {
        id: 'lembaga-remako',
        nama: 'Remako',
        catatan: 'Mengikuti data Remako',
        deskripsi: 'Mengikuti data Remako',
        pilihan: ['Remako Utama'],
        activePilihan: 'Remako Utama',
        activeBagianId: 'bagian_remako_1',
        bagianList: [
          { id: 'bagian_remako_1', nama: 'Remako Utama', students: [] }
        ],
        students: []
      }
    ],
    adminRekap: {
      mode: 'bulanan',
      bulan: 'semua',
      tanggal: todayISO(),
      mulai: todayISO(),
      sampai: todayISO()
    }
  };
}

export function parseAmount(v: any): number {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const s = String(v || '').replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
}

export function escapeHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, c => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c] || c;
  });
}

export function formatMoney(n: number | string, settings: AppSettings): string {
  const cfg = CURRENCY_MAP[settings.currency] || CURRENCY_MAP.IDR;
  const dec = settings.decimals !== undefined ? settings.decimals : cfg.decimals;
  const abs = Math.abs(Number(n) || 0);
  const num = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
    useGrouping: settings.useGrouping !== false
  }).format(abs);
  const sym = settings.currencySymbol || cfg.symbol || '';
  const out = settings.symbolPosition === 'after' ? `${num} ${sym}` : `${sym} ${num}`;
  return (Number(n) < 0 ? '-' : '') + out.trim();
}

export async function sha256(s: string): Promise<string> {
  const enc = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Synchronizes Catatan Keuangan data and Iuran Siswa data bidirectionally.
 * Keeps track of whether finance data or iuran data changed and synchronizes changes immediately across both.
 */
export function syncData(
  fd: FinanceData,
  id: IuranData,
  prevFd?: FinanceData,
  prevId?: IuranData
): { fd: FinanceData; id: IuranData } {
  const PREFIX = 'sync_iuran_';
  
  // Clone structures to avoid direct state manipulation side-effects
  const nextFd = JSON.parse(JSON.stringify(fd)) as FinanceData;
  const nextId = JSON.parse(JSON.stringify(id)) as IuranData;

  // 1. Identify sync directions by comparing next values against previous ones immediately
  let isFinanceChanged = false;
  let isIuranChanged = false;

  if (prevFd) {
    const nextTxStr = JSON.stringify(nextFd.transactions);
    const prevTxStr = JSON.stringify(prevFd.transactions);
    const nextPCStr = JSON.stringify(nextFd.parentCategories);
    const prevPCStr = JSON.stringify(prevFd.parentCategories);
    const nextCStr = JSON.stringify(nextFd.categories);
    const prevCStr = JSON.stringify(prevFd.categories);
    const nextSCStr = JSON.stringify(nextFd.subcategories);
    const prevSCStr = JSON.stringify(prevFd.subcategories);

    if (nextTxStr !== prevTxStr || nextPCStr !== prevPCStr || nextCStr !== prevCStr || nextSCStr !== prevSCStr) {
      isFinanceChanged = true;
    }
  }

  if (prevId) {
    const nextKelasStr = JSON.stringify(nextId.kelasList);
    const prevKelasStr = JSON.stringify(prevId.kelasList);
    if (nextKelasStr !== prevKelasStr) {
      isIuranChanged = true;
    }
  }

  // Default fallback if loading for the first time or neither showed explicit shifts
  if (!isFinanceChanged && !isIuranChanged) {
    isIuranChanged = true;
  }

  // 2. Propagate structural list changes (deletions and renames) from Finance to Dues if finance changed
  if (isFinanceChanged && !isIuranChanged && prevFd) {
    // Deleted Parent Category in Finance Settings
    const prevParentIds = prevFd.parentCategories.map(p => p.id);
    const nextParentIds = new Set(nextFd.parentCategories.map(p => p.id));
    const deletedParentIds = prevParentIds.filter(id => !nextParentIds.has(id));

    deletedParentIds.forEach(pId => {
      nextId.kelasList = (nextId.kelasList || []).filter(k => k.id !== pId);
    });

    // Deleted Category in Finance Settings
    const prevCatIds = prevFd.categories.map(c => c.id);
    const nextCatIds = new Set(nextFd.categories.map(c => c.id));
    const deletedCatIds = prevCatIds.filter(id => !nextCatIds.has(id));

    deletedCatIds.forEach(cId => {
      (nextId.kelasList || []).forEach(k => {
        k.bagianList = (k.bagianList || []).filter(b => b.id.replace(/^bagian_/, '') !== cId);
      });
    });

    // Deleted Subcategory (Student) in Finance Settings
    const prevSubIds = prevFd.subcategories.map(sc => sc.id);
    const nextSubIds = new Set(nextFd.subcategories.map(sc => sc.id));
    const deletedSubIds = prevSubIds.filter(id => !nextSubIds.has(id));

    deletedSubIds.forEach(scId => {
      (nextId.kelasList || []).forEach(k => {
        k.bagianList = (k.bagianList || []).map(b => {
          return {
            ...b,
            students: (b.students || []).filter(st => st.financeSubcategoryId !== scId)
          };
        });
        k.students = (k.students || []).filter(st => st.financeSubcategoryId !== scId);
      });
    });

    // Rename Parent Category
    (nextId.kelasList || []).forEach(k => {
      const parentInFd = nextFd.parentCategories.find(p => p.id === k.id);
      if (parentInFd && parentInFd.name !== k.nama) {
        k.nama = parentInFd.name;
      }
    });

    // Rename Category
    (nextId.kelasList || []).forEach(k => {
      (k.bagianList || []).forEach(b => {
        const cId = b.id.replace(/^bagian_/, '');
        const catInFd = nextFd.categories.find(c => c.id === cId);
        if (catInFd && catInFd.name !== b.nama) {
          b.nama = catInFd.name;
        }
      });
      k.pilihan = (k.bagianList || []).map(b => b.nama);
      const actB = (k.bagianList || []).find(b => b.id === k.activeBagianId);
      if (actB) {
        k.activePilihan = actB.nama;
      }
    });

    // Rename Subcategory (Student)
    (nextId.kelasList || []).forEach(k => {
      (k.bagianList || []).forEach(b => {
        (b.students || []).forEach(st => {
          if (st.financeSubcategoryId) {
            const subInFd = nextFd.subcategories.find(sc => sc.id === st.financeSubcategoryId);
            if (subInFd && subInFd.name !== st.nama) {
              st.nama = subInFd.name;
            }
          }
        });
      });
      (k.students || []).forEach(st => {
        if (st.financeSubcategoryId) {
          const subInFd = nextFd.subcategories.find(sc => sc.id === st.financeSubcategoryId);
          if (subInFd && subInFd.name !== st.nama) {
            st.nama = subInFd.name;
          }
        }
      });
    });

    // 2.3. Sync newly added Parent Categories from Finance to Dues
    nextFd.parentCategories.forEach(p => {
      if (p.type === 'income') {
        let existingKelas = nextId.kelasList.find(k => k.id === p.id);
        if (!existingKelas) {
          existingKelas = {
            id: p.id,
            nama: p.name,
            catatan: `Sinkronisasi Kas Ledger: ${p.name}`,
            deskripsi: `Sinkronisasi Kas Ledger: ${p.name}`,
            pilihan: ['Utama'],
            activePilihan: 'Utama',
            activeBagianId: `bagian_${p.id}_utama`,
            bagianList: [
              {
                id: `bagian_${p.id}_utama`,
                nama: 'Utama',
                students: []
              }
            ],
            students: []
          };
          nextId.kelasList.push(existingKelas);
        }
      }
    });

    // 2.4. Sync Categories to BagianList for each Kelas
    nextId.kelasList.forEach(k => {
      const catsInFd = nextFd.categories.filter(c => c.parentId === k.id && c.type === 'income');
      if (catsInFd.length > 0) {
        const nextBagians = catsInFd.map(c => {
          const possibleIds = [c.id, `bagian_${c.id}`];
          const oldB = k.bagianList.find(b => possibleIds.includes(b.id));
          return {
            id: oldB ? oldB.id : `bagian_${c.id}`,
            nama: c.name,
            students: oldB ? oldB.students : []
          };
        });

        k.bagianList = nextBagians;
        k.pilihan = nextBagians.map(b => b.nama);
        if (!k.activeBagianId || !nextBagians.some(b => b.id === k.activeBagianId)) {
          k.activeBagianId = nextBagians[0].id;
          k.activePilihan = nextBagians[0].nama;
        }
      }
    });

    // Check if activeKelasId got deleted, fallback to first available
    if (nextId.kelasList && nextId.kelasList.length > 0) {
      if (!nextId.kelasList.some(k => k.id === nextId.activeKelasId)) {
        nextId.activeKelasId = nextId.kelasList[0].id;
      }
    } else {
      nextId.activeKelasId = '';
    }
  }

  const activeSubcategoryIds = new Set<string>();
  const iuranCategoryIds = new Set<string>();

  // Ensure arrays exist
  if (!nextFd.parentCategories) nextFd.parentCategories = [];
  if (!nextFd.categories) nextFd.categories = [];
  if (!nextFd.subcategories) nextFd.subcategories = [];
  if (!nextFd.transactions) nextFd.transactions = [];

  // Helper routine to iterate over all students in our classes listings
  const forEachStudent = (targetId: IuranData, cb: (student: Student, kelasId: string, bagianId: string) => void) => {
    if (targetId.kelasList) {
      targetId.kelasList.forEach((kelas) => {
        if (kelas.bagianList) {
          kelas.bagianList.forEach((bagian) => {
            if (bagian.students) {
              bagian.students.forEach((student) => {
                cb(student, kelas.id, bagian.id);
              });
            }
          });
        }
      });
    }
  };

  // 0. Automatically create students in nextId (IuranData) for newly added subcategories under iuran-managed categories
  if (isFinanceChanged && !isIuranChanged && nextId.kelasList) {
    const existingStudentSubcategoryIds = new Set<string>();
    forEachStudent(nextId, (student) => {
      if (student.financeSubcategoryId) {
        existingStudentSubcategoryIds.add(student.financeSubcategoryId);
      }
    });

    nextFd.subcategories.forEach((sc) => {
      const c = nextFd.categories.find(cat => cat.id === sc.categoryId);
      if (c) {
        const isManagedParent = c.parentId === 'parent_al_hidayah' || c.parentId.startsWith('parent_iuran_') || c.parentId.startsWith('lembaga-');
        if (isManagedParent && !existingStudentSubcategoryIds.has(sc.id)) {
          const targetKelas = nextId.kelasList.find(k => k.id === c.parentId);
          if (targetKelas) {
            const possibleBagianIds = [c.id, `bagian_${c.id}`];
            let targetBagian = (targetKelas.bagianList || []).find(b => possibleBagianIds.includes(b.id));
            if (!targetBagian && targetKelas.bagianList && targetKelas.bagianList.length > 0) {
              targetBagian = targetKelas.bagianList[0];
            }
            if (targetBagian) {
              if (!targetBagian.students) targetBagian.students = [];
              if (!targetKelas.students) targetKelas.students = [];

              let maxNo = 0;
              targetBagian.students.forEach(st => {
                const num = parseFloat(st.no);
                if (!isNaN(num) && num > maxNo) maxNo = num;
              });
              const nextNo = String(Math.floor(maxNo) + 1);

              const studentId = `s_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              const newStudent: Student = {
                id: studentId,
                no: nextNo,
                nama: sc.name,
                financeSubcategoryId: sc.id,
                financeParentId: c.parentId,
                financeCategoryId: c.id,
                pembayaran: {}
              };

              MONTHS.forEach(m => {
                newStudent.pembayaran[m] = {
                  nominal: 0,
                  status: 'Belum',
                  tanggal: '',
                  catatan: ''
                };
              });

              targetBagian.students.push(newStudent);
              existingStudentSubcategoryIds.add(sc.id);
            }
          }
        }
      }
    });
  }

  // 1. Maintain Parent, Categories, and Subcategories from Classes Config metadata in FinanceData
  if (nextId.kelasList) {
    nextId.kelasList.forEach((kelas) => {
      const parentId = kelas.id || `parent_iuran_${kelas.nama.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      iuranCategoryIds.add(parentId);

      // Verify parent category exists 
      let fParent = nextFd.parentCategories.find(p => p.id === parentId);
      if (!fParent) {
        fParent = { id: parentId, type: 'income', name: kelas.nama, color: '#009688' };
        nextFd.parentCategories.push(fParent);
      }

      if (kelas.bagianList) {
        kelas.bagianList.forEach((bagian) => {
          const categoryId = bagian.id.replace(/^bagian_/, '');
          iuranCategoryIds.add(categoryId);

          // Verify category exists
          let fCategory = nextFd.categories.find(c => c.id === categoryId);
          if (!fCategory) {
            fCategory = { id: categoryId, parentId: parentId, type: 'income', name: bagian.nama, color: fParent!.color };
            nextFd.categories.push(fCategory);
          }

          if (bagian.students) {
            bagian.students.forEach((student) => {
              // Ensure student subcategory identifiers
              let subId = student.financeSubcategoryId || '';
              if (!subId) {
                subId = `sub_iuran_${student.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
                student.financeSubcategoryId = subId;
              }
              student.financeParentId = parentId;
              student.financeCategoryId = categoryId;
              activeSubcategoryIds.add(subId);

              // Ensure subcategory listing exists in FinanceData
              let fSubcategory = nextFd.subcategories.find(sc => sc.id === subId);
              if (!fSubcategory) {
                fSubcategory = { id: subId, categoryId: categoryId, name: student.nama };
                nextFd.subcategories.push(fSubcategory);
              } else {
                fSubcategory.name = student.nama;
              }
            });
          }
        });
      }
    });
  }

  // Filter out any stale subcategories in managed categories
  nextFd.subcategories = nextFd.subcategories.filter(sc => {
    if (nextFd.categories.some(c => c.id === sc.categoryId && iuranCategoryIds.has(c.parentId))) {
      return activeSubcategoryIds.has(sc.id);
    }
    return true;
  });

  // Filter out any stale parent categories and categories managed by iuran
  if (isIuranChanged) {
    const isManagedParentId = (id: string) => {
      return id.startsWith('parent_iuran_') || id.startsWith('lembaga-') || id === 'parent_al_hidayah';
    };

    nextFd.parentCategories = nextFd.parentCategories.filter(p => {
      if (isManagedParentId(p.id)) {
        return iuranCategoryIds.has(p.id);
      }
      return true;
    });

    nextFd.categories = nextFd.categories.filter(c => {
      const parentExists = nextFd.parentCategories.some(p => p.id === c.parentId);
      if (!parentExists) return false;
      
      if (isManagedParentId(c.parentId)) {
        return iuranCategoryIds.has(c.id);
      }
      return true;
    });

    nextFd.subcategories = nextFd.subcategories.filter(sc => {
      return nextFd.categories.some(c => c.id === sc.categoryId);
    });
  }

  if (isFinanceChanged && !isIuranChanged) {
    // === SYNC DIRECTION: FINANCE LEDGER changed -> PROPAGATE TO STUDENT DUES ===

    // Find any synchronized transactions that were DELETED by comparing with prevFd
    const deletedKeys = new Set<string>();
    if (prevFd) {
      prevFd.transactions.forEach(pt => {
        const isSynced = String(pt.id || '').startsWith(PREFIX) || pt.source === 'iuran-siswa';
        if (isSynced) {
          const ptKey = pt.syncKey || (pt.subcategory ? `${pt.subcategory}|${getMonthFromISO(pt.date)}` : null);
          if (ptKey) {
            const stillExists = nextFd.transactions.some(nt => nt.id === pt.id);
            if (!stillExists) {
              deletedKeys.add(ptKey);
            }
          }
        }
      });
    }

    // Traverse students and synchronize with ledger transaction entries
    forEachStudent(nextId, (student) => {
      const subId = student.financeSubcategoryId;
      if (!subId) return;

      if (!student.pembayaran) student.pembayaran = {};

      Object.keys(student.pembayaran).forEach(bulan => {
        const key = `${subId}|${bulan}`;
        const p = student.pembayaran[bulan];

        // Case: Transaction was explicitly deleted in Kas Ledger
        if (deletedKeys.has(key)) {
          p.status = 'Belum';
          p.nominal = 0;
          p.tanggal = '';
          p.financeTransactionId = undefined;
          p.syncKey = undefined;
          p.syncSource = undefined;
          return;
        }

        // Search for active matching transaction in nextFd (by syncKey, or subcategory+month pairing)
        const matchedTx = nextFd.transactions.find(t => 
          t.syncKey === key || 
          (t.subcategory === subId && getMonthFromISO(t.date) === bulan && (t.source === 'iuran-siswa' || String(t.id || '').startsWith(PREFIX)))
        );

        if (matchedTx) {
          // Sync changes from modified Ledger Transaction back down to Student payment
          p.status = 'Lunas';
          p.nominal = matchedTx.amount;
          p.tanggal = matchedTx.date;
          p.financeTransactionId = matchedTx.id;
          p.syncKey = key;
          p.syncSource = 'iuran-siswa';
          p.type = matchedTx.type;
        } else {
          // If transaction is deleted or missing, but student was marked Lunas, reset dues to Belum
          if (p.status === 'Lunas') {
            p.status = 'Belum';
            p.nominal = 0;
            p.tanggal = '';
            p.financeTransactionId = undefined;
            p.syncKey = undefined;
            p.syncSource = undefined;
            p.type = undefined;
          }
        }
      });

      // Scan all transactions in ledger to see if a transaction was manually added/edited for this student
      nextFd.transactions.forEach((t) => {
        if (t.subcategory === subId && (t.type === 'income' || t.type === 'expense') && t.amount > 0) {
          const bulan = getMonthFromISO(t.date);
          const key = `${subId}|${bulan}`;
          if (!student.pembayaran[bulan]) {
            student.pembayaran[bulan] = {
              status: 'Belum',
              nominal: 0,
              tanggal: '',
              catatan: ''
            };
          }
          const p = student.pembayaran[bulan];
          p.status = 'Lunas';
          p.nominal = t.amount;
          p.tanggal = t.date;
          p.financeTransactionId = t.id;
          p.syncKey = key;
          p.syncSource = 'iuran-siswa';
          p.type = t.type;
        }
      });
    });

  } else {
    // === SYNC DIRECTION: STUDENT DUES changed -> PROPAGATE TO FINANCE LEDGER ===
    const paidMap = new Map<string, {
      key: string;
      bulan: string;
      student: Student;
      payment: any;
      nominal: number;
      parentId: string;
      categoryId: string;
      subcategoryId: string;
      date: string;
      note: string;
    }>();

    forEachStudent(nextId, (student, kelasId, bagianId) => {
      const parentId = kelasId;
      const categoryId = bagianId.replace(/^bagian_/, '');
      const subId = student.financeSubcategoryId;
      if (!subId) return;

      const pembayaran = student.pembayaran || {};
      Object.keys(pembayaran).forEach((bulan) => {
        const p = pembayaran[bulan];
        const key = `${subId}|${bulan}`;
        const nominal = Number(p.nominal || 0);

        if (p.status === 'Lunas' && nominal > 0) {
          const date = p.tanggal || todayISOForBulan(bulan);
          const note = `Iuran ${bulan} - ${student.no ? student.no + '. ' : ''}${student.nama}${p.catatan ? ' (' + p.catatan + ')' : ''}`;
          paidMap.set(key, {
            key,
            bulan,
            student,
            payment: p,
            nominal,
            parentId,
            categoryId,
            subcategoryId: subId,
            date,
            note
          });
        }
      });
    });

    const finalTransactions: Transaction[] = [];
    const seenKeys = new Set<string>();

    nextFd.transactions.forEach((t) => {
      const isSyncedTx = String(t.id || '').startsWith(PREFIX) || t.source === 'iuran-siswa';
      const key = t.syncKey || (isSyncedTx && t.subcategory ? `${t.subcategory}|${getMonthFromISO(t.date)}` : null);

      if (key) {
        const info = paidMap.get(key);
        if (info) {
          const payloadType = info.payment.type || 'income';
          // Keep/update transaction in finance ledger
          t.type = payloadType;
          t.parentCategory = info.parentId;
          t.category = info.categoryId;
          t.subcategory = info.subcategoryId;
          t.amount = info.nominal;
          t.date = info.date;
          t.note = info.note;
          t.source = 'iuran-siswa';
          t.syncKey = key;
          t.updatedAt = new Date().toISOString();
          if (!t.createdAt) t.createdAt = t.updatedAt;

          info.payment.syncSource = 'iuran-siswa';
          info.payment.syncKey = key;
          info.payment.financeTransactionId = t.id;

          finalTransactions.push(t);
          seenKeys.add(key);
        } else {
          // If transaction is synced but payment is no longer marked "Lunas", discard the transaction
          if (isSyncedTx) {
            // Discard (un-synchronize)
          } else {
            finalTransactions.push(t);
          }
        }
      } else {
        // Keep standard cash ledger entries
        finalTransactions.push(t);
      }
    });

    // Create new synced transactions
    paidMap.forEach((info, key) => {
      if (seenKeys.has(key)) return;

      const txId = `${PREFIX}${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const payloadType = info.payment.type || 'income';
      info.payment.syncSource = 'iuran-siswa';
      info.payment.syncKey = key;
      info.payment.financeTransactionId = txId;

      finalTransactions.push({
        id: txId,
        type: payloadType,
        parentCategory: info.parentId,
        category: info.categoryId,
        subcategory: info.subcategoryId,
        amount: info.nominal,
        date: info.date,
        note: info.note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'iuran-siswa',
        syncKey: key
      });
    });

    nextFd.transactions = finalTransactions;
  }

  nextFd.updatedAt = new Date().toISOString();
  nextId.students = nextId.students || [];

  // Re-synchronize the high level active students list copy to avoid any stale representations
  if (nextId.kelasList && nextId.activeKelasId) {
    const activeK = nextId.kelasList.find(k => k.id === nextId.activeKelasId);
    if (activeK) {
      const activeB = activeK.bagianList.find(b => b.id === activeK.activeBagianId) || activeK.bagianList[0];
      if (activeB) {
        nextId.students = activeB.students || [];
      }
    }
  }

  return { fd: nextFd, id: nextId };
}

