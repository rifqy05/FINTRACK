// Jawaban cadangan tanpa model AI.
//
// Dipakai saat penyedia AI belum dikonfigurasi atau ketika periode yang
// ditanyakan belum memiliki data. Semua angka berasal dari fungsi perhitungan
// aplikasi, jadi jawabannya tetap akurat dan bisa diuji tanpa jaringan.

import { formatCurrency } from "../src/utils/formatCurrency.js";

const percent = (value) => (value === null || value === undefined ? "belum bisa dihitung" : `${value}%`);

export function buildEmptyPeriodAnswer(summary) {
  const { label } = summary.period;
  return [
    `Belum ada transaksi tercatat pada ${label}, jadi belum ada angka yang bisa saya ringkas untuk periode itu.`,
    `Coba pilih bulan lain, atau catat transaksi terlebih dahulu. Data terakhir yang tersimpan di akun Anda: ${summary.meta.latestDate ?? "belum ada"}.`,
  ].join("\n\n");
}

export function buildFallbackAnswer({ summary, plan }) {
  const lines = [];
  const { label, comparedLabel } = summary.period;

  lines.push(
    `Ringkasan ${label}: pemasukan ${formatCurrency(summary.totals.income)}, pengeluaran ${formatCurrency(
      summary.totals.expense,
    )}, selisih ${formatCurrency(summary.totals.balance)}. Saving rate ${percent(summary.totals.savingRate)}.`,
  );

  if (summary.topExpenseCategories.length > 0) {
    const top = summary.topExpenseCategories[0];
    lines.push(
      `Kategori pengeluaran terbesar: ${top.category} sebesar ${formatCurrency(top.amount)} (${top.percent}% dari total pengeluaran bulan ini).`,
    );
  }

  if (summary.hasPreviousData) {
    const arah = summary.change.expenseDelta >= 0 ? "naik" : "turun";
    lines.push(
      `Dibanding ${comparedLabel} (${formatCurrency(summary.previous.expense)}), pengeluaran bulan ini ${arah} ${formatCurrency(
        Math.abs(summary.change.expenseDelta),
      )} (${percent(summary.change.expensePercent)}).`,
    );
  } else {
    lines.push(`Belum ada data pada ${comparedLabel}, jadi perbandingan bulan sebelumnya belum bisa dihitung.`);
  }

  if (summary.risingCategories.length > 0) {
    const rising = summary.risingCategories[0];
    lines.push(
      `Kategori yang paling meningkat: ${rising.category}, dari ${formatCurrency(rising.previousAmount)} menjadi ${formatCurrency(rising.amount)}.`,
    );
  }

  if (summary.budgets.length > 0) {
    const over = summary.budgets.filter((budget) => budget.status !== "ok");
    if (over.length === 0) {
      lines.push("Semua anggaran bulan ini masih dalam batas aman.");
    } else {
      lines.push(
        `Anggaran yang perlu diperhatikan: ${over
          .map(
            (budget) =>
              `${budget.category} ${budget.percent}% (${budget.status === "over" ? "melewati batas" : "hampir mencapai batas"})`,
          )
          .join(", ")}.`,
      );
    }
  } else {
    lines.push("Belum ada anggaran yang diatur untuk bulan ini.");
  }

  if (plan) {
    if (plan.achievable) {
      lines.push(
        `Simulasi menabung ${formatCurrency(plan.targetAmount)}: dengan rata-rata surplus ${formatCurrency(
          plan.monthlySurplus,
        )} per bulan (dari ${plan.basedOnMonths} bulan terakhir yang berisi data), target tercapai dalam sekitar ${plan.monthsNeeded} bulan.`,
      );
    } else {
      lines.push(
        `Simulasi menabung ${formatCurrency(plan.targetAmount)}: rata-rata bulanan Anda belum surplus, jadi target ini belum bisa diproyeksikan. Kurangi pengeluaran atau tambah pemasukan lebih dulu.`,
      );
    }
  }

  if (summary.meta.truncated) {
    lines.push("Catatan: hanya sebagian transaksi terbaru yang dianalisis karena jumlah data cukup besar.");
  }

  return lines.join("\n\n");
}
