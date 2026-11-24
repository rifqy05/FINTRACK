import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import { NAV_ITEMS } from "./components/navItems.js";
import Header from "./components/Header.jsx";
import Toast from "./components/Toast.jsx";
import { DEMO_ID_PREFIX, buildDemoData } from "./utils/demoData.js";
import { currentMonthKey, formatMonthLabel } from "./utils/dates.js";
import { getBudgetsForMonth } from "./utils/financeCalculations.js";
import {
  createId,
  loadBudgets,
  loadPrivacyMode,
  loadRecurringTemplates,
  loadTheme,
  loadTransactions,
  removeAllStoredData,
  saveBudgets,
  savePrivacyMode,
  saveRecurringTemplates,
  saveTheme,
  saveTransactions,
} from "./utils/storage.js";
import { buildMonthlyRecurringTransactions, countPendingRecurringForMonth } from "./utils/recurring.js";
import { onAuthStateChange, signOut } from "./services/authService.js";
import {
  batchUpsertTransactions,
  createTransaction,
  deleteAllTransactions,
  deleteTransaction as deleteTransactionService,
  fetchTransactions,
  updateTransaction,
} from "./services/transactionService.js";
import {
  batchUpsertBudgets,
  deleteAllBudgets,
  deleteBudget as deleteBudgetService,
  fetchBudgets,
  saveBudget as saveBudgetService,
} from "./services/budgetService.js";
import { getLocalDataToMigrate, migrateLocalDataToSupabase } from "./services/migrationService.js";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Transactions = lazy(() => import("./pages/Transactions.jsx"));
const Budgets = lazy(() => import("./pages/Budgets.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const Assistant = lazy(() => import("./pages/Assistant.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));

const TransactionForm = lazy(() => import("./components/TransactionForm.jsx"));
const AuthModal = lazy(() => import("./components/AuthModal.jsx"));
const MigrationModal = lazy(() => import("./components/MigrationModal.jsx"));
const RecurringModal = lazy(() => import("./components/RecurringModal.jsx"));

const PAGE_META = {
  dashboard: { title: "Dashboard", description: "Ringkasan keuangan Anda dalam satu layar." },
  transactions: { title: "Transaksi", description: "Catat, cari, dan kelola semua pemasukan dan pengeluaran." },
  budgets: { title: "Anggaran", description: "Atur batas pengeluaran per kategori setiap bulan." },
  reports: { title: "Laporan", description: "Lihat ringkasan dan tren per bulan." },
  assistant: {
    title: "Asisten AI",
    description: "Tanya jawab tentang keuangan Anda berdasarkan data akun Anda sendiri.",
  },
  settings: { title: "Pengaturan", description: "Tema, akun cloud, ekspor, backup, dan pengelolaan data." },
};

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat halaman" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-28 animate-pulse bg-surface-2/60 p-5" />
        ))}
      </div>
      <div className="card h-64 animate-pulse bg-surface-2/60 p-5" />
    </div>
  );
}

function pageFromHash() {
  const id = window.location.hash.replace("#/", "");
  return NAV_ITEMS.some((item) => item.id === id) ? id : "dashboard";
}

