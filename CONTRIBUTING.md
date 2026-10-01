# Contributing

Every change goes through a pull request and is reviewed before it is merged. The pipeline runs the tests on Linux, Windows and macOS, the repository checks, CodeQL, and a secure development check of the repository itself.

## Changing the statistics

1. Describe the change in docs/method.md first, with the name of the method and a reference.
2. Add a test against a published value, such as a textbook Wilson bound.
3. A variant passes or fails only when its whole range is on one side of the line.

## Rules for the code

- No runtime dependencies. Node 22 or newer and nothing else.
- The tool reads the file it is given and writes only when `--output` is given. It opens no network connection.
- No built-in success line. It is a required input.

## Before you open the pull request

```
npm test
npm run check
npm run example
```
