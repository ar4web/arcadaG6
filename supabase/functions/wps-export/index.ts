/**
 * Wage Protection System (WPS) SIF file generation.
 * One fixed-width record per employee, plus header and trailer records.
 */
import { fail, json, preflight } from '../_shared/cors.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';

interface Payload {
  runId: string;
  bankId?: string;
}

const pad = (value: string | number, length: number) => String(value).padEnd(length, ' ').slice(0, length);
const padNum = (value: number, length: number) => String(Math.round(value * 100)).padStart(length, '0').slice(-length);

Deno.serve(async (request) => {
  const pre = preflight(request);
  if (pre) return pre;
  if (request.method !== 'POST') return fail('method not allowed', 405);

  try {
    await requireUser(request);
    const { runId, bankId = Deno.env.get('WPS_BANK_ID') ?? '050' } = (await request.json()) as Payload;
    if (!runId) return fail('runId is required');

    const db = adminClient();
    const { data: run, error } = await db.from('payroll_runs').select('*').eq('id', runId).single();
    if (error || !run) return fail('payroll run not found', 404);
    if (!['approved', 'review'].includes(run.status)) return fail('run must be approved before export', 409);

    const { data: payslips } = await db
      .from('payslips')
      .select('*, employee:employees(employee_no, first_name, last_name, iban, bank_name, gosi_no)')
      .eq('run_id', runId);
    if (!payslips?.length) return fail('no payslips on this run', 409);

    const header = `H${pad(run.period.replace('-', ''), 6)}${pad(bankId, 4)}${padNum(run.net_total, 15)}${pad(payslips.length, 5)}`;
    const rows = payslips.map((ps: any) =>
      [
        'E',
        pad(ps.employee?.iban ?? '', 24),
        pad(ps.employee?.gosi_no ?? '', 12),
        pad(ps.employee?.employee_no ?? '', 10),
        pad(`${ps.employee?.first_name ?? ''} ${ps.employee?.last_name ?? ''}`, 40),
        padNum(ps.base_salary, 12),
        padNum(ps.housing_allowance, 12),
        padNum(ps.net, 12),
        pad(run.period.replace('-', ''), 6),
      ].join(''),
    );
    const trailer = `T${padNum(payslips.reduce((sum: number, ps: any) => sum + Number(ps.net), 0), 15)}${pad(payslips.length, 5)}`;
    const sif = [header, ...rows, trailer].join('\r\n');

    const path = `${run.org_id}/wps/${run.period}-${bankId}.sif`;
    const { error: uploadError } = await db.storage
      .from('exports')
      .upload(path, new Blob([sif], { type: 'text/plain' }), { upsert: true, contentType: 'text/plain' });
    if (uploadError) return fail(uploadError.message, 500);

    await db.from('wps_submissions').insert({
      org_id: run.org_id,
      run_id: runId,
      bank: bankId,
      file_url: path,
      total_amount: run.net_total,
      status: 'generated',
    });

    return json({ ok: true, path, employees: payslips.length, total: run.net_total });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'unexpected error', 500);
  }
});
