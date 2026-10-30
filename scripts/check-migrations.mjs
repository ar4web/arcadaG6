import { readdirSync, readFileSync, statSync } from 'node:fs';
import { parse } from 'pgsql-parser';

const target = process.argv[2] ?? 'supabase/migrations';
const files = statSync(target).isDirectory()
  ? readdirSync(target).filter((f) => f.endsWith('.sql')).map((f) => `${target}/${f}`)
  : [target];
let failures = 0;
for (const file of files.sort()) {
  const sql = readFileSync(file, 'utf8');
  try {
    const ast = await parse(sql);
    console.log(`PASS ${file}  (${ast.stmts?.length ?? 0} statements)`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${file}: ${String(error.message).split('\n')[0]}`);
  }
}
process.exit(failures ? 1 : 0);
