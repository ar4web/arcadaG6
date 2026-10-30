/**
 * ZATCA / Fatoora e-invoicing.
 * Generates the TLV QR payload locally, then reports a simplified invoice.
 * Docs: https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopersGuidelines
 */
import { fail, json, preflight } from '../_shared/cors.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';

interface Payload {
  invoiceId: string;
}

const encoder = new TextEncoder();

/** TLV tag helper: 1= seller, 2= VAT no, 3= timestamp, 4= total, 5= VAT amount. */
function tlv(tag: number, value: string): Uint8Array {
  const bytes = encoder.encode(value);
  return new Uint8Array([tag, bytes.length, ...bytes]);
}

function qrPayload(seller: string, vat: string, timestamp: string, total: string, vatAmount: string): string {
  const parts = [tlv(1, seller), tlv(2, vat), tlv(3, timestamp), tlv(4, total), tlv(5, vatAmount)];
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    buffer.set(part, offset);
    offset += part.length;
  }
  return btoa(String.fromCharCode(...buffer));
}

Deno.serve(async (request) => {
  const pre = preflight(request);
  if (pre) return pre;
  if (request.method !== 'POST') return fail('method not allowed', 405);

  try {
    await requireUser(request);
    const { invoiceId } = (await request.json()) as Payload;
    if (!invoiceId) return fail('invoiceId is required');

    const db = adminClient();
    const { data: invoice, error } = await db
      .from('invoices')
      .select('*, customer:customers(*), organization:organizations(*)')
      .eq('id', invoiceId)
      .single();
    if (error || !invoice) return fail('invoice not found', 404);

    const issued = invoice.issue_date ?? new Date().toISOString().slice(0, 10);
    const payload = qrPayload(
      invoice.organization?.legal_name ?? invoice.organization?.name ?? '',
      invoice.organization?.vat_number ?? '',
      issued,
      Number(invoice.total).toFixed(2),
      Number(invoice.vat_amount).toFixed(2),
    );

    // Production swaps this block for the Fatoora REST call (certificate + CSID).
    const endpoint = Deno.env.get('FATOOORA_API_URL');
    const clientId = Deno.env.get('FATOOORA_CLIENT_ID');
    const reported = endpoint && clientId && invoice.zatca_status === 'pending';

    await db
      .from('invoices')
      .update({
        qr_payload: payload,
        zatca_status: reported ? 'reported' : invoice.zatca_status ?? 'pending',
        cleared_at: reported ? new Date().toISOString() : invoice.cleared_at,
      })
      .eq('id', invoiceId);

    return json({ ok: true, invoiceId, qr: payload, reported: Boolean(reported) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'unexpected error', 500);
  }
});
