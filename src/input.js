// The results file, checked row by row. A bad row stops the run with its line number.

function csvRows(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const s = String(text).replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

// results.csv: variant,visitors,actions[,cost]
//   visitors  people from the target audience who saw the page
//   actions   those who took the action that counts (sign-up, chosen plan, pre-order)
//   cost      optional, what the traffic for that variant cost, in any one currency
export function parseResults(text) {
  const rows = csvRows(text);
  if (!rows.length) throw new Error('results: the file is empty');
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const missing = ['variant', 'visitors', 'actions'].filter((c) => !head.includes(c));
  if (missing.length) throw new Error(`results: missing column(s) ${missing.join(', ')}`);
  const at = Object.fromEntries(head.map((h, i) => [h, i]));
  const errors = [];
  const seen = new Set();
  const out = [];
  rows.slice(1).forEach((r, i) => {
    const line = `results line ${i + 2}`;
    if (r.length !== head.length) { errors.push(`${line}: expected ${head.length} values, found ${r.length}`); return; }
    const variant = r[at.variant].trim();
    const visitors = Number(r[at.visitors]);
    const actions = Number(r[at.actions]);
    if (!variant) errors.push(`${line}: variant is empty`);
    else if (seen.has(variant)) errors.push(`${line}: variant ${variant} is listed twice`);
    seen.add(variant);
    if (!Number.isInteger(visitors) || visitors < 1) errors.push(`${line}: visitors must be a whole number above 0, not "${r[at.visitors]}"`);
    if (!Number.isInteger(actions) || actions < 0) errors.push(`${line}: actions must be a whole number, not "${r[at.actions]}"`);
    else if (Number.isInteger(visitors) && actions > visitors) errors.push(`${line}: more actions (${actions}) than visitors (${visitors})`);
    const v = { variant, visitors, actions };
    if (at.cost !== undefined && r[at.cost].trim() !== '') {
      const cost = Number(r[at.cost]);
      if (!Number.isFinite(cost) || cost < 0) errors.push(`${line}: cost must be a number of 0 or more, not "${r[at.cost]}"`);
      v.cost = cost;
    }
    out.push(v);
  });
  if (errors.length) throw new Error(`invalid results:\n  ${errors.join('\n  ')}`);
  if (!out.length) throw new Error('results: the file has a header but no variants');
  return out;
}

export function parseLine(value) {
  const s = String(value).trim();
  const n = s.endsWith('%') ? Number(s.slice(0, -1)) / 100 : Number(s);
  if (!Number.isFinite(n) || n <= 0 || n >= 1) throw new Error(`--line must be a share between 0 and 1, such as 0.05 or 5%, not "${value}"`);
  return n;
}
