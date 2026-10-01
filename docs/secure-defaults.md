# Secure defaults

| Setting | Default | Why |
|---|---|---|
| Bad rows | Stop and list every one | A dropped row changes a verdict without anyone knowing. |
| More actions than visitors | Refused | It means the counts came from different sources or filters. |
| Line inside the range | "undecided" | A close result must never read as a pass. |
| Confidence | 95 percent | A common level; 99 is available for tests that are checked often. |
| Success line | Required, none built in | The line is the founder's decision, written before launch. |
| Exit code | 0, unless `--fail-on-fail` is given | The tool reports by default; a pipeline decides whether a fail blocks it. |
| CSV cells | Formula characters prefixed with an apostrophe | Variant names are free text and must not run in a spreadsheet. |
| Network | Never used | Test results are business plans in numbers and stay on the machine. |
| Output | Terminal | Nothing is written to disk unless `--output` is given. |
