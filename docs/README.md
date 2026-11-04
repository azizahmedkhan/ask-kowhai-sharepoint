# Ask Kowhai documentation

## Implementation and operations

Start with the [project README](../README.md) for source configuration, Entra setup,
local debugging, tests, and packaging. A successful build and five mocked
unit tests were recorded during implementation; live agent responses, current
tenant grants, and billing coverage still need independent verification.

## Comprehensive architecture

These versions include the application flow and an additional administration,
setup, and local-testing layer:

- [Editable SVG](Ask%20Kowhai%20architecture%20-%20comprehensive.svg)
- [High-resolution PNG](Ask%20Kowhai%20architecture%20-%20comprehensive.png)

## Handover guide

- [Read the reproduction and handover guide (Markdown)](Ask%20Kowhai.md)
- [Download the unchanged Word original](reference/Ask%20Kowhai.docx)

The Markdown version preserves the original guide's text, headings, lists, and tables.

## Supplied reference files

The following files were copied unchanged from the supplied Downloads files:

- [Ask Kowhai reproduction and handover guide (Word)](reference/Ask%20Kowhai.docx)
- [Original architecture (SVG)](reference/Ask%20Kowhai%20architecture.svg)
- [Original architecture (PNG)](reference/Ask%20Kowhai%20architecture.png)
- [Additional supplied diagram, AskKowahi1 (SVG)](reference/AskKowahi1.svg)

The Word guide preserves earlier setup and troubleshooting history, including
reported environments, subscriptions, budgets, and billing attempts. Those
records are evidence of reported work, not confirmation of current portal state.
Its historical SDK/harness discussion should be checked against the pinned SDK
and current Microsoft guidance. The current code uses an authenticated SDK client,
not the original iframe. Keep original references when comparing revisions.
