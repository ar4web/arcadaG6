/** WhatsApp Cloud API notifications (leave approvals, payroll ready, compliance). */
import { fail, json, preflight } from '../_shared/cors.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';

interface Payload {
  to: string;
  template: string;
  variables?: string[];
  orgId?: string;
  employeeId?: string;
}

Deno.serve(async (request) => {
  const pre = preflight(request);
  if (pre) return pre;
  if (request.method !== 'POST') return fail('method not allowed', 405);

  try {
    await requireUser(request);
    const { to, template, variables = [], orgId, employeeId } = (await request.json()) as Payload;
    if (!to || !template) return fail('to and template are required');

    const token = Deno.env.get('WHATSAPP_TOKEN');
    const phoneId = Deno.env.get('WHATSAPP_PHONE_ID');
    const baseUrl = Deno.env.get('WHATSAPP_API_URL') ?? 'https://graph.facebook.com/v20.0';

    let delivered = false;
    if (token && phoneId) {
      const response = await fetch(`${baseUrl}/${phoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: template,
            language: { code: 'ar' },
            components: variables.length
              ? [{ type: 'body', parameters: variables.map((value) => ({ type: 'text', text: value })) }]
              : undefined,
          },
        }),
      });
      if (!response.ok) return fail(`whatsapp rejected the message (${response.status})`, 502);
      delivered = true;
    }

    if (orgId) {
      const db = adminClient();
      await db.from('notifications').insert({
        org_id: orgId,
        employee_id: employeeId ?? null,
        kind: 'info',
        title: `WhatsApp: ${template}`,
        body: delivered ? 'Message delivered.' : 'Message queued (no provider configured).',
        channel: 'whatsapp',
      });
    }

    return json({ ok: true, delivered });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'unexpected error', 500);
  }
});
