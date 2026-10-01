# Threat model

The tool reads the counts of a demand test and prints a verdict that may decide whether a product gets built. The risks are a verdict that is more certain than the data, and the data going where it should not.

| Threat | Response |
|---|---|
| A close result is read as a pass | A pass needs the whole range above the line; anything else is "undecided". |
| A small sample gives a confident-looking rate | Every rate is shown with its Wilson range, which widens with fewer visitors. |
| A lead between variants is noise | "Ahead" needs a difference range that excludes zero. |
| Counts from different sources are mixed | More actions than visitors is refused, and every bad row is named. |
| The line is moved after seeing the result | The line is a required input, meant to be written before launch; the tool has none of its own. |
| A variant name runs as a formula when the CSV is opened | Cells that start with a formula character are prefixed with an apostrophe. |
| The results leave the machine | The tool opens no network connection and writes a file only when `--output` is given. |

## Outside this model

- Whether the visitors were the target audience; docs/limits.md says why.
- A modified copy of the tool. Install from a release and check the attestation and checksums.
