type Cell = string | number;

export type ExportInput = {
  title: string;
  subtitle?: string;
  headers: string[];
  body: Cell[][];
  fileName: string;
};

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportExcel({ title, subtitle, headers, body, fileName }: ExportInput) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Report");
  const last = headers.length;
  const thin = {
    top: { style: "thin" }, left: { style: "thin" },
    bottom: { style: "thin" }, right: { style: "thin" },
  } as const;

  ws.mergeCells(1, 1, 1, last);
  const t = ws.getCell(1, 1);
  t.value = title.toUpperCase();
  t.font = { bold: true, size: 16 };
  t.alignment = { horizontal: "center" };

  if (subtitle) {
    ws.mergeCells(2, 1, 2, last);
    const s = ws.getCell(2, 1);
    s.value = subtitle;
    s.alignment = { horizontal: "center" };
  }

  const head = ws.addRow(headers);
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8E3FD6" } };
    c.alignment = { horizontal: "center" };
    c.border = thin;
  });

  body.forEach((r) => {
    ws.addRow(r).eachCell((c) => { c.border = thin; });
  });

  headers.forEach((h, i) => {
    const longest = body.reduce((m, r) => Math.max(m, String(r[i]).length), h.length);
    ws.getColumn(i + 1).width = Math.min(40, longest + 3);
  });

  const buf = await wb.xlsx.writeBuffer();
  download(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${fileName}.xlsx`
  );
}

export async function exportPdf({ title, subtitle, headers, body, fileName }: ExportInput) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 14);
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 14, 21);
  }
  autoTable(doc, {
    head: [headers],
    body,
    startY: subtitle ? 26 : 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [142, 63, 214] },
  });
  doc.save(`${fileName}.pdf`);
}