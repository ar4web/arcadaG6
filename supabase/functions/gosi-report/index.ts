/**
 * GOSI contribution report.
 * Employee 9.75% + employer 11.75% on basic + housing,
 * plus 2% occupational hazard on the same base.
 */
import { fail, json, preflight } from '../_shared/cors.ts';
import { adminClient, requireUser } from '../_shared/supabase.ts';

interface Payload {
  period: string; // YYYY-MM
  persist?: boolean;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

Deno.serve(async (request) => {
  const pre = preflight(request);
  if (pre) return pre;
  if (request.method !== 'POST') return fail('method not allowed', 405);

  try {
    await requireUser(request);
    const { period, persist = true } = (await request.json()) as Payload;
    if (!/^\d{4}-\d{2}$/.test(period ?? '')) return fail('period must be YYYY-MM');

    const db = adminClient();
    const { data: employees, error } = await db
      .from('employees')
      .select('id, org_id, base_salary, housing_allowance, nationality, status')
      .in('status', ['active', 'probation', 'on_leave']);
    if (error) return fail(error.message, 500);

    const byOrg = new Map<string, { count: number; employee: number; employer: number; hazard: number }>();
    for (const employee of employees ?? []) {
      const base = Number(employee.base_salary) + Number(employee.housing_allowance);
      const bucket = byOrg.get(employee.org_id) ?? { count: 0, employee: 0, employer: 0, hazard: 0 };
      bucket.count += 1;
      bucket.employee += round2(base * 0.0975);
      // Non-Saudis are insured at the full rate; Saudis are covered for hazards only.
      if (employee.nationality !== 'Saudi') bucket.employer += round2(base * 0.1175);
      bucket.hazard += round2(base * 0.02);
      byOrg.set(employee.org_id, bucket);
    }

    const report = [...byOrg.entries()].map(([orgId, totals]) => ({ orgId, period, ...totals }));

    if (persist) {
      for (const row of report) {
        await db.from('gosi_periods').upsert(
          {
            org_id: row.orgId,
            period,
            employee_count: row.count,
            employee_share: row.employee,
            employer_share: row.employer,
            hazard_share: row.hazard,
            status: 'filed',
            filed_at: new Date().toISOString(),
          },
          { onConflict: 'org_id,period' },
        );
      }
    }

    return json({ ok: true, period, report });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'unexpected error', 500);
  }
});
