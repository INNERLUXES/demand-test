# 2. Wilson ranges, not the textbook interval

## Context

The interval most people learn, rate plus or minus z times the standard error, breaks down exactly where demand tests live: low rates and few actions. With 0 actions it gives a range of zero width, and with few actions it can reach below zero.

## Decision

- Ranges use the Wilson score interval; differences between variants use Newcombe's hybrid method built from it.
- The estimate of visitors still needed is found with the same Wilson interval, so the estimate and the verdict always agree.

## Consequences

- The numbers can differ slightly from an online calculator that uses the textbook interval; docs/method.md says which method is used.
