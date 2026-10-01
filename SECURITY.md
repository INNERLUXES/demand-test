# Security

## Reporting a problem

Write to info@innerluxes.dev with the subject line "demand-test security", or use private vulnerability reporting on this repository. Please do not open a public issue for a vulnerability.

Include a made-up results file that shows the problem, what you expected and what happened.

## Scope

In scope:

- input that passes validation but produces a wrong range, a wrong verdict or a wrong comparison
- input that makes the tool hang or use unbounded memory
- a CSV result that runs as a formula when opened in a spreadsheet
- anything that makes the tool open a network connection, or read or write a file it was not given

Out of scope: whether the visitors counted were the right audience; docs/limits.md lists what a demand test cannot tell.

Read [docs/threat-model.md](docs/threat-model.md) for the rest.
