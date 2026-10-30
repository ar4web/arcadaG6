/** Transactional email through Resend, with an in-app notification mirror. */
import { fail, json, preflight } from '../_shared/cors.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';

interface Payload {
  to: string;
  subject: string;
  html: string;
  orgId?: string;
  employeeId?: string;
}

Deno.serve(async (request) => {
  const pre = preflight(request);
  if (pre) return pre;
  if (request.method !== 'POST') return fail('method not allowed', 405);

  try {
    await requireUser(request);
    const { to, subject, html, orgId, employeeId } = (await request.json()) as Payload;
    if (!to || !subject || !html) return fail('to, subject and html are required');

    const apiKey = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('RESEND_FROM') ?? 'Qimma People <no-reply@qimma.sa>';

    let delivered = false;
    let providerId: string | null = null;

    if (apiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, html }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) return fail(body?.message ?? 'resend rejected the message', 502);
      delivered = true;
      providerId = body?.id ?? null;
    }

    if (orgId) {
      const db = adminClient();
      await db.from('notifications').insert({
        org_id: orgId,
        employee_id: employeeId ?? null,
        kind: 'info',
        title: subject,
        body: delivered ? 'Email delivered.' : 'Email queued (no provider configured).',
        channel: 'email',
      });
    }

    return json({ ok: true, delivered, providerId });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'unexpected error', 500);
  }
});
