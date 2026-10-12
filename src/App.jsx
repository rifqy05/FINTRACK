import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import { NAV_ITEMS } from "./components/navItems.js";
import Header from "./components/Header.jsx";
import Toast from "./components/Toast.jsx";
import TransactionForm from "./components/TransactionForm.jsx";
import AuthModal from "./components/AuthModal.jsx";
import MigrationModal from "./components/MigrationModal.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Budgets from "./pages/Budgets.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import { buildDemoData } from "./utils/demoData.js";
import { currentMonthKey } from "./utils/dates.js";
import {
  createId,
  loadBudgets,
  loadTheme,
  loadTransactions,
  removeAllStoredData,
  saveBudgets,
  saveTheme,
  saveTransactions,
} from "./utils/storage.js";
import { onAuthStateChange, signOut } from "./services/authService.js";
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction as deleteTransactionService,
  batchUpsertTransactions,
} from "./services/transactionService.js";
import {
  fetchBudgets,
  saveBudget as saveBudgetService,
  deleteBudget as deleteBudgetService,
  batchUpsertBudgets,
} from "./services/budgetService.js";
import {
  getLocalDataToMigrate,
  migrateLocalDataToSupabase,
} from "./services/migrationService.js";

const PAGE_META = {
  dashboard: { title: "Dashboard", description: "Ringkasan keuangan Anda dalam satu layar." },
  transactions: { title: "Transaksi", description: "Catat, cari, dan kelola semua pemasukan dan pengeluaran." },
  budgets: { title: "Anggaran", description: "Atur batas pengeluaran per kategori setiap bulan." },
  reports: { title: "Laporan", description: "Lihat ringkasan dan tren per bulan." },
  settings: { title: "Pengaturan", description: "Tema, akun cloud, ekspor, backup, dan pengelolaan data." },
};

function pageFromHash() {
  const id = window.location.hash.replace("#/", "");
  return NAV_ITEMS.some((item) => item.id === id) ? id : "dashboard";
}

