# Limitless Classroom

UK education-compliance gate for AI-assisted classroom-content emission.

Every AI-assisted artefact that ever transits through Classroom to a
child carries a tamper-evident `lore@v1:...` receipt the school can
show to Ofsted months or years later. Refuses to emit when the
SafeguardingOutcome is anything other than `FRESH_DFE`.

## Status

LIBRARY SHIPPED. Wire-in to a child-facing emission path is deferred to
a separate behaviour-changing branch per R145.B SIBLING-NOT-STACKED.

`REVIEWED_BY_COUNSEL = false` -- this library is NOT legal advice; the
school MUST engage qualified UK education-law counsel + DPO + DSL
before any pupil-facing emission. See `src/legal.ts` for the full
liability footer.

## Substrate

- TypeScript >= 5.3
- Node.js >= 20 (uses `node:crypto` only)
- Zero runtime dependencies. `vitest` + `@types/node` + `typescript`
  as the only dev-time dependencies.

## Modules (R174 5-of-5 cohort maturity from inception)

```
src/
  mirrormark.ts        — L43 Mirror-Mark v1 byte-identical port
  honest.ts            — R143 LOUD-ONCE-WARN advisories (7 canonical)
  legal.ts             — R166 LIABILITY-FOOTER-CONST + 10 citations
  manifest.ts          — R150 schematised-knowledge (curriculum × subject)
  safeguarding_gate.ts — 5-class SafeguardingOutcome enum (load-bearing)
  lore.ts              — R-AI-SURFACE-CITATION-GATE Profile-B
  firewall.ts          — R145.C KAT-1/6/7 + structural pin
```

## Usage

```typescript
import { MirrorMarker, canonicalLessonPlanReceiptPayload } from 'limitless-classroom/src/mirrormark';
import { LessonPlanReceiptSigner, summariseResult } from 'limitless-classroom/src/lore';
import { composeSafeguardingOutcome } from 'limitless-classroom/src/safeguarding_gate';
import { CLASSROOM_MANIFEST, entriesByCurriculumVersion } from 'limitless-classroom/src/manifest';

const marker = MirrorMarker.fromEnv(); // reads CLASSROOM_* env vars

const signer = new LessonPlanReceiptSigner({
  corpusSha: marker.corpusSha,
  key: marker.key,
  usingPlaceholderCorpus: marker.usingPlaceholderCorpus,
  usingPlaceholderKey: marker.usingPlaceholderKey,
});

// Compose the safeguarding outcome from upstream freshness predicates.
const outcome = composeSafeguardingOutcome({
  kcsieStale: false,         // DSL signoff fresh
  ofstedHandbookDrift: false, // Manifest pinned to current Ofsted handbook
  eyfsStale: false,
  keyStageIsEYFS: false,
});

// Run the Profile-B citation gate.
const result = signer.emitLessonPlanReceipt({
  lessonId: 'lp-2026-y4-maths-3',
  keyStage: 'KS2',
  subject: 'Maths',
  curriculumVersion: 'KS2',
  teacherId: 'teacher@school.example',
  generatedAtUnixMs: Date.now(),
  safeguardingOutcome: outcome,
  relevantManifestEntries: entriesByCurriculumVersion('KS2'),
});

console.log(summariseResult(result));
// EMIT outcome=FRESH_DFE mark=lore@v1:... at=...
// OR
// REFUSE reason=SAFEGUARDING_FAIL outcome=KCSiE_STALE staleEntries=... advisory=CLASSROOM_KCSiE_STATUTORY_NOT_LIVE
```

## Testing

```bash
npm install
npm test
```

Test suite includes:
- KAT-1 hex pin (cohort invariance)
- KAT-6 + KAT-7 mark literals (cohort invariance)
- All 5 SafeguardingOutcome branches (PASS + 4 FAIL)
- All 5 RefusalReason branches
- 9 IsStale sentinel paths
- 7 canonical R143 advisories
- 10 LEGAL_CITATIONS rows
- Structural firewall (on-disk module layout)

50+ tests across 7 test files.

## Configuration

| Env var | Default | Purpose |
|---------|---------|---------|
| `CLASSROOM_LORE_CORPUS_SHA_PATH` | (unset → 32 zero bytes) | Path to 32-byte file (raw or hex) holding canonical lore corpus SHA |
| `CLASSROOM_MIRRORMARK_KEY` | `iik_dev_CLASSROOM_NOT_FOR_PRODUCTION` | Production `iik_...` HMAC key |
| `CLASSROOM_BOOT_QUIET` | `false` | Set to `1` or `true` to silence boot-time canonical advisory emit |

## Compliance disclosure

This library is not legal advice. The school / MAT / LA is responsible
for:

1. Qualified UK education-law counsel review of all safeguarding /
   data-protection / age-gating / curriculum surfaces BEFORE any
   pupil-facing emission.
2. School DPO completes UK GDPR Article 35 DPIA.
3. School DSL signs off the KCSiE safeguarding gate against the live
   KCSiE version in force.
4. Privacy notice + parent-facing AI usage disclosure updated.
5. Flip `REVIEWED_BY_COUNSEL` to `true` on its own R145.B
   SIBLING-NOT-STACKED branch.

See `src/legal.ts` `LIBRARY_RECOMMENDS_HOST_ACTS` for the full named
host-acts list.

## License

Apache-2.0. See `LICENSE`.