export default function App() {
  // Satu sumber data: semua halaman membaca transactions dan budgets dari sini.
  const [transactions, setTransactions] = useState(loadTransactions);
  const [budgets, setBudgets] = useState(loadBudgets);
  const [recurringTemplates, setRecurringTemplates] = useState(loadRecurringTemplates);
  const [theme, setTheme] = useState(loadTheme);
  const [privacyMode, setPrivacyMode] = useState(loadPrivacyMode);
  const [page, setPage] = useState(pageFromHash);
  const [period, setPeriod] = useState(() => ({ type: "month", month: currentMonthKey() }));
  const [txFilterPreset, setTxFilterPreset] = useState(null);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);

  // Autentikasi dan sinkronisasi Cloud
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState("local"); // "local" | "offline" | "saving" | "saved" | "error"
  const [syncError, setSyncError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);
  const [localSummary, setLocalSummary] = useState(getLocalDataToMigrate);

  // Periode lengkap untuk Dashboard: "month" mengikuti bulan yang dipilih di stepper header.
  const activePeriod = useMemo(
    () => (period.type === "month" ? { type: "month", month: period.month || currentMonthKey() } : { type: "all" }),
    [period.type, period.month],
  );
  const [form, setForm] = useState({ open: false, transaction: null });
  const [toast, setToast] = useState(null);

  const mainRef = useRef(null);
  const firstRender = useRef(true);
  const localPromptedRef = useRef(false);
  const loadedUserIdRef = useRef(null);

  const notify = useCallback((type, message, action = null) => setToast({ id: Date.now(), type, message, action }), []);
  const dismissToast = useCallback(() => setToast(null), []);
  const markSaved = useCallback(() => setLastSavedAt(new Date().toISOString()), []);
  const refreshLocalSummary = useCallback(() => setLocalSummary(getLocalDataToMigrate()), []);

  // Status yang ditampilkan ke pengguna: offline tidak boleh terlihat seperti "tersimpan di cloud".
  const displaySyncStatus = online ? syncStatus : syncStatus === "saved" ? "offline" : syncStatus;

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Abaikan pembaruan token berkala agar tidak memicu muat ulang data penuh tiap jam.
      if (event === "TOKEN_REFRESHED") return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Hindari fetch ulang saat tab kembali fokus pada pengguna yang sama.
        if (event === "SIGNED_IN" && loadedUserIdRef.current === currentUser.id) return;

        setSyncStatus("saving");
        setSyncError(null);
        const [txRes, bgRes] = await Promise.all([fetchTransactions(currentUser.id), fetchBudgets(currentUser.id)]);

        if (!mounted) return;

        if (txRes.ok && bgRes.ok) {
          loadedUserIdRef.current = currentUser.id;
          setTransactions(txRes.data);
          setBudgets(bgRes.data);
          setSyncStatus("saved");
          markSaved();
          setSyncError(null);

          const local = getLocalDataToMigrate();
          setLocalSummary(local);
          if (local.hasData && !localPromptedRef.current) {
            localPromptedRef.current = true;
            setMigrationModalOpen(true);
          }
        } else {
          const message = txRes.error || bgRes.error || "Gagal memuat data dari cloud.";
          setSyncStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
          setSyncError(message);
          notify("error", message);
        }
      } else {
        loadedUserIdRef.current = null;
        localPromptedRef.current = false;
        setTransactions(loadTransactions());
        setBudgets(loadBudgets());
        refreshLocalSummary();
        setSyncStatus("local");
        setSyncError(null);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [notify, markSaved, refreshLocalSummary]);

  // Pantau status koneksi browser supaya indikator sinkronisasi tetap akurat saat offline.
  useEffect(() => {
    function goOnline() {
      setOnline(true);
      setSyncStatus((current) => (current === "offline" ? "saving" : current));
    }
    function goOffline() {
      setOnline(false);
      setSyncStatus((current) => (current === "saved" || current === "saving" ? "offline" : current));
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const refreshFromCloud = useCallback(
    async (currentUser) => {
      if (!currentUser) return;
      setSyncStatus("saving");
      setSyncError(null);
      const [txRes, bgRes] = await Promise.all([fetchTransactions(currentUser.id), fetchBudgets(currentUser.id)]);
      if (txRes.ok && bgRes.ok) {
        loadedUserIdRef.current = currentUser.id;
        setTransactions(txRes.data);
        setBudgets(bgRes.data);
        setSyncStatus("saved");
        markSaved();
        setSyncError(null);
        notify("success", "Data berhasil disinkronkan ulang dari cloud.");
      } else {
        const message = txRes.error || bgRes.error || "Gagal memuat data dari cloud.";
        setSyncStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
        setSyncError(message);
        notify("error", message);
      }
    },
    [notify, markSaved],
  );

  async function handleRetrySync() {
    if (!user) return;
    await refreshFromCloud(user);
  }

  const wasOffline = useRef(false);
  useEffect(() => {
    if (syncStatus === "offline") {
      wasOffline.current = true;
      return;
    }
    if (online && wasOffline.current && user) {
      wasOffline.current = false;
      refreshFromCloud(user);
    }
  }, [online, user, syncStatus, refreshFromCloud]);

  // Simpan ke localStorage HANYA jika dalam mode lokal (tidak sedang login ke cloud)
  useEffect(() => {
    if (!user) {
      if (!saveTransactions(transactions)) {
        // oxlint-disable-next-line react/set-state-in-effect
        notify("error", "Data gagal disimpan. Penyimpanan browser penuh atau diblokir. Unduh backup sekarang.");
      } else {
        refreshLocalSummary();
      }
    }
  }, [transactions, user, notify, refreshLocalSummary]);

  useEffect(() => {
    if (!user) {
      if (!saveBudgets(budgets)) {
        // oxlint-disable-next-line react/set-state-in-effect
        notify("error", "Anggaran gagal disimpan. Penyimpanan browser penuh atau diblokir.");
      } else {
        refreshLocalSummary();
      }
    }
  }, [budgets, user, notify, refreshLocalSummary]);

  useEffect(() => {
    saveTheme(theme);
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => {
      const isDark = theme === "dark" || (theme === "system" && Boolean(media?.matches));
      document.documentElement.classList.toggle("dark", isDark);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", isDark ? "#09090b" : "#f3f3ef");
    };
    apply();
    if (theme === "system" && media) {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
    return undefined;
  }, [theme]);

  useEffect(() => {
    savePrivacyMode(privacyMode);
    if (privacyMode) document.documentElement.dataset.privacy = "true";
    else delete document.documentElement.dataset.privacy;
  }, [privacyMode]);

  useEffect(() => {
    saveRecurringTemplates(recurringTemplates);
  }, [recurringTemplates]);

  // Navigasi sederhana memakai hash (#/transactions), tanpa React Router.
  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Pintasan keyboard global: "N" tambah transaksi, "H" mode privasi sembunyikan saldo.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || event.target?.isContentEditable) return;
      if (document.querySelector("dialog[open]")) return;
      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        setForm({ open: true, transaction: null });
      } else if (key === "h") {
        event.preventDefault();
        setPrivacyMode((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [page]);

  useEffect(() => {
    document.title = `${PAGE_META[page].title} - FinTrack`;
  }, [page]);

  function navigate(id) {
    window.location.hash = `#/${id}`;
  }

  function openFilteredTransactions(filters) {
    setTxFilterPreset({ filters, nonce: Date.now() });
    navigate("transactions");
  }

  /* ----- Autentikasi & Migrasi ----- */

  async function handleSignOut() {
    const res = await signOut();
    if (res.ok) {
      loadedUserIdRef.current = null;
      localPromptedRef.current = false;
      setUser(null);
      setTransactions(loadTransactions());
      setBudgets(loadBudgets());
      refreshLocalSummary();
      setSyncStatus("local");
      setSyncError(null);
      notify("success", "Anda telah keluar dari akun. FinTrack beralih ke mode lokal.");
    } else {
      notify("error", res.error || "Gagal keluar dari akun.");
    }
  }

  async function handleMigrationConfirm() {
    if (!user) return;
    setSyncStatus("saving");
    const res = await migrateLocalDataToSupabase(user.id);
    if (res.ok) {
      const [txRes, bgRes] = await Promise.all([fetchTransactions(user.id), fetchBudgets(user.id)]);
      if (txRes.ok && bgRes.ok) {
        setTransactions(txRes.data);
        setBudgets(bgRes.data);
      }
      setSyncStatus("saved");
      markSaved();
      setMigrationModalOpen(false);
      notify(
        "success",
        `Migrasi berhasil: ${res.migratedTransactions} transaksi dan ${res.migratedBudgets} anggaran disinkronkan ke cloud.`,
      );
    } else {
      setSyncStatus("error");
      throw new Error(res.error || "Terjadi kesalahan saat memigrasikan data.");
    }
  }

  /* ----- Transaksi ----- */

  function openForm(transaction = null) {
    setForm({ open: true, transaction });
  }

  function closeForm() {
    setForm({ open: false, transaction: null });
  }

  async function submitTransaction(clean, editingId, options = {}) {
    const keepOpen = Boolean(options.keepOpen);
    if (editingId) {
      if (user) {
        setSyncStatus("saving");
        const res = await updateTransaction({ ...clean, id: editingId }, user.id);
        if (res.ok) {
          setTransactions((list) => list.map((t) => (t.id === editingId ? res.data : t)));
          setSyncStatus("saved");
          markSaved();
          notify("success", "Transaksi berhasil diperbarui di cloud.");
        } else {
          setSyncStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
          setSyncError(res.error || "Gagal memperbarui transaksi di cloud.");
          notify("error", res.error || "Gagal memperbarui transaksi di cloud.");
          return false;
        }
      } else {
        setTransactions((list) => list.map((t) => (t.id === editingId ? { ...clean, id: editingId } : t)));
        notify("success", "Transaksi berhasil diperbarui.");
      }
    } else {
      const newId = createId();
      if (user) {
        setSyncStatus("saving");
        const res = await createTransaction({ ...clean, id: newId }, user.id);
        if (res.ok) {
          setTransactions((list) => [res.data, ...list]);
          setSyncStatus("saved");
          markSaved();
          notify("success", "Transaksi berhasil disimpan ke cloud.");
        } else {
          setSyncStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
          setSyncError(res.error || "Gagal menyimpan transaksi ke cloud.");
          notify("error", res.error || "Gagal menyimpan transaksi ke cloud.");
          return false;
        }
      } else {
        setTransactions((list) => [...list, { ...clean, id: newId }]);
        notify("success", "Transaksi berhasil ditambahkan.");
      }
    }

    if (!keepOpen) closeForm();
    return true;
  }

  async function restoreTransaction(tx) {
    if (!tx) return;
    if (user) {
      setSyncStatus("saving");
      const res = await createTransaction(tx, user.id);
      if (res.ok) {
        setTransactions((list) => [res.data, ...list]);
        setSyncStatus("saved");
        markSaved();
        notify("success", "Transaksi dikembalikan ke cloud.");
      } else {
        setSyncStatus("error");
        setSyncError(res.error || "Gagal mengembalikan transaksi ke cloud.");
        notify("error", res.error || "Gagal mengembalikan transaksi ke cloud.");
      }
    } else {
      setTransactions((list) => [...list, tx]);
      notify("success", "Transaksi dikembalikan.");
    }
  }

  async function deleteTransaction(id) {
    const removed = transactions.find((t) => t.id === id) ?? null;
    if (user) {
      setSyncStatus("saving");
      const res = await deleteTransactionService(id, user.id);
      if (res.ok) {
        setTransactions((list) => list.filter((t) => t.id !== id));
        setSyncStatus("saved");
        markSaved();
        notify(
          "success",
          "Transaksi dihapus dari cloud.",
          removed ? { label: "Urungkan", onClick: () => restoreTransaction(removed) } : null,
        );
      } else {
        setSyncStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
        setSyncError(res.error || "Gagal menghapus transaksi dari cloud.");
        notify("error", res.error || "Gagal menghapus transaksi dari cloud.");
      }
    } else {
      setTransactions((list) => list.filter((t) => t.id !== id));
      notify(
        "success",
        "Transaksi dihapus.",
        removed ? { label: "Urungkan", onClick: () => restoreTransaction(removed) } : null,
      );
    }
  }

  /* ----- Template Transaksi Rutin ----- */

  function addRecurringTemplate(clean) {
    setRecurringTemplates((list) => [...list, { ...clean, id: createId() }]);
    notify("success", "Template transaksi rutin disimpan.");
  }

  function deleteRecurringTemplate(id) {
    setRecurringTemplates((list) => list.filter((item) => item.id !== id));
    notify("success", "Template rutin dihapus.");
  }

  async function applyRecurringForMonth(monthKey) {
    const generated = buildMonthlyRecurringTransactions(recurringTemplates, monthKey, transactions, createId);
    if (generated.length === 0) {
      notify("success", `Semua transaksi rutin untuk ${formatMonthLabel(monthKey)} sudah tercatat.`);
      return;
    }

    if (user) {
      setSyncStatus("saving");
      const res = await batchUpsertTransactions(generated, user.id);
      if (res.ok) {
        const refreshed = await fetchTransactions(user.id);
        if (refreshed.ok) setTransactions(refreshed.data);
        setSyncStatus("saved");
        markSaved();
        notify("success", `${generated.length} transaksi rutin dicatat ke cloud.`);
      } else {
        setSyncStatus("error");
        setSyncError(res.error || "Gagal mencatat transaksi rutin ke cloud.");
        notify("error", res.error || "Gagal mencatat transaksi rutin ke cloud.");
      }
      return;
    }

    setTransactions((list) => [...list, ...generated]);
    notify("success", `${generated.length} transaksi rutin dicatat untuk ${formatMonthLabel(monthKey)}.`);
  }

  /* ----- Anggaran ----- */

  async function saveBudget(budget, isUpdate) {
    if (user) {
      setSyncStatus("saving");
      const res = await saveBudgetService(budget, user.id);
      if (res.ok) {
        setBudgets((list) => {
          const others = list.filter((b) => !(b.month === budget.month && b.category === budget.category));
          return [...others, res.data];
        });
        setSyncStatus("saved");
        markSaved();
        notify("success", isUpdate ? "Anggaran diperbarui di cloud." : "Anggaran disimpan di cloud.");
        return true;
      }
      setSyncStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
      setSyncError(res.error || "Gagal menyimpan anggaran ke cloud.");
      notify("error", res.error || "Gagal menyimpan anggaran ke cloud.");
      return false;
    }

    setBudgets((list) => {
      const others = list.filter((b) => !(b.month === budget.month && b.category === budget.category));
      return [...others, budget];
    });
    notify("success", isUpdate ? "Anggaran diperbarui." : "Anggaran disimpan.");
    return true;
  }

  async function copyBudgetsFromMonth(fromMonth, toMonth) {
    const source = getBudgetsForMonth(budgets, fromMonth);
    if (source.length === 0) return false;
    const copied = source.map((b) => ({ month: toMonth, category: b.category, limit: b.limit }));

    if (user) {
      setSyncStatus("saving");
      const res = await batchUpsertBudgets(copied, user.id);
      if (res.ok) {
        const refreshed = await fetchBudgets(user.id);
        if (refreshed.ok) setBudgets(refreshed.data);
        setSyncStatus("saved");
        markSaved();
        notify("success", `${copied.length} anggaran disalin ke ${formatMonthLabel(toMonth)}.`);
        return true;
      }
      setSyncStatus("error");
      setSyncError(res.error || "Gagal menyalin anggaran ke cloud.");
      notify("error", res.error || "Gagal menyalin anggaran ke cloud.");
      return false;
    }

    setBudgets((list) => {
      const others = list.filter((b) => b.month !== toMonth);
      return [...others, ...copied];
    });
    notify("success", `${copied.length} anggaran disalin ke ${formatMonthLabel(toMonth)}.`);
    return true;
  }

  async function deleteBudget(budget) {
    if (user) {
      setSyncStatus("saving");
      const res = await deleteBudgetService(budget, user.id);
      if (res.ok) {
        setBudgets((list) => list.filter((b) => !(b.month === budget.month && b.category === budget.category)));
        setSyncStatus("saved");
        markSaved();
        notify("success", "Anggaran dihapus dari cloud.");
      } else {
        setSyncStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
        setSyncError(res.error || "Gagal menghapus anggaran dari cloud.");
        notify("error", res.error || "Gagal menghapus anggaran dari cloud.");
      }
    } else {
      setBudgets((list) => list.filter((b) => !(b.month === budget.month && b.category === budget.category)));
      notify("success", "Anggaran dihapus.");
    }
  }

  /* ----- Data ----- */

  async function importData(data) {
    if (user) {
      setSyncStatus("saving");
      const [txRes, bgRes] = await Promise.all([
        batchUpsertTransactions(data.transactions, user.id),
        batchUpsertBudgets(data.budgets, user.id),
      ]);
      if (txRes.ok && bgRes.ok) {
        const [refetchTx, refetchBg] = await Promise.all([fetchTransactions(user.id), fetchBudgets(user.id)]);
        if (refetchTx.ok && refetchBg.ok) {
          setTransactions(refetchTx.data);
          setBudgets(refetchBg.data);
        }
        setSyncStatus("saved");
        markSaved();
        notify(
          "success",
          `Import berhasil disinkronkan ke cloud: ${data.transactions.length} transaksi dan ${data.budgets.length} anggaran.`,
        );
      } else {
        setSyncStatus("error");
        notify("error", txRes.error || bgRes.error || "Gagal mengimpor ke cloud.");
      }
    } else {
      setTransactions(data.transactions);
      setBudgets(data.budgets);
      notify("success", `Import berhasil: ${data.transactions.length} transaksi dan ${data.budgets.length} anggaran.`);
    }
  }

  async function clearAll() {
    if (user) {
      setSyncStatus("saving");
      const [txRes, bgRes] = await Promise.all([deleteAllTransactions(user.id), deleteAllBudgets(user.id)]);
      if (txRes.ok && bgRes.ok) {
        setTransactions([]);
        setBudgets([]);
        setSyncStatus("saved");
        markSaved();
        notify("success", "Seluruh transaksi dan anggaran di akun cloud telah dihapus.");
      } else {
        const message = txRes.error || bgRes.error || "Gagal menghapus data dari cloud.";
        setSyncStatus("error");
        setSyncError(message);
        notify("error", message);
      }
      return;
    }

    removeAllStoredData();
    setTransactions([]);
    setBudgets([]);
    refreshLocalSummary();
    notify("success", "Seluruh data lokal telah dihapus.");
  }

  async function loadDemo() {
    const demo = buildDemoData();
    if (user) {
      setSyncStatus("saving");
      const [txRes, bgRes] = await Promise.all([
        batchUpsertTransactions(demo.transactions, user.id),
        batchUpsertBudgets(demo.budgets, user.id),
      ]);
      if (txRes.ok && bgRes.ok) {
        const [refetchTx, refetchBg] = await Promise.all([fetchTransactions(user.id), fetchBudgets(user.id)]);
        if (refetchTx.ok && refetchBg.ok) {
          setTransactions(refetchTx.data);
          setBudgets(refetchBg.data);
        }
        setSyncStatus("saved");
        markSaved();
        notify("success", "Data contoh ditambahkan ke akun cloud Anda.");
      } else {
        setSyncStatus("error");
        notify("error", txRes.error || bgRes.error || "Gagal memuat data contoh ke cloud.");
      }
    } else {
      setTransactions(demo.transactions);
      setBudgets(demo.budgets);
      notify("success", "Data contoh dimuat. Hapus kapan saja lewat Pengaturan.");
    }
  }

  const meta = PAGE_META[page];
  const isDemoActive = useMemo(
    () => transactions.some((t) => String(t.id).startsWith(DEMO_ID_PREFIX)),
    [transactions],
  );
  const pendingRecurringCount = useMemo(
    () => countPendingRecurringForMonth(recurringTemplates, currentMonthKey(), transactions),
    [recurringTemplates, transactions],
  );
  const isEmptyDataScreen =
    transactions.length === 0 && (page === "dashboard" || page === "transactions" || page === "reports");
  const showHeaderAdd = !isEmptyDataScreen && page !== "settings" && page !== "assistant";
  const showMobileFab = !form.open && !authModalOpen && !migrationModalOpen && !recurringModalOpen && showHeaderAdd;

  return (
    <div className="min-h-dvh lg:pl-60 xl:pl-64">
      <a
        href="#konten"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-ink"
      >
        Lewati ke konten
      </a>

      <Sidebar
        current={page}
        onNavigate={navigate}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      <main
        id="konten"
        ref={mainRef}
        tabIndex={-1}
        className="flex w-full max-w-[1600px] flex-col gap-5 px-4 pt-4 pb-32 outline-none sm:px-6 lg:gap-6 lg:px-8 lg:pt-0 lg:pb-12 xl:px-10"
      >
        <div className="flex w-full flex-col gap-5 lg:gap-6">
          <Header
            title={meta.title}
            description={meta.description}
            period={period}
            onPeriodChange={setPeriod}
            showPeriod={page === "dashboard" && transactions.length > 0}
            showAdd={showHeaderAdd}
            onAdd={openForm}
            privacyMode={privacyMode}
            onTogglePrivacy={() => setPrivacyMode((prev) => !prev)}
            syncStatus={displaySyncStatus}
            syncError={syncError}
            lastSavedAt={lastSavedAt}
            onRetrySync={handleRetrySync}
            isDemoActive={isDemoActive}
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSignOut={handleSignOut}
            currentPage={page}
            onNavigate={navigate}
            announceSync={page !== "settings"}
          />

          <div key={page} className="rise-in">
            <Suspense fallback={<PageSkeleton />}>
              {page === "dashboard" && (
                <Dashboard
                  transactions={transactions}
                  budgets={budgets}
                  period={activePeriod}
                  onNavigate={navigate}
                  onDrillDown={openFilteredTransactions}
                  onAdd={openForm}
                  onQuickSubmit={submitTransaction}
                  onEdit={openForm}
                  onDelete={deleteTransaction}
                  onLoadDemo={loadDemo}
                  pendingRecurringCount={pendingRecurringCount}
                  onOpenRecurring={() => setRecurringModalOpen(true)}
                />
              )}
              {page === "transactions" && (
                <Transactions
                  transactions={transactions}
                  user={user}
                  initialFilterPreset={txFilterPreset}
                  pendingRecurringCount={pendingRecurringCount}
                  onOpenRecurring={() => setRecurringModalOpen(true)}
                  onAdd={openForm}
                  onEdit={openForm}
                  onDelete={deleteTransaction}
                  onNotify={notify}
                />
              )}
              {page === "budgets" && (
                <Budgets
                  transactions={transactions}
                  budgets={budgets}
                  onSave={saveBudget}
                  onDelete={deleteBudget}
                  onCopyMonth={copyBudgetsFromMonth}
                  onDrillDown={openFilteredTransactions}
                />
              )}
              {page === "reports" && (
                <Reports
                  transactions={transactions}
                  onNotify={notify}
                  onAdd={openForm}
                  onLoadDemo={loadDemo}
                  onDrillDown={openFilteredTransactions}
                />
              )}
              {page === "assistant" && <Assistant user={user} onOpenAuth={() => setAuthModalOpen(true)} />}
              {page === "settings" && (
                <Settings
                  theme={theme}
                  onThemeChange={setTheme}
                  transactions={transactions}
                  budgets={budgets}
                  onImport={importData}
                  onClearAll={clearAll}
                  onLoadDemo={loadDemo}
                  onNotify={notify}
                  user={user}
                  onOpenAuth={() => setAuthModalOpen(true)}
                  onSignOut={handleSignOut}
                  syncStatus={displaySyncStatus}
                  syncError={syncError}
                  lastSavedAt={lastSavedAt}
                  onRetrySync={handleRetrySync}
                  onStartMigration={() => setMigrationModalOpen(true)}
                  isDemoActive={isDemoActive}
                  hasLocalData={localSummary.hasData}
                  localCounts={{
                    transactions: localSummary.transactionCount,
                    budgets: localSummary.budgetCount,
                  }}
                />
              )}
            </Suspense>
          </div>
        </div>
      </main>

      {/* Tombol cepat di zona ibu jari untuk pengguna ponsel saat menggulir daftar */}
      {showMobileFab ? (
        <button
          type="button"
          onClick={() => openForm()}
          aria-label="Tambah transaksi"
          className="fixed right-4 bottom-20 z-30 inline-flex size-12 items-center justify-center rounded-full bg-brand text-brand-ink shadow-md ring-1 ring-line-strong transition-transform duration-150 hover:bg-brand/90 active:scale-95 lg:hidden"
        >
          <Plus size={22} strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : null}

      <Suspense fallback={null}>
        {form.open ? (
          <TransactionForm transaction={form.transaction} onSubmit={submitTransaction} onCancel={closeForm} />
        ) : null}

        {authModalOpen ? (
          <AuthModal
            onClose={() => setAuthModalOpen(false)}
            onSuccess={(_u, msg) => {
              notify("success", msg);
            }}
          />
        ) : null}

        {migrationModalOpen ? (
          <MigrationModal
            transactionCount={localSummary.transactionCount}
            budgetCount={localSummary.budgetCount}
            transactions={localSummary.transactions}
            budgets={localSummary.budgets}
            onConfirm={handleMigrationConfirm}
            onClose={() => setMigrationModalOpen(false)}
          />
        ) : null}

        {recurringModalOpen ? (
          <RecurringModal
            templates={recurringTemplates}
            transactions={transactions}
            onAddTemplate={addRecurringTemplate}
            onDeleteTemplate={deleteRecurringTemplate}
            onApplyMonth={applyRecurringForMonth}
            onClose={() => setRecurringModalOpen(false)}
          />
        ) : null}
      </Suspense>

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
