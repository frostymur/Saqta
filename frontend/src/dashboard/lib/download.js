export function downloadFile(filename, mime, text) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function toCsv(fields, rows) {
  return [
    fields.join(";"),
    ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(";")),
  ].join("\r\n");
}

export function downloadCsv(filename, fields, rows) {
  downloadFile(filename, "text/csv;charset=utf-8", `\uFEFF${toCsv(fields, rows)}`);
}

export function downloadJson(filename, rows) {
  downloadFile(filename, "application/json;charset=utf-8", JSON.stringify(rows, null, 2));
}
