// The statistics. docs/method.md says the same in words; a change here changes that page too.

export const Z = { 90: 1.6448536269514722, 95: 1.959963984540054, 99: 2.5758293035489004 };

// Wilson score interval for a share: actions out of visitors. Unlike the plain "p plus or minus" interval it stays inside
// 0 to 1 and behaves well with few actions, which is exactly where landing page tests live.
export function wilson(actions, visitors, z) {
  if (visitors === 0) return { low: 0, high: 1 };
  const p = actions / visitors;
  const z2 = z * z;
  const den = 1 + z2 / visitors;
  const mid = (p + z2 / (2 * visitors)) / den;
  const half = (z * Math.sqrt((p * (1 - p)) / visitors + z2 / (4 * visitors * visitors))) / den;
  return { low: Math.max(0, mid - half), high: Math.min(1, mid + half) };
}

// About how many visitors in total the test needs before the Wilson interval clears the line, if the rate stays where
// it is: the smallest total, found by doubling and then halving, at which the same rate would pass or fail.
// Null when the rate sits on the line: then no number of visitors decides it.
export function visitorsNeeded(rate, line, z, from = 1) {
  if (rate === line) return null;
  const decided = (n) => {
    const w = wilson(Math.round(rate * n), n, z);
    return w.low > line || w.high < line;
  };
  let hi = Math.max(1, from);
  while (!decided(hi)) {
    hi *= 2;
    if (hi > 1e9) return null;
  }
  let lo = Math.max(1, Math.floor(hi / 2));
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (decided(mid)) hi = mid; else lo = mid + 1;
  }
  return hi;
}

// Newcombe's hybrid score interval for the difference of two shares (a minus b), built from the two Wilson intervals.
export function difference(a, b, z) {
  const pa = a.actions / a.visitors;
  const pb = b.actions / b.visitors;
  const wa = wilson(a.actions, a.visitors, z);
  const wb = wilson(b.actions, b.visitors, z);
  const d = pa - pb;
  return {
    diff: d,
    low: d - Math.sqrt((pa - wa.low) ** 2 + (wb.high - pb) ** 2),
    high: d + Math.sqrt((wa.high - pa) ** 2 + (pb - wb.low) ** 2)
  };
}

// One verdict per variant against the success line written before launch.
export function judge(variant, line, z) {
  const rate = variant.visitors ? variant.actions / variant.visitors : 0;
  const ci = wilson(variant.actions, variant.visitors, z);
  let verdict;
  if (ci.low > line) verdict = 'passes';
  else if (ci.high < line) verdict = 'fails';
  else verdict = 'undecided';
  const needed = verdict === 'undecided' ? visitorsNeeded(rate, line, z, variant.visitors) : null;
  return {
    ...variant,
    rate,
    low: ci.low,
    high: ci.high,
    verdict,
    moreVisitors: needed === null ? null : Math.max(0, needed - variant.visitors),
    costPerAction: variant.cost === undefined ? undefined : variant.actions ? variant.cost / variant.actions : null
  };
}

export function analyse(variants, { line, confidence = 95 }) {
  const z = Z[confidence];
  const judged = variants.map((v) => judge(v, line, z));
  const pairs = [];
  for (let i = 0; i < judged.length; i++) {
    for (let j = i + 1; j < judged.length; j++) {
      const d = difference(judged[i], judged[j], z);
      const lead = d.low > 0 ? judged[i].variant : d.high < 0 ? judged[j].variant : null;
      pairs.push({ a: judged[i].variant, b: judged[j].variant, ...d, lead });
    }
  }
  return { line, confidence, variants: judged, pairs };
}

export function failed(result) {
  return result.variants.filter((v) => v.verdict === 'fails');
}