export default function App() {
  // Satu sumber data: semua halaman membaca transactions dan budgets dari sini.
  const [transactions, setTransactions] = useState(loadTransactions);
  const [budgets, setBudgets] = useState(loadBudgets);
  const [theme, setTheme] = useState(loadTheme);
  const [page, setPage] = useState(pageFromHash);
  const [period, setPeriod] = useState({ type: "month" });

  // Autentikasi dan sinkronisasi Cloud
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState("local"); // "local" | "saving" | "saved" | "error"
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);
  const [localDataPrompted, setLocalDataPrompted] = useState(false);

  // Periode lengkap untuk halaman: "month" selalu berarti bulan berjalan.
  const activePeriod = useMemo(
    () => (period.type === "month" ? { type: "month", month: currentMonthKey() } : { type: "all" }),
    [period.type],
  );
  const [form, setForm] = useState({ open: false, transaction: null });
  const [toast, setToast] = useState(null);

  const mainRef = useRef(null);
  const firstRender = useRef(true);

  const notify = useCallback((type, message) => setToast({ id: Date.now(), type, message }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  // Monitor status autentikasi Supabase
  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setSyncStatus("saving");
        const [txRes, bgRes] = await Promise.all([
          fetchTransactions(currentUser.id),
          fetchBudgets(currentUser.id),
        ]);

        if (!mounted) return;

        if (txRes.ok && bgRes.ok) {
          setTransactions(txRes.data);
          setBudgets(bgRes.data);
          setSyncStatus("saved");

          // Periksa apakah ada data lokal yang perlu dimigrasikan jika belum pernah diminta
          const local = getLocalDataToMigrate();
          if (local.hasData && !localDataPrompted) {
            setLocalDataPrompted(true);
            setMigrationModalOpen(true);
          }
        } else {
          setSyncStatus("error");
          notify("error", txRes.error || bgRes.error || "Gagal memuat data dari cloud.");
        }
      } else {
        // Mode lokal ketika tidak login
        setTransactions(loadTransactions());
        setBudgets(loadBudgets());
        setSyncStatus("local");
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [notify, localDataPrompted]);

  // Simpan ke localStorage HANYA jika dalam mode lokal (tidak sedang login ke cloud)
  useEffect(() => {
    if (!user) {
      if (!saveTransactions(transactions)) {
        // oxlint-disable-next-line react/set-state-in-effect
        notify("error", "Data gagal disimpan. Penyimpanan browser penuh atau diblokir. Unduh backup sekarang.");
      }
    }
  }, [transactions, user, notify]);

  useEffect(() => {
    if (!user) {
      if (!saveBudgets(budgets)) {
        // oxlint-disable-next-line react/set-state-in-effect
        notify("error", "Anggaran gagal disimpan. Penyimpanan browser penuh atau diblokir.");
      }
    }
  }, [budgets, user, notify]);

  useEffect(() => {
    saveTheme(theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Navigasi sederhana memakai hash (#/transactions), tanpa React Router.
  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
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

  /* ----- Autentikasi & Migrasi ----- */

  async function handleSignOut() {
    const res = await signOut();
    if (res.ok) {
      setUser(null);
      setTransactions(loadTransactions());
      setBudgets(loadBudgets());
      setSyncStatus("local");
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
      // Muat ulang data terbaru dari cloud setelah upsert
      const [txRes, bgRes] = await Promise.all([
        fetchTransactions(user.id),
        fetchBudgets(user.id),
      ]);
      if (txRes.ok && bgRes.ok) {
        setTransactions(txRes.data);
        setBudgets(bgRes.data);
      }
      setSyncStatus("saved");
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

  async function submitTransaction(clean, editingId) {
    if (editingId) {
      if (user) {
        setSyncStatus("saving");
        const res = await updateTransaction({ ...clean, id: editingId }, user.id);
        if (res.ok) {
          setTransactions((list) => list.map((t) => (t.id === editingId ? res.data : t)));
          setSyncStatus("saved");
          notify("success", "Transaksi berhasil diperbarui di cloud.");
        } else {
          setSyncStatus("error");
          notify("error", res.error || "Gagal memperbarui transaksi di cloud.");
          return;
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
          notify("success", "Transaksi berhasil disimpan ke cloud.");
        } else {
          setSyncStatus("error");
          notify("error", res.error || "Gagal menyimpan transaksi ke cloud.");
          return;
        }
      } else {
        setTransactions((list) => [...list, { ...clean, id: newId }]);
        notify("success", "Transaksi berhasil ditambahkan.");
      }
    }
    closeForm();
  }

  async function deleteTransaction(id) {
    if (user) {
      setSyncStatus("saving");
      const res = await deleteTransactionService(id, user.id);
      if (res.ok) {
        setTransactions((list) => list.filter((t) => t.id !== id));
        setSyncStatus("saved");
        notify("success", "Transaksi dihapus dari cloud.");
      } else {
        setSyncStatus("error");
        notify("error", res.error || "Gagal menghapus transaksi dari cloud.");
      }
    } else {
      setTransactions((list) => list.filter((t) => t.id !== id));
      notify("success", "Transaksi dihapus.");
    }
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
        notify("success", isUpdate ? "Anggaran diperbarui di cloud." : "Anggaran disimpan di cloud.");
      } else {
        setSyncStatus("error");
        notify("error", res.error || "Gagal menyimpan anggaran ke cloud.");
      }
    } else {
      setBudgets((list) => {
        const others = list.filter((b) => !(b.month === budget.month && b.category === budget.category));
        return [...others, budget];
      });
      notify("success", isUpdate ? "Anggaran diperbarui." : "Anggaran disimpan.");
    }
  }

  async function deleteBudget(budget) {
    if (user) {
      setSyncStatus("saving");
      const res = await deleteBudgetService(budget, user.id);
      if (res.ok) {
        setBudgets((list) => list.filter((b) => !(b.month === budget.month && b.category === budget.category)));
        setSyncStatus("saved");
        notify("success", "Anggaran dihapus dari cloud.");
      } else {
        setSyncStatus("error");
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
        const [refetchTx, refetchBg] = await Promise.all([
          fetchTransactions(user.id),
          fetchBudgets(user.id),
        ]);
        if (refetchTx.ok && refetchBg.ok) {
          setTransactions(refetchTx.data);
          setBudgets(refetchBg.data);
        }
        setSyncStatus("saved");
        notify("success", `Import berhasil disinkronkan ke cloud: ${data.transactions.length} transaksi dan ${data.budgets.length} anggaran.`);
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

  function clearAll() {
    if (!user) {
      removeAllStoredData();
    }
    setTransactions([]);
    setBudgets([]);
    notify("success", user ? "Data di tampilan telah dikosongkan." : "Seluruh data lokal telah dihapus.");
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
        const [refetchTx, refetchBg] = await Promise.all([
          fetchTransactions(user.id),
          fetchBudgets(user.id),
        ]);
        if (refetchTx.ok && refetchBg.ok) {
          setTransactions(refetchTx.data);
          setBudgets(refetchBg.data);
        }
        setSyncStatus("saved");
        notify("success", "Data contoh dimuat ke akun cloud Anda.");
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
  const localSummary = getLocalDataToMigrate();

  return (
    <div className="min-h-dvh lg:pl-60">
      <a
        href="#konten"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-ink"
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
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-6 pb-28 outline-none sm:px-6 lg:max-w-none lg:px-8 lg:pt-8 lg:pb-12 xl:pr-12"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <Header
            title={meta.title}
            description={meta.description}
            period={period}
            onPeriodChange={setPeriod}
            showPeriod={page === "dashboard"}
            onAdd={openForm}
            syncStatus={syncStatus}
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSignOut={handleSignOut}
          />

          <div key={page} className="rise-in">
            {page === "dashboard" && (
              <Dashboard
                transactions={transactions}
                budgets={budgets}
                period={activePeriod}
                onNavigate={navigate}
                onAdd={openForm}
                onLoadDemo={loadDemo}
              />
            )}
            {page === "transactions" && (
              <Transactions
                transactions={transactions}
                onAdd={openForm}
                onEdit={openForm}
                onDelete={deleteTransaction}
                onNotify={notify}
              />
            )}
            {page === "budgets" && (
              <Budgets transactions={transactions} budgets={budgets} onSave={saveBudget} onDelete={deleteBudget} />
            )}
            {page === "reports" && <Reports transactions={transactions} onNotify={notify} />}
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
                onStartMigration={() => setMigrationModalOpen(true)}
                hasLocalData={localSummary.hasData}
                localCounts={{
                  transactions: localSummary.transactionCount,
                  budgets: localSummary.budgetCount,
                }}
              />
            )}
          </div>
        </div>
      </main>

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

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
