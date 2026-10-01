// Command line: demand-test --results results.csv --line 5% [--confidence 90|95|99]
//               [--format text|markdown|json|csv] [--output file] [--fail-on-fail]

import { readFile, writeFile } from 'node:fs/promises';
import { parseResults, parseLine } from './input.js';
import { analyse, failed } from './stats.js';
import { toText, toMarkdown, toJson, toCsv } from './report.js';

export const USAGE = `demand-test --results <results.csv> --line <share> [options]

Reads the results of a landing page or fake door test and says, for each variant, whether it passes the success line
written before launch, fails it, or is still undecided, with a range around every rate and the visitors still needed.
Two or more variants are compared with each other. It reads the file you give it and fetches nothing.

Options
  --results <file>        CSV with columns variant, visitors, actions, and optional cost (required)
  --line <share>          the success line, as 0.05 or 5% (required)
  --confidence <n>        90, 95 (default) or 99
  --format <f>            text (default), markdown, json or csv
  --output <file>         write the result to a file
  --fail-on-fail          exit 1 when a variant fails the line
  --help                  this text

Exit codes: 0 done, 1 a variant failed with --fail-on-fail, 2 wrong usage or invalid input.`;

export function parseArgs(argv) {
  const o = { format: 'text', confidence: 95, failOnFail: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { o.help = true; continue; }
    if (a === '--fail-on-fail') { o.failOnFail = true; continue; }
    if (!['--results', '--line', '--confidence', '--format', '--output'].includes(a)) throw new Error(`unknown option: ${a}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`${a} needs a value`);
    o[a.slice(2)] = argv[++i];
  }
  if (o.help) return o;
  if (!o.results || o.line === undefined) throw new Error('--results and --line are required');
  o.line = parseLine(o.line);
  o.confidence = Number(o.confidence);
  if (![90, 95, 99].includes(o.confidence)) throw new Error('--confidence takes 90, 95 or 99');
  if (!['text', 'markdown', 'json', 'csv'].includes(o.format)) throw new Error(`unknown format: ${o.format}`);
  return o;
}

export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  let o, result;
  try {
    o = parseArgs(argv);
    if (o.help) { stdout.write(`${USAGE}\n`); return 0; }
    let text;
    try {
      text = await readFile(o.results, 'utf8');
    } catch (err) {
      throw new Error(`cannot read ${o.results}: ${err.message}`);
    }
    result = analyse(parseResults(text), { line: o.line, confidence: o.confidence });
  } catch (err) {
    stderr.write(`${err.message}\n\n${USAGE}\n`);
    return 2;
  }
  const out = o.format === 'json' ? toJson(result) : o.format === 'csv' ? toCsv(result)
    : o.format === 'markdown' ? toMarkdown(result) : toText(result);
  if (o.output) await writeFile(o.output, `${out}\n`);
  else stdout.write(`${out}\n`);
  if (o.failOnFail && failed(result).length) {
    stderr.write(`${failed(result).length} variant(s) failed the line: ${failed(result).map((v) => v.variant).join(', ')}\n`);
    return 1;
  }
  return 0;
}
