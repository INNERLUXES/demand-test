// The result in four formats. Every format carries the same facts: "undecided" is never shown as a pass or a fail, and
// the visitors still needed are an estimate that holds only if the rate stays where it is.

const pct = (x) => `${(Math.round(x * 1000) / 10).toFixed(1)}%`;
const money = (x) => (x === undefined ? '' : x === null ? 'no actions' : (Math.round(x * 100) / 100).toFixed(2));

function verdictText(v) {
  if (v.verdict === 'passes') return 'passes: even the low end of the range is above the line';
  if (v.verdict === 'fails') return 'fails: even the high end of the range is below the line';
  if (v.moreVisitors === null) return 'undecided: the rate sits on the line';
  return `undecided: about ${v.moreVisitors} more visitors needed if the rate holds`;
}

function pairText(p) {
  const range = `${p.diff >= 0 ? '+' : ''}${(p.diff * 100).toFixed(1)} points (${(p.low * 100).toFixed(1)} to ${(p.high * 100).toFixed(1)})`;
  return `${p.a} vs ${p.b}: ${range}, ${p.lead ? `${p.lead} is ahead` : 'no clear winner yet'}`;
}

const NOTE = 'Ranges are Wilson score intervals; differences use Newcombe\'s method. "Visitors needed" is an estimate that holds only if the rate stays where it is.';

export function toText(r) {
  const lines = [`Demand test against a success line of ${pct(r.line)}, ${r.confidence}% confidence`, ''];
  const w = Math.max(7, ...r.variants.map((v) => v.variant.length));
  for (const v of r.variants) {
    lines.push(`${v.variant.padEnd(w)}  ${String(v.actions).padStart(5)} of ${String(v.visitors).padEnd(6)} ${pct(v.rate).padStart(6)}  range ${pct(v.low)} to ${pct(v.high)}${v.costPerAction !== undefined ? `  cost per action ${money(v.costPerAction)}` : ''}`);
    lines.push(`${' '.repeat(w)}  ${verdictText(v)}`);
  }
  if (r.pairs.length) lines.push('', ...r.pairs.map(pairText));
  lines.push('', NOTE);
  return lines.join('\n');
}

const md = (s) => String(s).replace(/[|\\`*_[\]<>]/g, (c) => `\\${c}`);

export function toMarkdown(r) {
  const lines = ['# Demand test', '', `Success line ${pct(r.line)}, ${r.confidence}% confidence.`, '',
    '| Variant | Visitors | Actions | Rate | Range | Cost per action | Verdict |', '|---|---|---|---|---|---|---|'];
  for (const v of r.variants) lines.push(`| ${md(v.variant)} | ${v.visitors} | ${v.actions} | ${pct(v.rate)} | ${pct(v.low)} to ${pct(v.high)} | ${money(v.costPerAction)} | ${md(verdictText(v))} |`);
  if (r.pairs.length) lines.push('', '## Variants compared', '', ...r.pairs.map((p) => `- ${md(pairText(p))}`));
  lines.push('', md(NOTE));
  return lines.join('\n');
}

export function toJson(r) {
  return JSON.stringify({ ...r, note: NOTE }, null, 2);
}

const cell = (v) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(r) {
  const out = ['variant,visitors,actions,rate,low,high,verdict,more_visitors,cost_per_action'];
  for (const v of r.variants) {
    out.push([v.variant, v.visitors, v.actions, v.rate.toFixed(4), v.low.toFixed(4), v.high.toFixed(4), v.verdict, v.moreVisitors ?? '', money(v.costPerAction)].map(cell).join(','));
  }
  return out.join('\n');
}
