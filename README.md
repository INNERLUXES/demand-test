# demand-test

Reads the results of a landing page or fake door test and says whether the idea passed.

A demand test asks real visitors to take a step, such as joining a waitlist, choosing a plan or pre-ordering, before the product exists. Before launch you wrote down a success line: the share of visitors who must act. After the test, this tool answers:

- For each variant, does the rate clear the line, fall below it, or is it too close to call?
- How sure is that answer? Every rate comes with a range.
- If it is too close to call, about how many more visitors would decide it?
- When there are several variants, which one is really ahead, and which differences are noise?
- What did each action cost, when the traffic cost is known?

Plain JavaScript, no dependencies. It reads the file you give it and fetches nothing.

```
npm test
```

```
# tests 10
# pass 10
# fail 0
```

## Quick start

Requires Node 22 or newer. There is nothing to install.

```
git clone https://github.com/INNERLUXES/demand-test.git
cd demand-test
npm run example
```

```
Demand test against a success line of 5.0%, 95% confidence

waitlist         51 of 640      8.0%  range 6.1% to 10.3%  cost per action 6.27
              passes: even the low end of the range is above the line
pricing-page     29 of 610      4.8%  range 3.3% to 6.7%  cost per action 10.52
              undecided: about 29780 more visitors needed if the rate holds
pre-order         4 of 180      2.2%  range 0.9% to 5.6%  cost per action 22.50
              undecided: about 77 more visitors needed if the rate holds

waitlist vs pricing-page: +3.2 points (0.5 to 6.0), waitlist is ahead
waitlist vs pre-order: +5.7 points (1.9 to 8.5), waitlist is ahead
pricing-page vs pre-order: +2.5 points (-1.1 to 4.9), no clear winner yet

Ranges are Wilson score intervals; differences use Newcombe's method. "Visitors needed" is an estimate that holds only if the rate stays where it is.
```

The numbers in `examples/results.csv` are made up. The success line is yours to set before launch; the tool has none built in.

## Your own results

`results.csv`, one variant per line:

| Column | |
|---|---|
| `variant` | a name for the page or version |
| `visitors` | people from the target audience who saw it |
| `actions` | those who took the action that counts |
| `cost` | optional: what the traffic for that variant cost |

[docs/method.md](docs/method.md) explains the ranges, the verdicts and the estimate of visitors still needed.

## Options

| Option | What it does |
|---|---|
| `--line <share>` | The success line, as `0.05` or `5%` (required) |
| `--confidence 90\|95\|99` | How sure each range must be (default 95) |
| `--format text\|markdown\|json\|csv` | CSV has one line per variant |
| `--output <file>` | Write the result to a file |
| `--fail-on-fail` | Exit 1 when a variant fails the line |

Exit codes: 0 done, 1 a variant failed with `--fail-on-fail`, 2 wrong usage or invalid input.

## Rules that keep the verdict honest

- A variant passes only when the low end of its range is above the line, and fails only when the high end is below it. Everything else is "undecided", never a quiet pass.
- A variant is "ahead" of another only when the range of the difference excludes zero.
- The visitors still needed are an estimate, and the report says so every time.
- [docs/limits.md](docs/limits.md) lists what a demand test cannot tell, starting with visitors who were not the target audience.

## As a library

```js
import { parseResults, analyse, toMarkdown } from './src/index.js';

const result = analyse(parseResults(csvText), { line: 0.05, confidence: 95 });
console.log(toMarkdown(result));
```

## How this repository is kept

- No runtime dependencies, a committed lock file, `npm ci` in the pipeline.
- Tests on Linux, Windows and macOS with Node 22 and 24, CodeQL, and repository checks for syntax, exports, credentials and leftovers.
- Every workflow sets its token permissions and pins every action to a full commit hash; Dependabot keeps them current.
- The pipeline checks the repository against NIST SP 800-218 with [ssdf-repo-check](https://github.com/INNERLUXES/ssdf-repo-check).
- Releases come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
- [SECURITY.md](SECURITY.md), [threat model](docs/threat-model.md), [secure defaults](docs/secure-defaults.md), [design decisions](docs/decisions).

## Related

Built by the team behind [landing page MVP development at INNERLUXES](https://innerluxes.dev/software-development/landing-page-mvp).

## License

MIT
