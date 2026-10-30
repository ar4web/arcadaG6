import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { downloadBlob, formatSAR } from '@/lib/utils';
import type { Employee } from '@/types';
import { db, displayName } from '@/lib/mock/db';

export type ReportFormat = 'csv' | 'xlsx' | 'pdf' | 'docx';

export interface ReportTable {
  title: string;
  filename: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
  meta?: Record<string, string>;
}

export function toCsv(table: ReportTable) {
  const csv = Papa.unparse({
    fields: table.columns.map((c) => c.label),
    data: table.rows.map((row) => table.columns.map((c) => row[c.key] ?? '')),
  });
  downloadBlob(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }), `${table.filename}.csv`);
}

export function toXlsx(table: ReportTable) {
  const sheet = XLSX.utils.json_to_sheet(
    table.rows.map((row) => Object.fromEntries(table.columns.map((c) => [c.label, row[c.key] ?? '']))),
  );
  sheet['!cols'] = table.columns.map((c) => ({ wch: Math.max(12, c.label.length + 4) }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, table.title.slice(0, 30));
  const buffer = XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${table.filename}.xlsx`);
}

export async function toPdf(element: HTMLElement, filename: string) {
  const { default: html2pdf } = await import('html2pdf.js');
  await html2pdf()
    .set({
      margin: [10, 10, 12, 10],
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    })
    .from(element)
    .save();
}

export async function toDocx(table: ReportTable) {
  const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, TextRun } = await import('docx');
  const header = new TableRow({
    tableHeader: true,
    children: table.columns.map(
      (c) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c.label, bold: true, size: 18 })] })] }),
    ),
  });
  const body = table.rows.map(
    (row) =>
      new TableRow({
        children: table.columns.map(
          (c) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(row[c.key] ?? ''), size: 18 })] })] }),
        ),
      }),
  );
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: table.title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: `Generated ${new Date().toLocaleString('en-GB')} · Qimma Group`, spacing: { after: 240 } }),
          new Table({ rows: [header, ...body], width: { size: 100, type: 'pct' } }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${table.filename}.docx`);
}

export async function exportTable(table: ReportTable, format: ReportFormat) {
  if (format === 'csv') return toCsv(table);
  if (format === 'xlsx') return toXlsx(table);
  if (format === 'docx') return toDocx(table);
  throw new Error('PDF export requires a rendered element — use exportElementToPdf.');
}

export async function exportElementToPdf(element: HTMLElement, filename: string) {
  return toPdf(element, filename);
}

/* ------------------------- Pre-built report builders ------------------------ */

export const employeeRegisterReport = (employees: Employee[] = db.employees.filter((e) => e.status !== 'terminated')): ReportTable => ({
  title: 'Employee register',
  filename: `qimma-employee-register-${new Date().toISOString().slice(0, 10)}`,
  columns: [
    { key: 'employeeNo', label: 'Employee no.' },
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'title', label: 'Job title' },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status' },
    { key: 'hireDate', label: 'Hire date' },
    { key: 'basic', label: 'Basic (SAR)' },
    { key: 'gross', label: 'Gross (SAR)' },
  ],
  rows: employees.map((e) => ({
    employeeNo: e.employeeNo,
    name: displayName(e),
    department: db.departments.find((d) => d.id === e.departmentId)?.name ?? '',
    title: e.jobTitle,
    location: db.locations.find((l) => l.id === e.locationId)?.name ?? '',
    status: e.status,
    hireDate: e.hireDate,
    basic: e.salary.basic,
    gross: e.salary.basic + e.salary.housing + e.salary.transport + e.salary.allowances,
  })),
});

export const payrollRegisterReport = (): ReportTable => ({
  title: 'Payroll register',
  filename: `qimma-payroll-register-${new Date().toISOString().slice(0, 10)}`,
  columns: [
    { key: 'employeeNo', label: 'Employee no.' },
    { key: 'name', label: 'Name' },
    { key: 'iban', label: 'IBAN' },
    { key: 'gross', label: 'Gross (SAR)' },
    { key: 'gosi', label: 'GOSI employee (SAR)' },
    { key: 'net', label: 'Net (SAR)' },
  ],
  rows: db.employees
    .filter((e) => e.status !== 'terminated')
    .map((e) => {
      const gross = e.salary.basic + e.salary.housing + e.salary.transport + e.salary.allowances;
      const gosi = e.nationality === 'Saudi' ? Math.round((e.salary.basic + e.salary.housing) * 0.0975) : 0;
      return { employeeNo: e.employeeNo, name: displayName(e), iban: e.iban, gross, gosi, net: gross - gosi };
    }),
});

export const leaveRegisterReport = (): ReportTable => ({
  title: 'Leave register',
  filename: `qimma-leave-register-${new Date().toISOString().slice(0, 10)}`,
  columns: [
    { key: 'employee', label: 'Employee' },
    { key: 'type', label: 'Type' },
    { key: 'start', label: 'Start' },
    { key: 'end', label: 'End' },
    { key: 'days', label: 'Days' },
    { key: 'status', label: 'Status' },
  ],
  rows: db.leave.map((r) => ({
    employee: displayName(db.employees.find((e) => e.id === r.employeeId) ?? db.employees[0]!),
    type: r.type,
    start: r.startDate,
    end: r.endDate,
    days: r.days,
    status: r.status,
  })),
});

export const monthlyCostReport = (): ReportTable => ({
  title: 'Monthly payroll cost',
  filename: `qimma-payroll-cost-${new Date().toISOString().slice(0, 10)}`,
  columns: [
    { key: 'period', label: 'Period' },
    { key: 'headcount', label: 'Headcount' },
    { key: 'gross', label: 'Gross (SAR)' },
    { key: 'net', label: 'Net (SAR)' },
    { key: 'status', label: 'Status' },
  ],
  rows: db.payrollRuns.map((r) => ({
    period: r.period,
    headcount: r.headcount,
    gross: Math.round(r.gross),
    net: Math.round(r.net),
    status: r.status,
  })),
});

export const ctcLine = (gross: number) => formatSAR(gross * 12);
