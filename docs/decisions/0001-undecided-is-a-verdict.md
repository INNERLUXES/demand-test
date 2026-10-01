# 1. Undecided is a verdict of its own

## Context

A tool that compares a rate with a line can always say pass or fail: 4.8 percent is below 5 percent. With a few hundred visitors, that comparison is mostly noise, and a founder may stop or build a product on it.

## Decision

- A variant passes only when the low end of its Wilson range is above the line, and fails only when the high end is below it.
- Every other result is "undecided", with an estimate of the visitors that would decide it.

## Consequences

- Small tests often end undecided. That is the honest result, and the estimate says what it would take to get a real one.
