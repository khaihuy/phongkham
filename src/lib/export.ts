// Helper xuất Excel + PDF dùng chung cho mọi báo cáo.
//
// Lưu ý font: jsPDF mặc định dùng Helvetica (Latin-1) nên dấu tiếng Việt
// có thể hiển thị không chuẩn. Để đảm bảo PDF render đúng dấu, cần nhúng
// font TTF Unicode (vd. Roboto). Hiện tại chấp nhận Helvetica để giữ
// bundle size nhỏ — bản nâng cao sẽ thêm font sau.

import * as XLSX from "xlsx"

export interface ExcelSheet {
  name: string
  rows: Record<string, any>[]
}

export function exportExcel(filename: string, sheets: ExcelSheet[]) {
  const wb = XLSX.utils.book_new()
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows)
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31))
  }
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`)
}

export interface PdfTable {
  title?: string
  head: string[]
  body: (string | number)[][]
  foot?: (string | number)[][]
}

export interface PdfDocOptions {
  title: string
  subtitle?: string
  orientation?: "p" | "l"
  tables: PdfTable[]
}

export async function exportPdf(filename: string, opts: PdfDocOptions) {
  const { jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default

  const doc = new jsPDF({
    orientation: opts.orientation ?? "p",
    unit: "mm",
    format: "a4",
  })

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(opts.title, 14, 18)

  if (opts.subtitle) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100)
    doc.text(opts.subtitle, 14, 25)
    doc.setTextColor(0)
  }

  let cursorY = opts.subtitle ? 32 : 26

  for (const table of opts.tables) {
    if (table.title) {
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(table.title, 14, cursorY)
      cursorY += 6
    }

    autoTable(doc, {
      startY: cursorY,
      head: [table.head],
      body: table.body.map((row) => row.map((cell) => String(cell))),
      foot: table.foot?.map((row) => row.map((cell) => String(cell))),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [243, 244, 246], textColor: 0, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    })

    // @ts-ignore — autotable thêm property này runtime
    cursorY = (doc as any).lastAutoTable.finalY + 10
  }

  // Footer trang
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text(
      `Trang ${i}/${pageCount} — Xuat luc ${new Date().toLocaleString("vi-VN")}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    )
  }

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`)
}
