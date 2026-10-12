import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import { NAV_ITEMS } from "./components/navItems.js";
import Header from "./components/Header.jsx";
import Toast from "./components/Toast.jsx";
import TransactionForm from "./components/TransactionForm.jsx";
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

const PAGE_META = {
  dashboard: { title: "Dashboard", description: "Ringkasan keuangan Anda dalam satu layar." },
  transactions: { title: "Transaksi", description: "Catat, cari, dan kelola semua pemasukan dan pengeluaran." },
  budgets: { title: "Anggaran", description: "Atur batas pengeluaran per kategori setiap bulan." },
  reports: { title: "Laporan", description: "Lihat ringkasan dan tren per bulan." },
  settings: { title: "Pengaturan", description: "Tema, ekspor, backup, dan pengelolaan data." },
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

  // Simpan ke localStorage setiap kali data berubah. setState (toast) hanya dipanggil
  // jika penyimpanan gagal, yaitu sinkronisasi dengan sistem luar (browser), bukan state turunan.
  useEffect(() => {
    if (!saveTransactions(transactions)) {
      // oxlint-disable-next-line react/set-state-in-effect
      notify("error", "Data gagal disimpan. Penyimpanan browser penuh atau diblokir. Unduh backup sekarang.");
    }
  }, [transactions, notify]);

  useEffect(() => {
    if (!saveBudgets(budgets)) {
      // oxlint-disable-next-line react/set-state-in-effect
      notify("error", "Anggaran gagal disimpan. Penyimpanan browser penuh atau diblokir.");
    }
  }, [budgets, notify]);

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

  /* ----- Transaksi ----- */

  function openForm(transaction = null) {
    setForm({ open: true, transaction });
  }

  function closeForm() {
    setForm({ open: false, transaction: null });
  }

  function submitTransaction(clean, editingId) {
    if (editingId) {
      setTransactions((list) => list.map((t) => (t.id === editingId ? { ...clean, id: editingId } : t)));
      notify("success", "Transaksi berhasil diperbarui.");
    } else {
      setTransactions((list) => [...list, { ...clean, id: createId() }]);
      notify("success", "Transaksi berhasil ditambahkan.");
    }
    closeForm();
  }

  function deleteTransaction(id) {
    setTransactions((list) => list.filter((t) => t.id !== id));
    notify("success", "Transaksi dihapus.");
  }

  /* ----- Anggaran ----- */

  function saveBudget(budget, isUpdate) {
    setBudgets((list) => {
      const others = list.filter((b) => !(b.month === budget.month && b.category === budget.category));
      return [...others, budget];
    });
    notify("success", isUpdate ? "Anggaran diperbarui." : "Anggaran disimpan.");
  }

  function deleteBudget(budget) {
    setBudgets((list) => list.filter((b) => !(b.month === budget.month && b.category === budget.category)));
    notify("success", "Anggaran dihapus.");
  }

  /* ----- Data ----- */

  function importData(data) {
    setTransactions(data.transactions);
    setBudgets(data.budgets);
    notify("success", `Import berhasil: ${data.transactions.length} transaksi dan ${data.budgets.length} anggaran.`);
  }

  function clearAll() {
    removeAllStoredData();
    setTransactions([]);
    setBudgets([]);
    notify("success", "Seluruh data telah dihapus.");
  }

  function loadDemo() {
    const demo = buildDemoData();
    setTransactions(demo.transactions);
    setBudgets(demo.budgets);
    notify("success", "Data contoh dimuat. Hapus kapan saja lewat Pengaturan.");
  }

  const meta = PAGE_META[page];

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

      <Sidebar current={page} onNavigate={navigate} />

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
              />
            )}
          </div>
        </div>
      </main>

      {form.open ? (
        <TransactionForm transaction={form.transaction} onSubmit={submitTransaction} onCancel={closeForm} />
      ) : null}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
