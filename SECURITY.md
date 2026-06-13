# SECURITY — limitless-classroom

UK education-compliance gate for AI-assisted classroom-content emission.
Every AI-assisted artefact that ever transits through Classroom to a child
carries a tamper-evident `lore@v1:...` receipt the school can show to Ofsted
or a DSL incident review months or years later.

## Reporting a vulnerability

Report suspected vulnerabilities privately to **david@vocala.co**. Please do
NOT open a public issue for a security report.

Include, where possible: the affected module (`src/*.ts`), a minimal
reproduction, the impact, and whether any child-facing safeguarding surface
(the `SafeguardingOutcome` gate, the Mirror-Mark receipt, or the R166
liability footer) is implicated. You will receive an acknowledgement; a
coordinated-disclosure window is agreed per report.

## Supported versions

This is a Phase-1 scaffold shipped as a **library only** (R176
LIBRARY-FIRST-WIRE-LATER): the Mirror-Mark stamp and safeguarding gate are
NOT yet wired to a child-facing emission endpoint in this repository. Only
the current `main` (latest commit) is supported for security fixes. There are
no tagged releases or back-ported branches at Phase-1.

## Phase-1 scope (load-bearing)

This deployment MUST NOT emit any pupil-facing AI artefact in production
without:

1. **Counsel review** — `REVIEWED_BY_COUNSEL = false` (`src/legal.ts`) is the
   R166 honest-default. Phase-1 founder-drafted mappings (Key Stage ↔ subject
   curriculum coverage, safeguarding-outcome literals, manifest freshness
   axes, advisory severity ladder) have NOT been reviewed by a qualified
   UK education-law solicitor.
2. **DPO + DSL signoff** — the school DPO MUST complete a UK GDPR Article 35
   DPIA for AI-assisted classroom-content emission, and the school DSL MUST
   sign off the KCSiE safeguarding gate against the live KCSiE version in
   force. See `LIBRARY_RECOMMENDS_HOST_ACTS` in `src/legal.ts` for the five
   named host acts.
3. **R143 advisory acknowledgement** — the 7 canonical `CLASSROOM_*`
   advisories in `src/honest.ts` (`fireAllCanonicalAdvisoriesOnce`) MUST be
   visible to every operator at boot. Three are `ERROR` severity
   (child-facing emit MUST NOT land until closed):
   `CLASSROOM_KCSiE_STATUTORY_NOT_LIVE`,
   `CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED`,
   `CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED`.
4. **Corpus-SHA cold-verification** — before any live receipt is trusted, the
   deployed lore corpus referenced by `CLASSROOM_LORE_CORPUS_SHA_PATH` MUST be
   cold-verified against the canonical `lore.tar.gz` re-hash. The default
   (32 zero bytes) and the default key
   (`iik_dev_CLASSROOM_NOT_FOR_PRODUCTION`) are placeholders that will NOT
   pass cold-verify; the `CLASSROOM_MIRRORMARK_PLACEHOLDER_BOOT` advisory
   fires while either is in use.

## R166 LIABILITY-FOOTER-CONST

The typed constant `LEGAL_LIABILITY_FOOTER` in `src/legal.ts` is the
founder-drafted escape phrase. It is grep-discoverable
(`grep -rn 'LEGAL_LIABILITY_FOOTER' src/`) and MUST NEVER be inlined as a
string literal at a call site. Every legal-bearing surface embeds it verbatim
until counsel review flips `REVIEWED_BY_COUNSEL` to `true` on its own R145.B
SIBLING-NOT-STACKED branch with a commit message naming the counsel + DPO +
DSL + date + scope + KCSiE/Ofsted/DfE versions in force at review time.

## SafeguardingOutcome gate (fail-closed)

The closed-enum `SafeguardingOutcome` in `src/safeguarding_gate.ts` gates
EVERY child-facing emit. Emit is permitted iff the outcome is `FRESH_DFE`
AND no manifest entry is stale AND the signer is non-placeholder. The other
four outcomes — `KCSiE_STALE`, `EYFS_STALE`, `OFSTED_VERSION_DRIFT`, and the
default `UNKNOWN` — all REFUSE emit. `UNKNOWN` is the fail-closed default when
posture cannot be determined.

## Mirror-Mark v1 tamper-evidence

Every receipt is signed with a Mirror-Mark v1 (`MARK_PREFIX = "lore@v1:"`,
an 8-byte corpus prefix followed by a 32-byte HMAC-SHA256 body over
`(markVersion || corpusSHA || payload)` keyed by an `iik_...` key). An Ofsted
inspector, DfE auditor, DSL, school DPO, or another LLM holding
`(corpus, payload, key)` can independently re-derive the mark. Drift in the
corpus SHA, payload, or key fails verification. Comparison is constant-time.
The Node `node:crypto` HMAC-SHA256 is byte-identical to the Go / Python /
Rust / C# / Java / Swift cohort siblings, so `lore-mark-verify` verifies
Classroom marks identically to every other L43 cohort member.

## Threat model — what this Phase-1 scaffold DOES NOT defend against

- **Compromised signing key** — no KMS / HSM integration in Phase-1; the
  `iik_...` key is read from `CLASSROOM_MIRRORMARK_KEY`. Anyone holding the
  key can mint valid-looking receipts. Protect the key out-of-band.
- **Compromised or unverified corpus** — Phase-1 uses placeholder corpus SHAs
  (default 32 zero bytes). A receipt only proves integrity relative to the
  corpus it was signed against; cold-verification against the canonical
  `lore.tar.gz` is the operator's responsibility.
- **Upstream age / consent verification** — Classroom does NOT verify pupil
  age or parental consent directly (`CLASSROOM_AGE_VERIFICATION_PLACEHOLDER`).
  The school MIS / parental-consent record under UK GDPR Article 8 is the
  source of truth, upstream of this library.
- **Special-category data handling** — UK GDPR Article 9 special-category
  pupil data (mental-health observations, racial-ethnic origin in
  cultural-curriculum context, religion) MAY transit AI surfaces
  (`CLASSROOM_ARTICLE_9_SPECIAL_CATEGORY`). The school DPO is the Article 6 +
  Article 9 controller; Classroom is a processor under Article 28 and does
  not select a lawful basis.
- **Stale statutory ground-truth** — the live KCSiE / Ofsted handbook / DfE
  GenAI policy / EYFS framework version in force at the time of pupil contact
  is the ground truth, NOT any snapshot baked into this software. The gate
  refuses on detected drift but cannot itself fetch the live version.
- **Side-channel timing attacks** on base64 decode or mark-prefix compare.

## See also

- `src/legal.ts` — R166 liability footer, `REVIEWED_BY_COUNSEL`, 10 legal
  citations, `LIBRARY_RECOMMENDS_HOST_ACTS`.
- `src/honest.ts` — the 7 canonical R143 LOUD-ONCE-WARN advisories.
- `src/safeguarding_gate.ts` — the 5-class `SafeguardingOutcome` enum.
- `src/mirrormark.ts` / `src/lore.ts` — Mirror-Mark v1 + receipt signer.
- `CONTEXT.md` — per-surface boundary notes referenced by each advisory.
