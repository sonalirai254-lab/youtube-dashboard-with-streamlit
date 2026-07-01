import Papa from "papaparse";

export function parseCsv<T = Record<string, string>>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => resolve(res.data),
      error: (err) => reject(err),
    });
  });
}

export const toInt = (v: unknown) => {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
};

export const toNum = (v: unknown) => {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/[,% ]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Match a column by any of several candidate header names (case-insensitive). */
export function pick<T extends Record<string, unknown>>(row: T, ...names: string[]) {
  const keys = Object.keys(row);
  for (const name of names) {
    const hit = keys.find((k) => k.toLowerCase().trim() === name.toLowerCase());
    if (hit) return row[hit];
  }
  return undefined;
}