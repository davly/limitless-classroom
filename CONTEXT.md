# Limitless Classroom — Context

## What Classroom is

Limitless Classroom is the UK education-compliance gate for AI-assisted
classroom-content emission. Every lesson plan, pupil-facing worksheet,
teacher-facing material, or safeguarding-gate receipt that ever transits
through an AI surface to a child SHOULD pass through Classroom's
five-class SafeguardingOutcome enum + R150 manifest-freshness predicate
+ L43 Mirror-Mark v1 stamp. The output is a tamper-evident receipt the
school can show to Ofsted months or years later.

## Substrate

TypeScript + Node.js >= 20, pure stdlib (`node:crypto` only). Zero
runtime dependencies. `vitest` + `typescript` as the only dev-time
dependencies.

## Cohort position (R151 KAT-1 + L43 Mirror-Mark v1)

Third TypeScript R151 consumer, after `graphql-forge` and `Conjure`.
Joins the broader L43 Mirror-Mark v1 cohort across ~38 substrate
languages (Go / Kotlin KMM / C# / Rust / Python / Java / Ruby / Swift /
Zig / Elixir / Erlang / OCaml / Haskell / Racket / Idris / Solidity /
Dart / Perl / F# / Befunge-93 / Prolog / Scala 3 / and others).

R174 5-of-5 cohort maturity from inception (6 dedicated cohort packages
from day 1: mirrormark / honest / legal / manifest / safeguarding_gate
/ lore / firewall). Conjure was the first SaaS-flagship to ship at R174
5-of-5 from inception; Classroom is the first **regulated-domain**
flagship to ship the same way.

## Modules

| Module | Cohort R-rule | Purpose |
|--------|---------------|---------|
| `src/mirrormark.ts`        | L43 + R151 | Mirror-Mark v1 byte-identical port. `sign` / `verify` / KAT-1 hex pin. |
| `src/honest.ts`            | R143 / R143.A | Loud-once-warning-flag advisories (7 canonical). |
| `src/legal.ts`             | R166 | Liability footer constant + 10 citations + `REVIEWED_BY_COUNSEL = false`. |
| `src/manifest.ts`          | R150 | 5-field schematised-knowledge envelope + 9-path IsStale taxonomy + curriculum × subject axis. |
| `src/safeguarding_gate.ts` | R115 / cohort gate | 5-class SafeguardingOutcome enum (FRESH_DFE / KCSiE_STALE / EYFS_STALE / OFSTED_VERSION_DRIFT / UNKNOWN). |
| `src/lore.ts`              | R-AI-SURFACE-CITATION-GATE Profile-B | `LessonPlanReceiptSigner` + `CitationGate` composition. |
| `src/firewall.ts`          | R145.C | KAT-1 / KAT-6 / KAT-7 cohort parity asserts + structural module-layout scan. |

## Compliance posture

### Ofsted handbook reference
Citation-only against the Ofsted School Inspection Handbook 2024. The
live version in force at the time of inspection is the ground truth.
`LEGAL_CITATIONS` row #1 + `CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED`
R143 advisory. `REVIEWED_BY_COUNSEL = false`.

### DfE GenAI policy reference
Citation-only against the DfE "Generative artificial intelligence (AI)
in education" policy paper (March 2023, updated October 2023, with
2024-2025 incremental updates). `LEGAL_CITATIONS` row #2 +
`CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED` R143 advisory.

### KCSiE statutory gate
The live KCSiE version in force at the time of pupil contact is the
ground truth, NOT a hardcoded snapshot. `CLASSROOM_KCSiE_STATUTORY_NOT_LIVE`
fires as a SEVERITY_ERROR at boot until the school's DSL has signed off.
`LEGAL_CITATIONS` row #3.

### EYFS framework reference
Anchored to the EYFS statutory framework version-axis but NOT counsel-
reviewed. `CLASSROOM_EYFS_FRAMEWORK_NOT_REVIEWED` R143 advisory.

### Age verification boundary
Classroom does NOT verify pupil age directly. The upstream school MIS /
parental-consent record is the source of truth. `CLASSROOM_AGE_VERIFICATION_PLACEHOLDER`
R143 advisory at SEVERITY_WARN.

### Article 9 boundary
UK GDPR Article 9 special-category data (pupil mental-health, racial-
ethnic origin in cultural-curriculum context, religion) MAY transit
through AI surfaces. School DPO is the controller under Article 6 +
Article 9; Classroom is a processor under Article 28.
`CLASSROOM_ARTICLE_9_SPECIAL_CATEGORY` R143 advisory at SEVERITY_INFO.

### Mirror-Mark configuration
Set `CLASSROOM_LORE_CORPUS_SHA_PATH` to a path containing the canonical
lore corpus SHA (raw 32 bytes OR 64-char hex). Set `CLASSROOM_MIRRORMARK_KEY`
to the production `iik_...` HMAC key. Until both env-vars are wired,
emitted marks WILL NOT pass cold-verify against a real lore corpus.
`CLASSROOM_MIRRORMARK_PLACEHOLDER_BOOT` R143 advisory at SEVERITY_INFO.

## R155 verdict-requires-commit-SHA-and-test-receipt

Status at inception (I42 ship, 2026-05-28):
- **LIBRARY SHIPPED:** all 7 modules + test suite (>=50 tests) GREEN.
- **WIRE-IN DEFERRED:** the Mirror-Mark stamp is not yet on a child-
  facing emission path inside a separate web/UI / SvelteKit surface;
  per R176 LIBRARY-FIRST-WIRE-LATER, wire-in lands on a separate
  branch with paired tests.

## Cross-substrate parity

All three KAT literals (KAT-1 hex, KAT-6 mark, KAT-7 mark) are byte-
identical to every cohort sibling. Single grep across the ecosystem
for `239a7d0d3f1bbe3a98aede01e2ad818c2db60b7177c02e2f015035b2b5b7dbca`
finds every L43 + R151 site, including this one. Drift here = Classroom
has fallen out of the cohort.
