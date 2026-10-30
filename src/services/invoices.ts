import type { Invoice, InvoiceStatus } from '@/types';
import { db } from '@/lib/mock/db';
import { request, write } from './api';

export async function listInvoices(filters: { status?: InvoiceStatus | 'all'; search?: string } = {}) {
  return request(() => {
    let rows = [...db.invoices];
    if (filters.status && filters.status !== 'all') rows = rows.filter((r) => r.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter((r) => r.clientName.toLowerCase().includes(q) || r.number.toLowerCase().includes(q));
    }
    return rows.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  });
}

export async function invoiceSummary() {
  return request(() => {
    const rows = db.invoices;
    const paid = rows.filter((r) => r.status === 'paid');
    const overdue = rows.filter((r) => r.status === 'overdue');
    const outstanding = rows.filter((r) => r.status === 'sent' || r.status === 'overdue');
    return {
      issued: rows.length,
      paidValue: paid.reduce((a, r) => a + r.total, 0),
      overdueValue: overdue.reduce((a, r) => a + r.total, 0),
      outstandingValue: outstanding.reduce((a, r) => a + r.total, 0),
      vatCollected: paid.reduce((a, r) => a + r.vat, 0),
      pendingZatca: rows.filter((r) => r.zatcaStatus === 'pending').length,
    };
  });
}

export async function markPaid(id: string) {
  return write(() => {
    const invoice = db.invoices.find((r) => r.id === id);
    if (!invoice) throw new Error('Invoice not found');
    invoice.status = 'paid';
    return invoice;
  });
}

export async function reportToZatca(id: string) {
  return write(() => {
    const invoice = db.invoices.find((r) => r.id === id);
    if (!invoice) throw new Error('Invoice not found');
    invoice.zatcaStatus = 'reported';
    return invoice;
  });
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  return request(() => db.invoices.find((r) => r.id === id));
}
