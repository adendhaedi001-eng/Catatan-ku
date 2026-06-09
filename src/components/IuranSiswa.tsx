import React, { useState, useMemo } from 'react';
import { 
  FinanceData, 
  IuranData, 
  Student, 
  Payment, 
  Kelas, 
  Bagian 
} from '../types';
import { 
  formatMoney, 
  todayISO, 
  MONTHS, 
  uid, 
  escapeHtml, 
  todayISOForBulan,
  INITIAL_STUDENT_TEMPLATES
} from '../utils';
import { 
  Share2, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Download, 
  Upload, 
  Printer, 
  PlusCircle, 
  Clipboard, 
  Image as ImageIcon, 
  FileText, 
  RefreshCw, 
  Info, 
  BookOpen, 
  CreditCard 
} from 'lucide-react';

interface IuranSiswaProps {
  data: IuranData;
  onDataChange: (next: IuranData) => void;
  financeData: FinanceData;
  onFinanceDataChange: (next: FinanceData) => void;
}

export const IuranSiswa: React.FC<IuranSiswaProps> = ({
  data,
  onDataChange,
  financeData,
  onFinanceDataChange
}) => {
  // Navigation & Filtering State
  const [activeKelasId, setActiveKelasId] = useState<string>(data.activeKelasId || 'lembaga-kelas');
  const [startBulan, setStartBulan] = useState<string>('Mei');
  const [endBulan, setEndBulan] = useState<string>('Mei');
  const [searchQuery, setSearchQ] = useState<string>('');

  // Fallback for compatibility
  const activeBulan = startBulan;

  const activeMonths = useMemo(() => {
    const startIdx = MONTHS.indexOf(startBulan);
    const endIdx = MONTHS.indexOf(endBulan);
    if (startIdx <= endIdx) {
      return MONTHS.slice(startIdx, endIdx + 1);
    } else {
      return MONTHS.slice(endIdx, startIdx + 1);
    }
  }, [startBulan, endBulan]);

  // Active Kelas/Bagian extraction
  const currentKelas = useMemo(() => {
    return (data.kelasList || []).find(k => k.id === activeKelasId) || (data.kelasList || [])[0];
  }, [data.kelasList, activeKelasId]);

  const activeBagianId = currentKelas?.activeBagianId || currentKelas?.bagianList?.[0]?.id || '';

  const currentBagian = useMemo(() => {
    return currentKelas?.bagianList?.find(b => b.id === activeBagianId) || currentKelas?.bagianList?.[0];
  }, [currentKelas, activeBagianId]);

  // Current list of students for active section
  const currentStudents = useMemo(() => {
    return currentBagian?.students || [];
  }, [currentBagian]);

  // Filtered students on query search
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return currentStudents.filter(s => {
      const matchNo = String(s.no || '').toLowerCase().includes(q);
      const matchName = String(s.nama || '').toLowerCase().includes(q);
      return matchNo || matchName;
    }).sort((a,b) => {
      const numA = parseInt(String(a.no).match(/\d+/)?.[0] || '999999');
      const numB = parseInt(String(b.no).match(/\d+/)?.[0] || '999999');
      return numA - numB;
    });
  }, [currentStudents, searchQuery]);

  // Modals state
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showManageStudentsModal, setShowManageStudentsModal] = useState<boolean>(false);
  const [showManageKelasModal, setShowManageKelasModal] = useState<boolean>(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState<boolean>(false);
  const [bulkActionType, setBulkActionType] = useState<'Lunas' | 'Belum'>('Lunas');

  // Add / Edit Student State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [editStudentNo, setEditStudentNo] = useState<string>('');
  const [editStudentName, setEditStudentName] = useState<string>('');
  const [editStudentNominal, setEditStudentNominal] = useState<string>('0');

  // Add / Edit Lembaga State
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [editKelasName, setEditKelasName] = useState<string>('');
  const [editKelasPilihan, setEditKelasPilihan] = useState<string>('');
  const [editKelasCatatan, setEditKelasCatatan] = useState<string>('');

  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Safe Access to Student Payment record
  const getStudentPayment = (s: Student, monthName: string): Payment => {
    const p = s.pembayaran?.[monthName];
    if (p) return p;
    return { nominal: 0, status: 'Belum', tanggal: '', catatan: '' };
  };

  // Stats Calculations
  const metrics = useMemo(() => {
    const list = filteredStudents;
    let totalPayments = 0;
    let lunasCount = 0;
    let totalUang = 0;

    list.forEach(s => {
      activeMonths.forEach(m => {
        totalPayments++;
        const pay = getStudentPayment(s, m);
        if (pay.status === 'Lunas') {
          lunasCount++;
          totalUang += pay.nominal || 0;
        }
      });
    });

    return { 
      total: totalPayments, 
      lunas: lunasCount, 
      belum: totalPayments - lunasCount, 
      uang: totalUang 
    };
  }, [filteredStudents, activeMonths]);

  // Dues Accumulations
  const rekapMode = data.adminRekap?.mode || 'bulanan';
  const rekapBulanSelection = data.adminRekap?.bulan || 'semua';
  const rekapDateSelection = data.adminRekap?.tanggal || todayISO();
  const rekapStartSelection = data.adminRekap?.mulai || todayISO();
  const rekapEndSelection = data.adminRekap?.sampai || todayISO();

  // Multi-Institution Management Handlers
  const handleActiveKelasChange = (nextId: string) => {
    setActiveKelasId(nextId);
    onDataChange({
      ...data,
      activeKelasId: nextId
    });
    showToast(`Lembaga diubah.`);
  };

  const handleActiveBagianChange = (nextId: string) => {
    if (!currentKelas) return;
    const nextList = (data.kelasList || []).map(k => {
      if (k.id === currentKelas.id) {
        const found = k.bagianList.find(b => b.id === nextId);
        return {
          ...k,
          activeBagianId: nextId,
          activePilihan: found ? found.nama : k.activePilihan,
          students: found ? found.students : k.students
        };
      }
      return k;
    });

    onDataChange({
      ...data,
      kelasList: nextList
    });
  };

  // Individual toggle status payment
  const handleToggleStatus = (studentId: string, monthName: string = activeBulan) => {
    if (!currentKelas || !currentBagian) return;
    const nextList = (data.kelasList || []).map(k => {
      if (k.id === currentKelas.id) {
        const nextParts = k.bagianList.map(b => {
          if (b.id === currentBagian.id) {
            const nextSts = b.students.map(s => {
              if (s.id === studentId) {
                const p = getStudentPayment(s, monthName);
                const nextStatus = p.status === 'Lunas' ? 'Belum' : 'Lunas';
                return {
                  ...s,
                  pembayaran: {
                    ...s.pembayaran,
                    [monthName]: {
                      ...p,
                      status: nextStatus,
                      nominal: nextStatus === 'Lunas' ? (p.nominal || Number(editStudentNominal) || Number(data.nominalDefault) || 10000) : 0, // default nominal or previous
                      tanggal: nextStatus === 'Lunas' ? (p.tanggal || todayISOForBulan(monthName)) : ''
                    }
                  }
                };
              }
              return s;
            });
            return { ...b, students: nextSts };
          }
          return b;
        });
        const activeB = nextParts.find(b => b.id === k.activeBagianId) || nextParts[0];
        return {
          ...k,
          bagianList: nextParts,
          students: activeB ? activeB.students : []
        };
      }
      return k;
    });

    onDataChange({
      ...data,
      kelasList: nextList
    });

    showToast('Status iuran diperbarui.');
  };

  const handleUpdateNominal = (studentId: string, amtStr: string, monthName: string = activeBulan) => {
    if (!currentKelas || !currentBagian) return;
    const num = Number(amtStr) || 0;
    const nextList = (data.kelasList || []).map(k => {
      if (k.id === currentKelas.id) {
        const nextParts = k.bagianList.map(b => {
          if (b.id === currentBagian.id) {
            const nextSts = b.students.map(s => {
              if (s.id === studentId) {
                const p = getStudentPayment(s, monthName);
                return {
                  ...s,
                  pembayaran: {
                    ...s.pembayaran,
                    [monthName]: {
                      ...p,
                      nominal: num,
                      status: p.status // preserve status
                    }
                  }
                };
              }
              return s;
            });
            return { ...b, students: nextSts };
          }
          return b;
        });
        const activeB = nextParts.find(b => b.id === k.activeBagianId) || nextParts[0];
        return {
          ...k,
          bagianList: nextParts,
          students: activeB ? activeB.students : []
        };
      }
      return k;
    });

    onDataChange({
      ...data,
      kelasList: nextList
    });
  };

  const handleUpdateTanggal = (studentId: string, dateStr: string, monthName: string = activeBulan) => {
    if (!currentKelas || !currentBagian) return;
    const nextList = (data.kelasList || []).map(k => {
      if (k.id === currentKelas.id) {
        const nextParts = k.bagianList.map(b => {
          if (b.id === currentBagian.id) {
            const nextSts = b.students.map(s => {
              if (s.id === studentId) {
                const p = getStudentPayment(s, monthName);
                return {
                  ...s,
                  pembayaran: {
                    ...s.pembayaran,
                    [monthName]: {
                      ...p,
                      tanggal: dateStr
                    }
                  }
                };
              }
              return s;
            });
            return { ...b, students: nextSts };
          }
          return b;
        });
        const activeB = nextParts.find(b => b.id === k.activeBagianId) || nextParts[0];
        return {
          ...k,
          bagianList: nextParts,
          students: activeB ? activeB.students : []
        };
      }
      return k;
    });

    onDataChange({
      ...data,
      kelasList: nextList
    });
  };

  // Bulk Apply lunas state
  const handleBulkApplyStatus = () => {
    if (!currentKelas || !currentBagian) return;
    
    const idsToApply = filteredStudents.map(s => s.id);
    const nextList = (data.kelasList || []).map(k => {
      if (k.id === currentKelas.id) {
        const nextParts = k.bagianList.map(b => {
          if (b.id === currentBagian.id) {
            const nextSts = b.students.map(s => {
              if (idsToApply.includes(s.id)) {
                const updatedPembayaran = { ...s.pembayaran };
                activeMonths.forEach(m => {
                  const p = getStudentPayment(s, m);
                  updatedPembayaran[m] = {
                    ...p,
                    status: bulkActionType,
                    nominal: bulkActionType === 'Lunas' ? (p.nominal || Number(editStudentNominal) || Number(data.nominalDefault) || 10000) : 0,
                    tanggal: bulkActionType === 'Lunas' ? (p.tanggal || todayISOForBulan(m)) : ''
                  };
                });
                return {
                  ...s,
                  pembayaran: updatedPembayaran
                };
              }
              return s;
            });
            return { ...b, students: nextSts };
          }
          return b;
        });
        const activeB = nextParts.find(b => b.id === k.activeBagianId) || nextParts[0];
        return {
          ...k,
          bagianList: nextParts,
          students: activeB ? activeB.students : []
        };
      }
      return k;
    });

    onDataChange({
      ...data,
      kelasList: nextList
    });

    setShowBulkActionModal(false);
    showToast(`Menerapkan status bulk ${bulkActionType} untuk bulan ${activeMonths.join(', ')} selesai.`);
  };

  // Students modal addition
  const handleModalStudentSelectedChange = (stId: string) => {
    setSelectedStudentId(stId);
    if (!stId) {
      setEditStudentNo('');
      setEditStudentName('');
      setEditStudentNominal('0');
      return;
    }
    const s = currentStudents.find(x => x.id === stId);
    if (s) {
      setEditStudentNo(s.no);
      setEditStudentName(s.nama);
      setEditStudentNominal(String(getStudentPayment(s, activeBulan).nominal || 0));
    }
  };

  const handleAddStudent = () => {
    if (!editStudentNo.trim() || !editStudentName.trim()) {
      return alert('Isi No dan Nama Siswa!');
    }
    if (!currentKelas || !currentBagian) return;

    if (currentStudents.some(s => s.no === editStudentNo.trim())) {
      return alert('Nomor siswa sudah terdaftar!');
    }

    const nextIdVal = uid('student');
    const newStudent: Student = {
      id: nextIdVal,
      no: editStudentNo.trim(),
      nama: editStudentName.trim(),
      pembayaran: {
        [activeBulan]: {
          nominal: Number(editStudentNominal) || 0,
          status: Number(editStudentNominal) > 0 ? 'Lunas' : 'Belum',
          tanggal: Number(editStudentNominal) > 0 ? todayISOForBulan(activeBulan) : '',
          catatan: ''
        }
      }
    };

    const nextList = (data.kelasList || []).map(k => {
      if (k.id === currentKelas.id) {
        const nextParts = k.bagianList.map(b => {
          if (b.id === currentBagian.id) {
            return {
              ...b,
              students: [...b.students, newStudent]
            };
          }
          return b;
        });
        const activeB = nextParts.find(b => b.id === k.activeBagianId) || nextParts[0];
        return {
          ...k,
          bagianList: nextParts,
          students: activeB ? activeB.students : []
        };
      }
      return k;
    });

    onDataChange({
      ...data,
      kelasList: nextList
    });

    setEditStudentNo('');
    setEditStudentName('');
    showToast('Siswa baru berhasil ditambahkan.');
  };

  const handleUpdateStudent = () => {
    if (!selectedStudentId) return alert('Pilih siswa yang ingin diperbarui!');
    if (!editStudentNo.trim() || !editStudentName.trim()) return alert('Isi No dan Nama!');
    if (!currentKelas || !currentBagian) return;

    const nextList = (data.kelasList || []).map(k => {
      if (k.id === currentKelas.id) {
        const nextParts = k.bagianList.map(b => {
          if (b.id === currentBagian.id) {
            const nextSts = b.students.map(s => {
              if (s.id === selectedStudentId) {
                const pay = getStudentPayment(s, activeBulan);
                return {
                  ...s,
                  no: editStudentNo.trim(),
                  nama: editStudentName.trim(),
                  pembayaran: {
                    ...s.pembayaran,
                    [activeBulan]: {
                      ...pay,
                      nominal: Number(editStudentNominal) || 0,
                      status: Number(editStudentNominal) > 0 ? 'Lunas' : pay.status
                    }
                  }
                };
              }
              return s;
            });
            return { ...b, students: nextSts };
          }
          return b;
        });
        const activeB = nextParts.find(b => b.id === k.activeBagianId) || nextParts[0];
        return {
          ...k,
          bagianList: nextParts,
          students: activeB ? activeB.students : []
        };
      }
      return k;
    });

    onDataChange({
      ...data,
      kelasList: nextList
    });

    setSelectedStudentId('');
    setEditStudentNo('');
    setEditStudentName('');
    showToast('Data siswa berhasil diubah.');
  };

  const handleDeleteStudent = () => {
    if (!selectedStudentId) return showToast('Pilih siswa terlebih dahulu!');
    if (!currentKelas || !currentBagian) return;

    askConfirmation(
      'Hapus Siswa',
      'Apakah Anda yakin ingin menghapus siswa ini dari program? Data pembayaran iuran bersangkutan juga akan dihapus.',
      () => {
        const nextList = (data.kelasList || []).map(k => {
          if (k.id === currentKelas.id) {
            const nextParts = k.bagianList.map(b => {
              if (b.id === currentBagian.id) {
                return {
                  ...b,
                  students: b.students.filter(s => s.id !== selectedStudentId)
                };
              }
              return b;
            });
            const activeB = nextParts.find(b => b.id === k.activeBagianId) || nextParts[0];
            return {
              ...k,
              bagianList: nextParts,
              students: activeB ? activeB.students : []
            };
          }
          return k;
        });

        onDataChange({
          ...data,
          kelasList: nextList
        });

        setSelectedStudentId('');
        setEditStudentNo('');
        setEditStudentName('');
        showToast('Siswa berhasil dihapus.');
      }
    );
  };

  // Administration of Institutions Modal Actions
  const handleModalKelasChange = (kId: string) => {
    setSelectedKelasId(kId);
    if (!kId) {
      setEditKelasName('');
      setEditKelasPilihan('');
      setEditKelasCatatan('');
      return;
    }
    const k = (data.kelasList || []).find(x => x.id === kId);
    if (k) {
      setEditKelasName(k.nama);
      setEditKelasPilihan(k.pilihan.join('\n'));
      setEditKelasCatatan(k.catatan);
    }
  };

  const handleLoadAlhidayahTemplate = () => {
    askConfirmation(
      'Muat Template Alhidayah',
      'Apakah Anda ingin memasukkan data Induk Kategori "Alhidayah" dengan Kategori "Semua" dan subkategori nama-nama siswanya ke dalam daftar lembaga Anda (dalam memori/dapat diubah)?',
      () => {
        // Prepare students data for all months
        const templateStudents: Student[] = INITIAL_STUDENT_TEMPLATES.map((st, index) => {
          const pembayaran: Record<string, Payment> = {};
          MONTHS.forEach(m => {
            pembayaran[m] = {
              nominal: 0,
              status: 'Belum',
              tanggal: '',
              catatan: ''
            };
          });
          return {
            id: `s_alhidayah_${String(index + 1).padStart(3, '0')}`,
            no: st.no,
            nama: st.nama,
            pembayaran,
            financeParentId: 'parent_al_hidayah',
            financeCategoryId: 'cat_al_hidayah_semua',
            financeSubcategoryId: `sub_al_hidayah_${String(index + 1).padStart(2, '0')}`
          };
        });

        const newK: Kelas = {
          id: 'parent_al_hidayah',
          nama: 'Alhidayah',
          catatan: 'Template data iuran Alhidayah',
          deskripsi: 'Template data iuran Alhidayah',
          pilihan: ['Semua'],
          activePilihan: 'Semua',
          activeBagianId: 'bagian_cat_al_hidayah_semua',
          bagianList: [
            {
              id: 'bagian_cat_al_hidayah_semua',
              nama: 'Semua',
              students: templateStudents
            }
          ],
          students: templateStudents
        };

        const nextKelasList = [...(data.kelasList || [])];
        const existsIdx = nextKelasList.findIndex(k => k.id === 'parent_al_hidayah');
        if (existsIdx >= 0) {
          nextKelasList[existsIdx] = newK;
        } else {
          nextKelasList.push(newK);
        }

        setActiveKelasId('parent_al_hidayah');
        onDataChange({
          ...data,
          kelasList: nextKelasList,
          activeKelasId: 'parent_al_hidayah'
        });

        showToast('Template Alhidayah berhasil dimuat ke dalam memori.');
      }
    );
  };

  const handleAddKelas = () => {
    if (!editKelasName.trim()) return alert('Isi Nama Lembaga!');
    const parts = editKelasPilihan.split('\n').map(x => x.trim()).filter(Boolean);
    const partsList = parts.length ? parts : ['Utama'];
    
    const newK: Kelas = {
      id: `lembaga_${uid()}`,
      nama: editKelasName.trim(),
      catatan: editKelasCatatan.trim(),
      deskripsi: editKelasCatatan.trim(),
      pilihan: partsList,
      activePilihan: partsList[0],
      activeBagianId: `bagian_${uid()}`,
      bagianList: partsList.map((p, index) => ({
        id: index === 0 ? `bagian_${uid()}` : `bagian_sub_${uid()}`,
        nama: p,
        students: []
      })),
      students: []
    };

    onDataChange({
      ...data,
      kelasList: [...(data.kelasList || []), newK]
    });

    setEditKelasName('');
    setEditKelasPilihan('');
    setEditKelasCatatan('');
    showToast('Lembaga baru berhasil didaftarkan.');
  };

  const handleUpdateKelas = () => {
    if (!selectedKelasId) return alert('Pilih Lembaga!');
    const parts = editKelasPilihan.split('\n').map(x => x.trim()).filter(Boolean);
    const partsList = parts.length ? parts : ['Utama'];

    const nextList = (data.kelasList || []).map(k => {
      if (k.id === selectedKelasId) {
        // preserve old bagians if name matches
        const existingBagianList = k.bagianList || [];
        const nextBagians = partsList.map(pName => {
          const old = existingBagianList.find(b => b.nama.toLowerCase() === pName.toLowerCase());
          return {
            id: old ? old.id : `bagian_${uid()}`,
            nama: pName,
            students: old ? old.students : []
          };
        });

        return {
          ...k,
          nama: editKelasName.trim(),
          catatan: editKelasCatatan.trim(),
          deskripsi: editKelasCatatan.trim(),
          pilihan: partsList,
          bagianList: nextBagians,
          activeBagianId: nextBagians[0]?.id || k.activeBagianId,
          activePilihan: nextBagians[0]?.nama || k.activePilihan,
          students: nextBagians[0]?.students || []
        };
      }
      return k;
    });

    onDataChange({
      ...data,
      kelasList: nextList
    });

    setSelectedKelasId('');
    setEditKelasName('');
    setEditKelasPilihan('');
    setEditKelasCatatan('');
    showToast('Data lembaga berhasil diperbarui.');
  };

  const handleDeleteKelas = () => {
    if (!selectedKelasId) return showToast('Pilih Lembaga!');
    if ((data.kelasList || []).length <= 1) return showToast('Harus ada setidaknya satu lembaga!');

    askConfirmation(
      'Hapus Lembaga',
      'Apakah Anda yakin ingin menghapus lembaga ini beserta seluruh bagian dan siswanya?',
      () => {
        const nextList = (data.kelasList || []).filter(k => k.id !== selectedKelasId);
        onDataChange({
          ...data,
          kelasList: nextList,
          activeKelasId: nextList[0].id
        });
        setActiveKelasId(nextList[0].id);

        setSelectedKelasId('');
        setEditKelasName('');
        setEditKelasPilihan('');
        setEditKelasCatatan('');
        showToast('Lembaga berhasil dihapus.');
      }
    );
  };

  // Dues Accumulations list computations
  const rekapRows = useMemo(() => {
    if (rekapMode === 'bulanan') {
      const targetBulanList = rekapBulanSelection === 'semua' ? MONTHS : [rekapBulanSelection];
      return targetBulanList.map(month => {
        let totalVal = 0;
        let lunasCt = 0;
        let belumCt = 0;
        currentStudents.forEach(s => {
          const p = getStudentPayment(s, month);
          if (p.status === 'Lunas') {
            lunasCt += 1;
            totalVal += p.nominal || 0;
          } else {
            belumCt += 1;
          }
        });
        return { label: month, total: totalVal, lunas: lunasCt, belum: belumCt };
      });
    } else if (rekapMode === 'harian') {
      let totalVal = 0;
      let countVal = 0;
      currentStudents.forEach(s => {
        MONTHS.forEach(m => {
          const p = getStudentPayment(s, m);
          if (p.status === 'Lunas' && p.tanggal === rekapDateSelection) {
            totalVal += p.nominal || 0;
            countVal += 1;
          }
        });
      });
      return [{ label: `Tanggal ${rekapDateSelection}`, total: totalVal, lunas: countVal, belum: '-' }];
    } else {
      // custom ranges
      let totalVal = 0;
      let countVal = 0;
      currentStudents.forEach(s => {
        MONTHS.forEach(m => {
          const p = getStudentPayment(s, m);
          if (p.status === 'Lunas' && p.tanggal >= rekapStartSelection && p.tanggal <= rekapEndSelection) {
            totalVal += p.nominal || 0;
            countVal += 1;
          }
        });
      });
      return [{ label: `${rekapStartSelection} s/d ${rekapEndSelection}`, total: totalVal, lunas: countVal, belum: '-' }];
    }
  }, [currentStudents, rekapMode, rekapBulanSelection, rekapDateSelection, rekapStartSelection, rekapEndSelection]);

  const rekapGrandTotal = useMemo(() => {
    return rekapRows.reduce((sum, r) => sum + (typeof r.total === 'number' ? r.total : 0), 0);
  }, [rekapRows]);

  const handleUpdateRekapSetting = (key: string, value: string) => {
    onDataChange({
      ...data,
      adminRekap: {
        ...(data.adminRekap || {
          mode: 'bulanan',
          bulan: 'semua',
          tanggal: todayISO(),
          mulai: todayISO(),
          sampai: todayISO()
        }),
        [key]: value
      }
    });
  };

  // WhatsApp Message Text Builder
  const handleCopyTextWA = () => {
    let text = `*DAFTAR IURAN SISSA*\n`;
    text += `Lembaga: ${currentKelas?.nama || ''}\n`;
    text += `Bagian: ${currentBagian?.nama || ''}\n`;
    text += `Bulan: ${activeBulan}\n`;
    text += `Siswa Terdaftar: ${metrics.total}\n`;
    text += `Lunas: ${metrics.lunas} | Belum Lunas: ${metrics.belum}\n`;
    text += `------------------------------------\n\n`;

    filteredStudents.forEach(s => {
      const p = getStudentPayment(s, activeBulan);
      text += `${s.no}. ${s.nama}\n`;
      text += `Status: *${p.status}* ${p.status === 'Lunas' ? `(Bayar: ${p.tanggal})` : ''}\n\n`;
    });

    navigator.clipboard.writeText(text);
    alert('Teks laporan WhatsApp berhasil disalin ke clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white border border-slate-700 px-5 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main summary grids */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl shadow-xl">
          <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider mb-1">TOTAL SISWA</span>
          <span className="text-2xl font-black text-white block">{metrics.total}</span>
        </div>
        <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 p-4 rounded-3xl shadow-lg shadow-emerald-500/5">
          <span className="text-emerald-400 block text-[10px] font-extrabold uppercase tracking-wider mb-1">LUNAS</span>
          <span className="text-2xl font-black text-emerald-300 block">{metrics.lunas}</span>
        </div>
        <div className="bg-rose-500/10 backdrop-blur-md border border-rose-500/20 p-4 rounded-3xl shadow-lg shadow-rose-500/5">
          <span className="text-rose-400 block text-[10px] font-extrabold uppercase tracking-wider mb-1">BELUM BAYAR</span>
          <span className="text-2xl font-black text-rose-400 block">{metrics.belum}</span>
        </div>
        <div className="bg-sky-500/10 backdrop-blur-md border border-sky-500/20 p-4 rounded-3xl shadow-lg shadow-sky-500/5">
          <span className="text-sky-400 block text-[10px] font-extrabold uppercase tracking-wider mb-1">IURAN TERKUMPUL</span>
          <span className="text-2xl font-black text-sky-300 block">{formatMoney(metrics.uang, financeData.settings)}</span>
        </div>
      </div>

      {/* Filter and control toolbox */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl text-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Active institution dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Induk Kategori (Lembaga)</label>
            <select
              value={activeKelasId}
              onChange={e => handleActiveKelasChange(e.target.value)}
              className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white text-xs focus:border-blue-500/50"
            >
              {(data.kelasList || []).map(k => (
                <option key={k.id} value={k.id} className="bg-slate-900 text-white">{k.nama}</option>
              ))}
            </select>
          </div>

          {/* Section dropdown of institution */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Kategori (Bagian)</label>
            <select
              value={activeBagianId}
              onChange={e => handleActiveBagianChange(e.target.value)}
              className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white text-xs focus:border-blue-500/50"
            >
              {currentKelas?.bagianList?.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">{b.nama}</option>
              ))}
            </select>
          </div>

          {/* Month query filter */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Bulan Iuran (Range)</label>
            <div className="flex gap-1.5 items-center">
              <select
                value={startBulan}
                onChange={e => setStartBulan(e.target.value)}
                className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white text-xs focus:border-blue-500/50"
              >
                {MONTHS.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 font-bold px-1">s/d</span>
              <select
                value={endBulan}
                onChange={e => setEndBulan(e.target.value)}
                className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white text-xs focus:border-blue-500/50"
              >
                {MONTHS.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search box input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Cari Siswa</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="No atau Nama..."
                value={searchQuery}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full font-semibold bg-white/5 border border-white/10 py-3 pl-8 pr-3 rounded-2xl focus:outline-none text-white text-xs focus:border-blue-500/50"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        {/* Quick actions buttons row */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10 justify-end">
          <button onClick={() => setShowShareModal(true)} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1 text-[11px]">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button onClick={() => { setBulkActionType('Lunas'); setShowBulkActionModal(true); }} className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs rounded-xl transition flex items-center gap-1 text-[11px]">
            <Check className="w-3.5 h-3.5" /> Set Lunas
          </button>
          <button onClick={() => { setBulkActionType('Belum'); setShowBulkActionModal(true); }} className="p-2.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/30 text-rose-400 font-extrabold text-xs rounded-xl transition flex items-center gap-1 text-[11px]">
            <X className="w-3.5 h-3.5" /> Batalkan Lunas
          </button>
          <button onClick={() => setShowManageStudentsModal(true)} className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1 shadow-lg shadow-rose-600/15 text-[11px]">
            <Plus className="w-3.5 h-3.5" /> Siswa
          </button>
        </div>
      </div>

      {/* Main Student Dues Interactive Grid / Table Card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl overflow-hidden shadow-xl text-slate-200">
        <h3 className="font-extrabold text-base text-white mb-4 block">DAFTAR KETERANGAN IURAN ({filteredStudents.length * activeMonths.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-semibold text-left min-w-[550px]">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 tracking-wider uppercase font-black text-[10px]">
                <th className="pb-3 w-16">No</th>
                <th className="pb-3">Siswa (Sub Kategori)</th>
                <th className="pb-3 w-24">Bulan</th>
                <th className="pb-3 text-center w-28">Status</th>
                <th className="pb-3 text-right w-36">Nominal (Rp)</th>
                <th className="pb-3 text-center w-36">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-extrabold">Tidak ada data siswa.</td>
                </tr>
              ) : (
                filteredStudents.flatMap(s => {
                  return activeMonths.map(month => {
                    const pay = getStudentPayment(s, month);
                    const isPaid = pay.status === 'Lunas';
                    return (
                      <tr key={`${s.id}-${month}`} className="text-slate-350 hover:bg-white/5 transition">
                        <td className="py-3 font-black text-rose-450">{s.no}</td>
                        <td className="py-3">
                          <span className="font-extrabold text-white block">{s.nama}</span>
                          {pay.catatan && <span className="text-[10px] text-slate-400 block">Keterangan: {pay.catatan}</span>}
                        </td>
                        <td className="py-3 text-blue-400 font-bold text-[11px] uppercase tracking-wider">{month}</td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleToggleStatus(s.id, month)}
                            className={`py-1 w-20 text-[10px] uppercase font-black tracking-wider transition rounded-full shadow-sm text-center cursor-pointer ${isPaid ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border border-rose-500/20'}`}
                          >
                            {isPaid ? '✓ Lunas' : 'Bayar'}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <input 
                            type="number"
                            placeholder="0"
                            disabled={!isPaid}
                            value={isPaid ? (pay.nominal || 0) : ''}
                            onChange={e => handleUpdateNominal(s.id, e.target.value, month)}
                            className={`w-28 text-right font-black border p-1 rounded-xl text-xs bg-white/5 focus:outline-none text-white disabled:opacity-50 ${isPaid ? 'border-white/10' : 'border-transparent'}`}
                          />
                        </td>
                        <td className="py-3 text-center">
                          <input 
                            type="date"
                            disabled={!isPaid}
                            value={pay.tanggal || ''}
                            onChange={e => handleUpdateTanggal(s.id, e.target.value, month)}
                            className={`w-32 text-center text-[11px] font-extrabold border p-1 rounded-xl bg-white/5 focus:outline-none text-white disabled:opacity-55 ${isPaid ? 'border-white/10' : 'border-transparent'}`}
                          />
                        </td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Dues Cumulative rekap card logs */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl text-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-white">Akumulasi Rekap Bulanan Admin</h3>
            <p className="text-xs text-slate-400">Total iuran terkumpul per rekap, tersinkron langsung.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={handleLoadAlhidayahTemplate} className="p-2 px-3 border border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400 rounded-xl font-extrabold text-xs bg-emerald-500/5 transition cursor-pointer">
              ✨ Contoh Alhidayah
            </button>
            <button onClick={() => setShowManageKelasModal(true)} className="p-2 px-3 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl font-extrabold text-xs bg-white/5 transition">
              🏫 Kelola Lembaga
            </button>
            <div className="bg-sky-500/10 text-sky-400 px-4 py-2 border border-sky-500/20 rounded-2xl flex flex-col justify-center text-right font-black shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">GRAND TOTAL REKAP:</span>
              <span className="text-lg">{formatMoney(rekapGrandTotal, financeData.settings)}</span>
            </div>
          </div>
        </div>

        {/* rekap controls filter row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-3 border-t border-white/10">
          {/* rekap mode dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400">Jenis Rekap</label>
            <select
              value={rekapMode}
              onChange={e => handleUpdateRekapSetting('mode', e.target.value)}
              className="w-full font-semibold bg-white/5 border border-white/10 p-2.5 rounded-2xl focus:outline-none text-white text-xs"
            >
              <option value="bulanan" className="bg-slate-900 text-white">Bulanan</option>
              <option value="harian" className="bg-slate-900 text-white">Harian</option>
              <option value="custom" className="bg-slate-900 text-white">Rentang Tanggal</option>
            </select>
          </div>

          {/* rekap month selection */}
          {rekapMode === 'bulanan' && (
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-slate-400">Pilih Bulan</label>
              <select
                value={rekapBulanSelection}
                onChange={e => handleUpdateRekapSetting('bulan', e.target.value)}
                className="w-full font-semibold bg-white/5 border border-white/10 p-2.5 rounded-2xl focus:outline-none text-white text-xs"
              >
                <option value="semua" className="bg-slate-900 text-white">Semua Bulan</option>
                {MONTHS.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* rekap specific date select */}
          {rekapMode === 'harian' && (
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-slate-400">Tanggal Harian</label>
              <input 
                type="date"
                value={rekapDateSelection}
                onChange={e => handleUpdateRekapSetting('tanggal', e.target.value)}
                className="w-full font-semibold bg-white/5 border border-white/10 p-2.5 rounded-2xl focus:outline-none text-white text-xs"
              />
            </div>
          )}

          {/* rekap range picker select */}
          {rekapMode === 'custom' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Mulai Tanggal</label>
                <input 
                  type="date"
                  value={rekapStartSelection}
                  onChange={e => handleUpdateRekapSetting('mulai', e.target.value)}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-2.5 rounded-2xl focus:outline-none text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Sampai Tanggal</label>
                <input 
                  type="date"
                  value={rekapEndSelection}
                  onChange={e => handleUpdateRekapSetting('sampai', e.target.value)}
                  className="w-full font-semibold bg-white/5 border border-white/10 p-2.5 rounded-2xl focus:outline-none text-white text-xs"
                />
              </div>
            </>
          )}
        </div>

        {/* rekap tabular log output */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs font-semibold text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 tracking-wider uppercase font-black text-[10px]">
                <th className="pb-2">Rincian Periode</th>
                <th className="pb-2 text-center w-24">Lunas (Siswa)</th>
                <th className="pb-2 text-center w-24">Belum (Siswa)</th>
                <th className="pb-2 text-right w-44">Jumlah Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rekapRows.map((r, i) => (
                <tr key={i} className="text-slate-350">
                  <td className="py-2.5 font-extrabold">{r.label}</td>
                  <td className="py-2.5 text-center font-bold text-emerald-400">{r.lunas}</td>
                  <td className="py-2.5 text-center font-bold text-rose-400">{r.belum}</td>
                  <td className="py-2.5 text-right font-black text-white">{formatMoney(r.total, financeData.settings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share / Backup options Modal UI */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Bagikan &amp; Unduh Laporan</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <button onClick={handleCopyTextWA} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-3 px-4 font-black text-center flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 cursor-pointer">
                💬 WA Laporan
                <span className="text-[10px] text-zinc-100 font-extrabold block">Buka tempel format WA</span>
              </button>
              
              <button 
                onClick={() => {
                  const blob = new Blob([buildShareText()], { type: 'text/plain;charset=utf-8' });
                  downloadBlob(blob, `Daftar-iuran-${activeBulan}.txt`);
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-2xl py-3 px-4 font-black flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 cursor-pointer"
              >
                📄 Unduh Teks TXT
                <span className="text-[10px] text-slate-400 block">Laporan data mentah</span>
              </button>

              <button 
                onClick={handleDownloadExcelImage}
                className="bg-sky-600 hover:bg-sky-700 text-white rounded-2xl py-3 px-4 font-black flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-md shadow-sky-600/10"
              >
                📊 Unduh Foto (Excel)
                <span className="text-[10px] text-sky-100 font-extrabold block">Gambar format Excel</span>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1 max-h-36 overflow-y-auto">
              {buildShareText().slice(0, 1000)}
            </div>

            <button onClick={() => setShowShareModal(false)} className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black">Close</button>
          </div>
        </div>
      )}

      {/* Manage Students Dues addition / updates Modal UI */}
      {showManageStudentsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Tambah / Edit Data Siswa</h3>
              <button onClick={() => setShowManageStudentsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Pilih Siswa (kosongkan untuk tambah baru)</label>
                <select
                  value={selectedStudentId}
                  onChange={e => handleModalStudentSelectedChange(e.target.value)}
                  className="w-full font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl focus:outline-none text-slate-900 dark:text-white text-xs"
                >
                  <option value="">＋ Tambah Siswa Baru / Pilih ...</option>
                  {currentStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.no}. {s.nama}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Nomor Absen / Urut</label>
                  <input 
                    type="text"
                    placeholder="Contoh: 1, 2, dll"
                    value={editStudentNo}
                    onChange={e => setEditStudentNo(e.target.value)}
                    className="w-full font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Nominal Awal Dues (Lunas)</label>
                  <input 
                    type="number"
                    placeholder="0"
                    value={editStudentNominal}
                    onChange={e => setEditStudentNominal(e.target.value)}
                    className="w-full font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Nama Siswa</label>
                <input 
                  type="text"
                  placeholder="Nama Lengkap Siswa..."
                  value={editStudentName}
                  onChange={e => setEditStudentName(e.target.value)}
                  className="w-full font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {selectedStudentId ? (
                  <>
                    <button onClick={handleUpdateStudent} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-black transition">Simpan Edit</button>
                    <button onClick={handleDeleteStudent} className="flex-1 bg-slate-100 text-rose-500 py-3 rounded-xl font-black transition border border-rose-100">Hapus</button>
                  </>
                ) : (
                  <button onClick={handleAddStudent} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black transition">Tambah Baru</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk status confirmation modal UI */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-sm rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-base text-slate-950 dark:text-white">Terapkan Pembayaran Massal</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menandai seluruh siswa yang sedang disaring ({filteredStudents.length} siswa) untuk bulan *{activeBulan}* menjadi *{bulkActionType}*?
            </p>

            <div className="flex gap-2">
              <button onClick={() => setShowBulkActionModal(false)} className="flex-1 bg-slate-100 text-slate-600 p-2.5 rounded-xl font-extrabold text-xs">Batal</button>
              <button onClick={handleBulkApplyStatus} className="flex-1 bg-rose-600 text-white p-2.5 rounded-xl font-extrabold text-xs">Terapkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Instututions management modal UI */}
      {showManageKelasModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-md rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Kelola Lembaga / Yayasan</h3>
              <button onClick={() => setShowManageKelasModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Pilih Lembaga (kosongkan untuk tambah baru)</label>
                <select
                  value={selectedKelasId}
                  onChange={e => handleModalKelasChange(e.target.value)}
                  className="w-full font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl focus:outline-none text-slate-900 dark:text-white text-xs"
                >
                  <option value="">＋ Tambah Lembaga Baru / Pilih ...</option>
                  {(data.kelasList || []).map(k => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Nama Lembaga Utama</label>
                <input 
                  type="text"
                  placeholder="Contoh: Musola, Kelas, Remako..."
                  value={editKelasName}
                  onChange={e => setEditKelasName(e.target.value)}
                  className="w-full font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Deskripsi / Bagian Anak (Pisah dengan baris baru)</label>
                <textarea
                  placeholder="Contoh:&#10;Bagian 1&#10;Bagian 2"
                  rows={3}
                  value={editKelasPilihan}
                  onChange={e => setEditKelasPilihan(e.target.value)}
                  className="w-full font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Catatan Lembaga</label>
                <input 
                  type="text"
                  placeholder="Catatan opsional..."
                  value={editKelasCatatan}
                  onChange={e => setEditKelasCatatan(e.target.value)}
                  className="w-full font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {selectedKelasId ? (
                  <>
                    <button onClick={handleUpdateKelas} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-black transition">Simpan Edit</button>
                    <button onClick={handleDeleteKelas} className="flex-1 bg-slate-100 text-rose-500 py-3 rounded-xl font-black transition border border-rose-100">Hapus</button>
                  </>
                ) : (
                  <button onClick={handleAddKelas} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black transition">Tambah Baru</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 text-slate-100">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
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
                Batal
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }} 
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-3 px-4 transition active:scale-95 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function buildShareText(): string {
    const dataShare = currentBagian;
    const lunas = metrics.lunas;
    const belum = metrics.belum;
    
    let text = "DAFTAR IURAN SISWA\n";
    text += `Lembaga: ${currentKelas?.nama || ''}\n`;
    text += `Bagian: ${dataShare?.nama || ''}\n`;
    text += `Bulan: ${activeMonths.join(' - ')}\n`;
    text += `Dibuat Hari Ini\n\n`;

    if (!filteredStudents.length) {
      text += "Belum ada data pada filter ini.\n\n";
    } else {
      filteredStudents.forEach(s => {
        text += `${s.no}. ${s.nama}\n`;
        activeMonths.forEach(month => {
          const pay = getStudentPayment(s, month);
          text += `  • Bulan ${month} - Status: ${pay.status} ${pay.status === 'Lunas' ? `(Nominal: ${pay.nominal}, Tanggal: ${pay.tanggal})` : ''}\n`;
        });
        text += `\n`;
      });
    }

    text += "REKAP\n";
    text += `Total Siswa : ${filteredStudents.length}\n`;
    text += `Lunas (Bulan-Siswa) : ${lunas}\n`;
    text += `Belum (Bulan-Siswa) : ${belum}`;
    return text;
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function handleDownloadExcelImage() {
    const students = filteredStudents;
    const settings = financeData.settings;

    // Grid columns layout dimensions
    const rowHeaderWidth = 45; // Excel vertical gray headers (1, 2, 3...)
    const colAWidth = 60;      // No. Absen
    const colBWidth = 260;     // Nama Lengkap Siswa
    const colCWidth = 145;     // Status Pembayaran (Lunas/Belum)
    const colDWidth = 160;     // Tanggal Pembayaran

    const contentWidth = colAWidth + colBWidth + colCWidth + colDWidth;
    const totalWidth = rowHeaderWidth + contentWidth;

    const rowHeight = 28;
    const topPadding = 120; // Title ribbon and formula box height
    const excelHeaderHeight = 24; // Alphabet columns letter grid headers (A, B, C, D)
    const bottomTabHeight = 35; // Sheet tab bar mock at bottom

    const dataRowsCount = students.length;
    const infoRowsCount = 4; // Excel header descriptors
    const tableHeaderRowsCount = 1; // "No", "Nama", "Status", "Tanggal"
    const summaryRowsCount = 6; // Space + 1 rekap head + 4 total rekap rows

    const totalGridRows = infoRowsCount + tableHeaderRowsCount + dataRowsCount + summaryRowsCount;
    const gridHeight = totalGridRows * rowHeight;
    const totalHeight = topPadding + excelHeaderHeight + gridHeight + bottomTabHeight;

    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // 1. Draw Excel Corporate Theme Application Title Green Bar
    ctx.fillStyle = '#107c41'; // Corporate Microsoft Excel Green color
    ctx.fillRect(0, 0, totalWidth, 60);

    // Write top header brand title and filename
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('Microsoft Excel - Laporan_Iuran.xlsx', 16, 36);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    ctx.fillText('[ _  ❑  X ]', totalWidth - 85, 33);

    // 2. Draw Spreadsheet Formula Bar & Home Tab Controls Ribbon Bar mock
    ctx.fillStyle = '#f3f2f1';
    ctx.fillRect(0, 60, totalWidth, 32);

    ctx.fillStyle = '#595959';
    ctx.font = 'bold italic 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('fx', 18, 81);

    ctx.strokeStyle = '#dad9d8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, 66);
    ctx.lineTo(35, 86);
    ctx.stroke();

    ctx.fillStyle = '#323130';
    ctx.font = '12px Courier New, Courier, monospace';
    ctx.fillText(`=SUM(D${6 + infoRowsCount + tableHeaderRowsCount}:D${6 + infoRowsCount + tableHeaderRowsCount + dataRowsCount - 1})`, 45, 81);

    // 3. Draw standard Gray columns headers (A, B, C, D) row
    const gridYStart = topPadding;
    ctx.fillStyle = '#f3f2f1';
    ctx.fillRect(0, gridYStart, totalWidth, excelHeaderHeight);

    ctx.strokeStyle = '#dad9d8';
    ctx.lineWidth = 1;
    
    // Line below A, B, C, D row
    ctx.beginPath();
    ctx.moveTo(0, gridYStart + excelHeaderHeight);
    ctx.lineTo(totalWidth, gridYStart + excelHeaderHeight);
    ctx.stroke();

    // Line right of row numbering panel (left margin line)
    ctx.beginPath();
    ctx.moveTo(rowHeaderWidth, gridYStart);
    ctx.lineTo(rowHeaderWidth, totalHeight - bottomTabHeight);
    ctx.stroke();

    // Labels A, B, C, D
    ctx.fillStyle = '#323130';
    ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';

    const colXPositions = [
      rowHeaderWidth + colAWidth / 2,
      rowHeaderWidth + colAWidth + colBWidth / 2,
      rowHeaderWidth + colAWidth + colBWidth + colCWidth / 2,
      rowHeaderWidth + colAWidth + colBWidth + colCWidth + colDWidth / 2
    ];

    ctx.fillText('A', colXPositions[0], gridYStart + 16);
    ctx.fillText('B', colXPositions[1], gridYStart + 16);
    ctx.fillText('C', colXPositions[2], gridYStart + 16);
    ctx.fillText('D', colXPositions[3], gridYStart + 16);

    ctx.textAlign = 'left';

    // Grid Column separators vertically down the sheet
    ctx.beginPath();
    let currentX = rowHeaderWidth;
    [colAWidth, colBWidth, colCWidth, colDWidth].forEach(w => {
      currentX += w;
      ctx.moveTo(currentX, gridYStart);
      ctx.lineTo(currentX, totalHeight - bottomTabHeight);
    });
    ctx.stroke();

    // Helper row draw routine
    let currentY = gridYStart + excelHeaderHeight;

    const drawRowLine = (
      rowIndex: number,
      bg: string | null,
      valTexts: string[],
      bold: boolean,
      txtColors: string[],
      alignmentsList: ('left'|'center'|'right')[]
    ) => {
      // Background custom fill
      if (bg) {
        ctx.fillStyle = bg;
        ctx.fillRect(rowHeaderWidth, currentY, contentWidth, rowHeight);
      }

      // Column numbering grey header left
      ctx.fillStyle = '#f3f2f1';
      ctx.fillRect(0, currentY, rowHeaderWidth, rowHeight);
      ctx.fillStyle = '#595959';
      ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(rowIndex), rowHeaderWidth / 2, currentY + 18);
      ctx.textAlign = 'left';

      // Cell separator horizontal path
      ctx.strokeStyle = '#dad9d8';
      ctx.beginPath();
      ctx.moveTo(0, currentY + rowHeight);
      ctx.lineTo(totalWidth, currentY + rowHeight);
      ctx.stroke();

      // Values writing
      let cellX = rowHeaderWidth;
      const colWidths = [colAWidth, colBWidth, colCWidth, colDWidth];

      valTexts.forEach((valStr, idx) => {
        const align = alignmentsList[idx] || 'left';
        const color = txtColors[idx] || '#000000';
        ctx.fillStyle = color;
        ctx.font = bold ? 'bold 11px system-ui, -apple-system, sans-serif' : 'normal 11px system-ui, -apple-system, sans-serif';

        let textX = cellX + 10;
        if (align === 'center') {
          ctx.textAlign = 'center';
          textX = cellX + colWidths[idx] / 2;
        } else if (align === 'right') {
          ctx.textAlign = 'right';
          textX = cellX + colWidths[idx] - 10;
        }

        ctx.fillText(valStr, textX, currentY + 18);
        ctx.textAlign = 'left'; // restore alignment
        cellX += colWidths[idx];
      });

      currentY += rowHeight;
    };

    // Construct Sheet Information Rows
    drawRowLine(1, '#e2f0d9', ['DATA IURAN LEMBAR REKAPITULASI', '', '', ''], true, ['#107c41'], []);
    drawRowLine(2, null, [`Lembaga: ${currentKelas?.nama || ''}`, `Bagian: ${currentBagian?.nama || ''}`, '', ''], true, ['#323130', '#323130'], []);
    drawRowLine(3, null, [`Bulan Iuran: ${activeMonths.join(' - ')}`, '', '', ''], true, ['#323130'], []);
    drawRowLine(4, null, ['', '', '', ''], false, [], []);

    // Table Headers
    drawRowLine(
      5, 
      '#f3f2f1', 
      ['No Absen', 'Nama Lengkap (Bulan)', 'Status Dues', 'Tanggal Pembayaran'], 
      true, 
      ['#323130', '#323130', '#323130', '#323130'], 
      ['center', 'left', 'center', 'center']
    );

    // Data Students
    let excelRowIndexCur = 6;
    students.forEach((s) => {
      activeMonths.forEach((month) => {
        const pay = getStudentPayment(s, month);
        const isPaid = pay.status === 'Lunas';
        
        const textStatus = isPaid ? '✓ LUNAS' : '✗ BELUM BAYAR';
        const colorStatus = isPaid ? '#107c41' : '#a80000';
        const bgStatus = isPaid ? '#e2f0d9' : '#fce4d6';

        // Status cell highlighted colored capsule
        ctx.fillStyle = bgStatus;
        ctx.fillRect(rowHeaderWidth + colAWidth + colBWidth + 1, currentY + 1, colCWidth - 1, rowHeight - 1);

        drawRowLine(
          excelRowIndexCur,
          null,
          [String(s.no), `${s.nama} (${month})`, textStatus, pay.tanggal ? pay.tanggal : '-'],
          false,
          ['#595959', '#111111', colorStatus, '#323130'],
          ['center', 'left', 'center', 'center']
        );
        excelRowIndexCur++;
      });
    });

    // Space row
    drawRowLine(excelRowIndexCur, null, ['', '', '', ''], false, [], []);
    excelRowIndexCur++;

    // Totals stats section headers
    drawRowLine(
      excelRowIndexCur, 
      '#f3f2f1', 
      ['RINGKASAN TOTAL REKAP:', '', '', ''], 
      true, 
      ['#107c41'], 
      []
    );
    excelRowIndexCur++;

    drawRowLine(
      excelRowIndexCur, 
      null, 
      ['', 'Total Siswa Terdaftar', `${metrics.total} Orang`, ''], 
      true, 
      ['', '#4a4a4a', '#000000'], 
      ['left', 'left', 'right', 'left']
    );
    excelRowIndexCur++;

    drawRowLine(
      excelRowIndexCur, 
      null, 
      ['', 'Telah Lunas', `${metrics.lunas} Orang`, ''], 
      true, 
      ['', '#4a4a4a', '#107c41'], 
      ['left', 'left', 'right', 'left']
    );
    excelRowIndexCur++;

    drawRowLine(
      excelRowIndexCur, 
      null, 
      ['', 'Belum Membayar', `${metrics.belum} Orang`, ''], 
      true, 
      ['', '#4a4a4a', '#a80000'], 
      ['left', 'left', 'right', 'left']
    );
    excelRowIndexCur++;

    drawRowLine(
      excelRowIndexCur, 
      '#e2f0d9', 
      ['', 'Total Iuran Terkumpul', formatMoney(metrics.uang, settings), ''], 
      true, 
      ['', '#107c41', '#107c41'], 
      ['left', 'left', 'right', 'left']
    );
    excelRowIndexCur++;

    // 4. Excel Bottom Sheet Navigation UI Mock
    const tabYStart = totalHeight - bottomTabHeight;
    ctx.fillStyle = '#f3f2f1';
    ctx.fillRect(0, tabYStart, totalWidth, bottomTabHeight);

    // Navigation indicators
    ctx.fillStyle = '#595959';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('◀   ▶   ＋', 12, tabYStart + 20);

    // Highlight active Sheet Tab
    const widthTab = 135;
    const heightTab = bottomTabHeight - 5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(85, tabYStart, widthTab, heightTab);

    ctx.fillStyle = '#107c41'; // Active sheet underline
    ctx.fillRect(85, totalHeight - 5, widthTab, 5);

    ctx.fillStyle = '#323130';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Data Dues Siswa 📊', 85 + widthTab / 2, tabYStart + 18);
    ctx.textAlign = 'left';

    // Parse safe filenames
    const cleanBulan = activeMonths.join('_').replace(/[^a-zA-Z0-9_]/g, '_');
    const cleanKelasName = (currentKelas?.nama || 'Lembaga').replace(/[^a-zA-Z0-9]/g, '_');
    const outFilename = `Laporan_Excel_Iuran_${cleanKelasName}_${cleanBulan}.png`;

    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, outFilename);
        showToast('Foto Laporan format Excel berhasil diunduh!');
      }
    }, 'image/png');
  }
};
