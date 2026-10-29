import { useApp } from "@/store/app-store";

function download(name: string, type: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportJson() {
  const { user, settings, logs, days, qada } = useApp.getState();
  const data = {
    exportedAt: new Date().toISOString(),
    account: user ? { name: user.name, email: user.email } : null,
    settings,
    prayers: Object.values(logs).sort((a, b) => a.date.localeCompare(b.date)),
    days: Object.values(days).sort((a, b) => a.date.localeCompare(b.date)),
    qada,
  };
  download(`deen-${stamp()}.json`, "application/json", JSON.stringify(data, null, 2));
}

const ORDER = ["TAHAJJUD", "FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"];
const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportCsv() {
  const { logs, days } = useApp.getState();
  const header = ["date", "prayer", "status", "congregation", "sunnah_before", "sunnah_after", "witr", "combined", "rakats", "excused", "travel", "note"];
  const rows = Object.values(logs)
    .sort((a, b) => a.date.localeCompare(b.date) || ORDER.indexOf(a.prayer) - ORDER.indexOf(b.prayer))
    .map((l) => {
      const d = days[l.date];
      return [l.date, l.prayer, l.status, l.congregation, l.sunnahBefore, l.sunnahAfter, l.witr, l.combined, l.rakats, d?.excused ?? false, d?.travel ?? false, d?.note ?? ""];
    });
  download(`deen-${stamp()}.csv`, "text/csv", [header, ...rows].map((r) => r.map(cell).join(",")).join("\n"));
}
