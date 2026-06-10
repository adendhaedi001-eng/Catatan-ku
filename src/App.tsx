import { useState, useEffect, useTransition } from 'react';
import { 
  googleSignIn, 
  logout, 
  initAuth,
  OperationType,
  handleFirestoreError
} from './firebase';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  listBackupFiles, 
  uploadBackupFile, 
  downloadBackupFile, 
  GoogleDriveFile 
} from './googleDrive';
import { 
  FinanceData, 
  IuranData 
} from './types';
import { 
  getDefaultFinanceData, 
  getDefaultIuranData, 
  syncData, 
  sha256 
} from './utils';
import { CatatanKeuangan } from './components/CatatanKeuangan';
import { IuranSiswa } from './components/IuranSiswa';
import { 
  User, 
  LogOut, 
  ShieldAlert, 
  Lock, 
  Check, 
  BookOpen, 
  TrendingUp, 
  RefreshCw,
  X
} from 'lucide-react';

export default function App() {
  const [isPending, startTransition] = useTransition();
  // Active Tab/Subsystem
  const [activeSystem, setActiveSystem] = useState<'finance' | 'iuran'>('finance');

  // Master States
  const [finance, setFinance] = useState<FinanceData>(() => {
    const raw = localStorage.getItem('catatan_keuangan_v1');
    return raw ? JSON.parse(raw) : getDefaultFinanceData();
  });

  const [iuran, setIuran] = useState<IuranData>(() => {
    const raw = localStorage.getItem('iuran_siswa_v1');
    return raw ? JSON.parse(raw) : getDefaultIuranData();
  });

  // Auth States
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // App Lock (PIN) States
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Google Drive Lists
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);

  // Security configuration states
  const [securityPinRegister, setSecurityPinRegister] = useState<string>('');
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);

  // Sync Master State Save Helper
  const handleDataChange = (nextFd: FinanceData, nextId: IuranData) => {
    // Perform automated bidirectional sync passing the previous state values
    const { fd, id } = syncData(nextFd, nextId, finance, iuran);

    // Save states
    setFinance(fd);
    setIuran(id);

    // Write to local storage
    localStorage.setItem('catatan_keuangan_v1', JSON.stringify(fd));
    localStorage.setItem('iuran_siswa_v1', JSON.stringify(id));

    // Save to Firestore if user is logged in
    if (googleUser) {
      const userRef = doc(db, 'users', googleUser.uid);
      setDoc(userRef, {
        finance: fd,
        iuran: id,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `users/${googleUser.uid}`);
      });
    }
  };

  // Check login on mounts
  useEffect(() => {
    let unsubDoc: (() => void) | null = null;
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        
        // Fetch from Firestore in real-time
        const userRef = doc(db, 'users', user.uid);
        
        if (unsubDoc) {
          unsubDoc();
        }

        unsubDoc = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const dataFirestore = snap.data();
            if (dataFirestore.finance && dataFirestore.iuran) {
              setFinance(dataFirestore.finance);
              setIuran(dataFirestore.iuran);
              localStorage.setItem('catatan_keuangan_v1', JSON.stringify(dataFirestore.finance));
              localStorage.setItem('iuran_siswa_v1', JSON.stringify(dataFirestore.iuran));
            }
          } else {
            // Write defaults to firestore
            setDoc(userRef, {
              finance,
              iuran,
              updatedAt: new Date().toISOString()
            }).catch(e => {
              handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
            });
          }
        }, (err) => {
          console.error('Realtime error fetching user data from Firestore:', err);
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        });

        // Load files list from drive
        if (token) {
          listBackupFiles(token).then(files => {
            setDriveFiles(files);
          }).catch(e => {
            console.error(e);
            if (e && e.status === 401) {
              setGoogleToken(null);
              localStorage.removeItem('google_access_token_v1');
            }
          });
        } else {
          setDriveFiles([]);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        if (unsubDoc) {
          unsubDoc();
          unsubDoc = null;
        }
      }
    );
    return () => {
      unsub();
      if (unsubDoc) {
        unsubDoc();
      }
    };
  }, [googleUser?.uid]);

  // Lock code initializations
  useEffect(() => {
    if (finance.settings.appPinHash) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, [finance.settings.appPinHash]);

  // PIN Keypad Handlers
  const handlePinSubmit = async (p: string) => {
    const hashed = await sha256(p);
    if (hashed === finance.settings.appPinHash) {
      setIsLocked(false);
      setPinInput('');
      setPinError(null);
    } else {
      setPinError('PIN yang dimasukkan salah!');
      setPinInput('');
    }
  };

  const handleKeypadPress = (val: string) => {
    setPinError(null);
    if (val === 'delete') {
      setPinInput(prev => prev.slice(0, -1));
    } else if (val === 'clear') {
      setPinInput('');
    } else {
      const next = pinInput + val;
      if (next.length <= 6) {
        setPinInput(next);
        if (next.length === 6 || (finance.settings.appPinHash && next.length === 4 && finance.settings.appPinHash.length === 4)) {
          // auto trigger check
        }
      }
    }
  };

  const handlePinUnlockClick = () => {
    handlePinSubmit(pinInput);
  };

  const handleSetupPin = async () => {
    if (!securityPinRegister.trim()) {
      // Clear security pin
      const nextF = {
        ...finance,
        settings: {
          ...finance.settings,
          appPinHash: ''
        }
      };
      handleDataChange(nextF, iuran);
      setShowSecurityModal(false);
      alert('Sandi/PIN Keamanan berhasil dinonaktifkan.');
      return;
    }

    if (securityPinRegister.length < 4 || securityPinRegister.length > 6) {
      return alert('PIN harus berukuran 4 sampai 6 digit angka!');
    }

    const hashed = await sha256(securityPinRegister);
    const nextF = {
      ...finance,
      settings: {
        ...finance.settings,
        appPinHash: hashed
      }
    };

    handleDataChange(nextF, iuran);
    setSecurityPinRegister('');
    setShowSecurityModal(false);
    alert('Sandi/PIN Keamanan berhasil diaktifkan.');
  };

  // Google Sign In Trigger
  const handleGoogleSignIn = async (): Promise<string | null> => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        alert(`Berhasil masuk sebagai ${res.user.displayName}`);
        return res.accessToken;
      }
    } catch (err: any) {
      alert(`Gagal masuk: ${err.message || err}`);
    }
    return null;
  };

  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setDriveFiles([]);
    } catch (e: any) {
      console.error('Gagal keluar:', e);
    }
  };

  const handleDeleteAccountData = async () => {
    if (!googleUser) {
      alert('Silakan login dengan akun Google terlebih dahulu.');
      return;
    }

    const confirmWipe = window.confirm(
      '⚠️ PERINGATAN KERAS! ⚠️\n\nTindakan ini akan menghapus semua records keuangan & iuran Anda yang tersimpan di cloud database Firestore secara permanen.\n\nApakah Anda benar-benar yakin ingin menghapus data akun ini dari cloud?'
    );
    if (!confirmWipe) return;

    try {
      const userRef = doc(db, 'users', googleUser.uid);
      
      // Wipe remote firestore record with empty defaults
      await setDoc(userRef, {
        finance: getDefaultFinanceData(),
        iuran: getDefaultIuranData(),
        updatedAt: new Date().toISOString()
      }, { merge: false });

      // Clean local cache storage
      localStorage.removeItem('catatan_keuangan_v1');
      localStorage.removeItem('iuran_siswa_v1');

      setFinance(getDefaultFinanceData());
      setIuran(getDefaultIuranData());

      // Logout and clear tokens
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setDriveFiles([]);

      alert('Seluruh data Anda di cloud Firestore & lokal berhasil dihapus bersih. Sesi akun Google Anda dinonaktifkan.');
    } catch (err: any) {
      console.error('Failure wiping Firestore records:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${googleUser?.uid}`);
    }
  };

  // Google Drive Manual Backup
  const handleBackupToDrive = async () => {
    let currentToken = googleToken;
    if (!currentToken) {
      currentToken = await handleGoogleSignIn();
      if (!currentToken) return;
    }
    const filename = `backup-multi-finance-full.json`;
    const payload = JSON.stringify({
      app: 'Keuangan Multi-Lembaga',
      finance,
      iuran,
      version: finance.version,
      exportedAt: new Date().toISOString()
    });

    try {
      await uploadBackupFile(currentToken, filename, payload);
      const files = await listBackupFiles(currentToken);
      setDriveFiles(files);
    } catch (err: any) {
      if (err && err.status === 401) {
        setGoogleToken(null);
        localStorage.removeItem('google_access_token_v1');
        alert('Sesi Google Drive kedaluwarsa. Silakan masuk kembali.');
        currentToken = await handleGoogleSignIn();
        if (currentToken) {
          await uploadBackupFile(currentToken, filename, payload);
          const files = await listBackupFiles(currentToken);
          setDriveFiles(files);
          return;
        }
      }
      throw err;
    }
  };

  const handleRestoreFromDrive = async (fileId: string) => {
    let currentToken = googleToken;
    if (!currentToken) {
      currentToken = await handleGoogleSignIn();
      if (!currentToken) return;
    }
    
    try {
      const content = await downloadBackupFile(currentToken, fileId);
      const parsed = JSON.parse(content);
      if (!parsed.finance || !parsed.iuran) {
        throw new Error('Format database cadangan di Drive tidak valid.');
      }

      handleDataChange(parsed.finance, parsed.iuran);
    } catch (err: any) {
      if (err && err.status === 401) {
        setGoogleToken(null);
        localStorage.removeItem('google_access_token_v1');
        alert('Sesi Google Drive kedaluwarsa. Silakan masuk kembali.');
        currentToken = await handleGoogleSignIn();
        if (currentToken) {
          const content = await downloadBackupFile(currentToken, fileId);
          const parsed = JSON.parse(content);
          if (!parsed.finance || !parsed.iuran) {
            throw new Error('Format database cadangan di Drive tidak valid.');
          }
          handleDataChange(parsed.finance, parsed.iuran);
          return;
        }
      }
      throw err;
    }
  };

  const handleRefreshDriveFiles = async () => {
    let currentToken = googleToken;
    if (!currentToken) {
      currentToken = await handleGoogleSignIn();
      if (!currentToken) return;
    }
    try {
      const files = await listBackupFiles(currentToken);
      setDriveFiles(files);
    } catch (err: any) {
      if (err && err.status === 401) {
        setGoogleToken(null);
        localStorage.removeItem('google_access_token_v1');
        currentToken = await handleGoogleSignIn();
        if (currentToken) {
          const files = await listBackupFiles(currentToken);
          setDriveFiles(files);
        }
      }
    }
  };

  // Forgets PIN - Forced Logout
  const handleResetPinForced = () => {
    if (window.confirm('Lupa PIN? Untuk reset, seluruh sesi akun Google akan dikeluarkan. Lanjutkan?')) {
      logout().then(() => {
        setGoogleUser(null);
        setGoogleToken(null);
        setPinInput('');
        setPinError(null);
        
        // Switch off PIN flag in local to let owner re-enter
        const nextF = {
          ...finance,
          settings: {
            ...finance.settings,
            appPinHash: ''
          }
        };
        setFinance(nextF);
        localStorage.setItem('catatan_keuangan_v1', JSON.stringify(nextF));
        setIsLocked(false);
      });
    }
  };

  // Lock screen Overlay
  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 select-none font-sans relative overflow-hidden">
        {/* Background Mesh Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="w-full max-w-sm text-center space-y-6 z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center mx-auto text-white shadow-lg shadow-blue-500/20">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-extrabold text-xl tracking-tight text-white">Kunci Keamanan Aktif</h2>
            <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">Masukkan 4-6 digit Kode PIN Anda untuk mengunci dan membuka catatan keuangan.</p>
          </div>

          {/* Dots output */}
          <div className="flex justify-center gap-3 py-4">
            {Array.from({ length: Math.max(pinInput.length, 4) }).map((_, i) => {
              const active = i < pinInput.length;
              return (
                <div 
                  key={i} 
                  className={`w-3.5 h-3.5 rounded-full border transition duration-150 ${active ? 'bg-gradient-to-r from-blue-400 to-emerald-400 border-transparent scale-110 shadow-md shadow-blue-500/40' : 'bg-transparent border-white/20'}`}
                ></div>
              );
            })}
          </div>

          {pinError && (
            <p className="text-xs font-semibold text-rose-400 animate-bounce">{pinError}</p>
          )}

          {/* Keypad selector */}
          <div className="grid grid-cols-3 gap-4 max-w-[260px] mx-auto pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button 
                key={num}
                onClick={() => handleKeypadPress(num)}
                className="w-16 h-16 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-lg font-black text-slate-100 transition active:scale-95 flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <button 
              onClick={() => handleKeypadPress('clear')}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 uppercase transition flex items-center justify-center"
            >
              Ulang
            </button>
            <button 
              onClick={() => handleKeypadPress('0')}
              className="w-16 h-16 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-lg font-black text-slate-100 transition active:scale-95 flex items-center justify-center"
            >
              0
            </button>
            <button 
              onClick={() => handleKeypadPress('delete')}
              className="text-xs font-bold text-slate-400 hover:text-rose-400 uppercase transition flex items-center justify-center"
            >
              Hapus
            </button>
          </div>

          <div className="flex gap-4 pt-4 justify-center">
            <button 
              onClick={handlePinUnlockClick}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-500 hover:opacity-95 text-white font-extrabold rounded-full text-xs transition shadow-lg shadow-blue-600/25"
            >
              Buka Kunci PIN
            </button>
            <button 
              onClick={handleResetPinForced}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 underline mt-2.5 block"
            >
              Lupa PIN?
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative overflow-x-hidden pb-12">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-600/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Upper Navigation system bar */}
      <header className="border-b border-white/10 backdrop-blur-md bg-white/5 sticky top-0 z-30 shadow-lg relative shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/20">
              4U
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight leading-none">Keuangan 4U</h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Multi-Lembaga &amp; Iuran Siswa</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* System toggle links */}
            <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => startTransition(() => setActiveSystem('finance'))}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-black capitalize transition flex items-center gap-1.5 ${activeSystem === 'finance' ? 'bg-white/10 text-blue-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Kas Ledger
              </button>
              <button
                onClick={() => startTransition(() => setActiveSystem('iuran'))}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-black capitalize transition flex items-center gap-1.5 ${activeSystem === 'iuran' ? 'bg-white/10 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Dues Siswa
              </button>
            </div>

            {/* General PIN shield */}
            <button 
              onClick={() => setShowSecurityModal(true)}
              className="p-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition"
              title="Sandi Pengunci PIN"
            >
              <ShieldAlert className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Stage wrapper */}
      <main className="max-w-5xl mx-auto px-4 py-6 relative z-10">
        {isPending ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <>
            {activeSystem === 'finance' ? (
              <CatatanKeuangan 
                data={finance}
                onDataChange={next => handleDataChange(next, iuran)}
                googleUser={googleUser}
                googleToken={googleToken}
                onGoogleSignIn={handleGoogleSignIn}
                onGoogleSignOut={handleGoogleSignOut}
                onBackupToDrive={handleBackupToDrive}
                onRestoreFromDrive={handleRestoreFromDrive}
                driveFiles={driveFiles}
                onRefreshDriveFiles={handleRefreshDriveFiles}
                onDeleteAccountData={handleDeleteAccountData}
              />
            ) : (
              <IuranSiswa 
                data={iuran}
                onDataChange={next => handleDataChange(finance, next)}
                financeData={finance}
                onFinanceDataChange={next => handleDataChange(next, iuran)}
              />
            )}
          </>
        )}
      </main>

      {/* Security Pin Setup Modal UI */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white">Atur Sandi Pengunci PIN</h3>
              <button onClick={() => setShowSecurityModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Aktifkan PIN Pengunci (4-6 digit angka) untuk mengunci seluruh isi aplikasi ini saat pertama kali dibuka. Kosongkan masukan / klik simpan untuk menonaktifkan.
            </p>

            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-[10px] text-slate-400">Masukkan PIN Baru (Angka)</label>
              <input 
                type="password"
                placeholder="4-6 digit angka, atau kosongkan..."
                maxLength={6}
                value={securityPinRegister}
                onChange={e => setSecurityPinRegister(e.target.value.replace(/\D/g, ''))}
                className="w-full font-semibold bg-white/5 border border-white/10 p-3 rounded-2xl focus:outline-none text-white focus:border-blue-500/50"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button onClick={() => setShowSecurityModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 p-3 rounded-xl font-extrabold text-xs border border-white/5">Batal</button>
              <button onClick={handleSetupPin} className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-500 text-white p-3 rounded-xl font-extrabold text-xs shadow-lg shadow-blue-500/20 transition-all">Simpan PIN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
