// Checks the app can reach your Supabase project and that the database is set up
// safely. Read-only: it never creates or changes anything.
//
//   npm run check:supabase
//
// It connects with the same keys as the app (from .env.local), as a visitor who
// isn't logged in, and expects to see nothing and be allowed to change nothing.

import { createClient } from '@supabase/supabase-js';

const TABLES = [
  'businesses',
  'business_members',
  'menu_categories',
  'menu_items',
  'orders',
  'order_lines',
  'order_pauses',
];

let failed = 0;
const pass = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg, hint) => {
  failed += 1;
  console.log(`  ✗ ${msg}${hint ? `\n      → ${hint}` : ''}`);
};
const stop = () => {
  console.log(`\n${failed} problem${failed === 1 ? '' : 's'} found.`);
  process.exit(1);
};

console.log('\n1. Keys in .env.local');
const url = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
const key = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

if (!url || url.includes('your-project-ref')) {
  fail('VITE_SUPABASE_URL is missing', 'Copy the Project URL from Project Settings → API.');
} else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
  fail(
    `VITE_SUPABASE_URL doesn't look like a Supabase URL`,
    'It should be https://<something>.supabase.co',
  );
} else {
  pass('Project URL is set');
}

function keyRole(k) {
  if (k.startsWith('sb_publishable_')) return 'publishable';
  if (k.startsWith('sb_secret_')) return 'secret';
  if (k.startsWith('eyJ')) {
    try {
      return JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString()).role ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }
  return 'unknown';
}
const role = keyRole(key);
if (!key || key === 'your-anon-key') {
  fail(
    'VITE_SUPABASE_ANON_KEY is missing',
    'Copy the anon / publishable key from Project Settings → API.',
  );
} else if (role === 'secret' || role === 'service_role') {
  fail(
    'This is the SECRET (service_role) key. It must never be in the app.',
    'Replace it with the anon / publishable key. If this was ever pushed to GitHub, rotate it in Supabase.',
  );
} else if (role === 'anon' || role === 'publishable') {
  pass(`Key is the ${role} key, which is safe in the app`);
} else {
  fail(
    "Couldn't tell what kind of key this is",
    'Use the anon / publishable key from Project Settings → API.',
  );
}
if (failed) stop();

console.log('\n2. Reaching your project');
try {
  const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key } });
  if (res.ok) pass('Supabase answered');
  else if (res.status === 401)
    fail('Supabase rejected the key', 'Check you copied the whole anon key for this project.');
  else
    fail(
      `Supabase answered with an error (${res.status})`,
      'If the project is paused, restore it from the dashboard.',
    );
} catch (e) {
  fail(`Couldn't reach ${url}`, `Check the URL and your internet connection. (${e.message})`);
}
if (failed) stop();

const supabase = createClient(url, key, { auth: { persistSession: false } });

console.log('\n3. Tables exist, and hide their data from visitors who are not logged in');
for (const table of TABLES) {
  const { error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    const missing =
      ['PGRST205', '42P01'].includes(error.code) ||
      /does not exist|schema cache/i.test(error.message);
    fail(
      `${table}: ${missing ? 'not found' : error.message}`,
      missing
        ? 'Run supabase/migrations/20261118000000_initial_schema.sql in the SQL Editor.'
        : undefined,
    );
  } else if (count && count > 0) {
    fail(
      `${table}: a logged-out visitor can see ${count} row(s)`,
      'Row level security is off for this table.',
    );
  } else {
    pass(`${table}`);
  }
}

console.log('\n4. Visitors who are not logged in cannot change anything');
{
  const { error } = await supabase
    .from('menu_categories')
    .insert({ business_id: '00000000-0000-0000-0000-000000000000', name: 'check' });
  if (error) pass('Adding to a menu is refused');
  else
    fail(
      'A logged-out visitor was able to add a menu category',
      'Row level security is off for menu_categories.',
    );
}
{
  const { error } = await supabase.rpc('create_business', { business_name: 'check' });
  if (!error) {
    fail(
      'A logged-out visitor was able to create a business',
      'Re-run the revoke/grant lines in the SQL file.',
    );
  } else if (/could not find the function|PGRST202/i.test(`${error.code} ${error.message}`)) {
    fail('create_business() not found', 'Run the SQL file in the SQL Editor.');
  } else {
    pass('Creating a business needs a login');
  }
}

if (failed) stop();
console.log(
  '\nAll good: the app can reach Supabase, and the database is set up and locked down.\n',
);
