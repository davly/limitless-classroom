/**
 * Load-bearing SafeguardingOutcome enum for Limitless Classroom.
 *
 * The SafeguardingOutcome enum gates EVERY child-facing AI emission. It
 * is the single most load-bearing primitive in the flagship: the
 * `LessonPlanReceiptSigner.emitLessonPlanReceipt` + the parallel
 * pupil-worksheet entrypoint BOTH refuse to emit when the outcome is
 * anything other than FRESH_DFE.
 *
 * # The five canonical outcomes (closed-enum, R115 single-enum
 * # rejection-outcome)
 *
 *   1. FRESH_DFE             -- KCSiE in force is current. DfE GenAI
 *                                policy is the current published
 *                                version. Ofsted handbook is the
 *                                current 2024 publication. EYFS
 *                                framework (if Key Stage = EYFS) is
 *                                the current published version. EMIT
 *                                is permitted iff manifest entries are
 *                                also fresh.
 *
 *   2. KCSiE_STALE           -- the live KCSiE version in force at the
 *                                time of pupil contact has been
 *                                superseded since the school's DSL last
 *                                signed off on the safeguarding gate.
 *                                EMIT is REFUSED. The R143
 *                                CLASSROOM_KCSiE_STATUTORY_NOT_LIVE
 *                                advisory fires once on first refusal.
 *
 *   3. EYFS_STALE            -- the EYFS framework has been superseded
 *                                AND the Key Stage being targeted is
 *                                EYFS. (When Key Stage != EYFS, this
 *                                outcome would not be selected -- the
 *                                EYFS-specific predicate falls through
 *                                to FRESH_DFE.) EMIT is REFUSED.
 *
 *   4. OFSTED_VERSION_DRIFT  -- the Ofsted School Inspection Handbook
 *                                has been superseded since manifest
 *                                pinning. EMIT is REFUSED -- the
 *                                inspection-framework references in
 *                                manifest no longer match the version
 *                                inspectors would apply during an
 *                                Ofsted visit.
 *
 *   5. UNKNOWN               -- the SafeguardingOutcome could not be
 *                                determined (upstream school MIS
 *                                returned no posture, DSL has not yet
 *                                signed off, OR the freshness check
 *                                itself errored). EMIT is REFUSED by
 *                                default -- the closed-enum is
 *                                fail-closed.
 *
 * # Why this enum is load-bearing
 *
 * EVERY child-facing emit decision composes:
 *   (safeguardingOutcome === 'FRESH_DFE') AND
 *   (no manifest entry is stale) AND
 *   (signer is non-placeholder)
 *
 * If safeguardingOutcome is anything other than FRESH_DFE, emit refuses.
 * Compile-time exhaustiveness via the typed enum means a future cohort
 * port (Go / Python / Rust) checking for "all five branches handled"
 * via a switch-exhaustive guard SHOULD catch any added branch immediately.
 *
 * # Cohort-canonical compatibility
 *
 * This enum maps directly to the L43 / R151 cohort "outcome" closed
 * vocabulary in:
 *   - sage.eldercare R-AI-SURFACE-CITATION-GATE evidence-citation gate
 *   - arbiter mirror-mark audit-row R166 stamp
 *   - counsel R160 5-part env-gate
 *
 * The Classroom outcomes are domain-specific (KCSiE / EYFS / Ofsted)
 * but the CLOSED-ENUM SHAPE is identical: one PASS class, N FAIL
 * classes, one UNKNOWN / fail-closed default.
 */

/**
 * The 5-class closed-enum SafeguardingOutcome. R115 single-enum
 * rejection-outcome compliance: every reject path is a literal here,
 * not a free-string return.
 */
export type SafeguardingOutcome =
  | 'FRESH_DFE'
  | 'KCSiE_STALE'
  | 'EYFS_STALE'
  | 'OFSTED_VERSION_DRIFT'
  | 'UNKNOWN';

export const SAFEGUARDING_FRESH_DFE: SafeguardingOutcome = 'FRESH_DFE';
export const SAFEGUARDING_KCSIE_STALE: SafeguardingOutcome = 'KCSiE_STALE';
export const SAFEGUARDING_EYFS_STALE: SafeguardingOutcome = 'EYFS_STALE';
export const SAFEGUARDING_OFSTED_VERSION_DRIFT: SafeguardingOutcome = 'OFSTED_VERSION_DRIFT';
export const SAFEGUARDING_UNKNOWN: SafeguardingOutcome = 'UNKNOWN';

/** Canonical list of every outcome, in PASS-then-FAIL declaration order. */
export const ALL_SAFEGUARDING_OUTCOMES: ReadonlyArray<SafeguardingOutcome> = Object.freeze([
  SAFEGUARDING_FRESH_DFE,
  SAFEGUARDING_KCSIE_STALE,
  SAFEGUARDING_EYFS_STALE,
  SAFEGUARDING_OFSTED_VERSION_DRIFT,
  SAFEGUARDING_UNKNOWN,
]);

/** Pinned closed-enum cardinality for the cohort firewall test. */
export const SAFEGUARDING_OUTCOME_COUNT: number = 5;

/** Pinned FAIL-class cardinality for the cohort firewall test. */
export const SAFEGUARDING_FAIL_CLASS_COUNT: number = 4;

/** Returns true iff the outcome is the PASS class (FRESH_DFE). */
export function isPassOutcome(outcome: SafeguardingOutcome): boolean {
  return outcome === SAFEGUARDING_FRESH_DFE;
}

/** Returns true iff the outcome is one of the four FAIL classes. */
export function isFailOutcome(outcome: SafeguardingOutcome): boolean {
  return (
    outcome === SAFEGUARDING_KCSIE_STALE ||
    outcome === SAFEGUARDING_EYFS_STALE ||
    outcome === SAFEGUARDING_OFSTED_VERSION_DRIFT ||
    outcome === SAFEGUARDING_UNKNOWN
  );
}

/** Returns the four FAIL outcomes (excludes FRESH_DFE). */
export function failOutcomes(): ReadonlyArray<SafeguardingOutcome> {
  return Object.freeze([
    SAFEGUARDING_KCSIE_STALE,
    SAFEGUARDING_EYFS_STALE,
    SAFEGUARDING_OFSTED_VERSION_DRIFT,
    SAFEGUARDING_UNKNOWN,
  ]);
}

/**
 * Compile-time exhaustiveness guard. A future caller writing a switch
 * on SafeguardingOutcome should call `assertNever(outcome)` in the
 * default branch -- `tsc` will then refuse to compile if a new outcome
 * is added without a paired branch.
 */
export function assertNever(x: never): never {
  throw new Error(`Unhandled SafeguardingOutcome branch: ${String(x)}`);
}

/**
 * Human-readable explanation of a SafeguardingOutcome. Used by the
 * lore.ts audit-event renderer and by any operator-facing surface.
 */
export function explainOutcome(outcome: SafeguardingOutcome): string {
  switch (outcome) {
    case 'FRESH_DFE':
      return 'KCSiE in force is current; DfE GenAI policy current; Ofsted handbook current 2024; EYFS framework current (when targeting EYFS). EMIT permitted.';
    case 'KCSiE_STALE':
      return 'KCSiE statutory guidance in force has been superseded since the school DSL last signed off. EMIT refused.';
    case 'EYFS_STALE':
      return 'EYFS statutory framework has been superseded AND Key Stage is EYFS. EMIT refused.';
    case 'OFSTED_VERSION_DRIFT':
      return 'Ofsted School Inspection Handbook has been superseded since manifest pinning. EMIT refused.';
    case 'UNKNOWN':
      return 'SafeguardingOutcome could not be determined (DSL signoff missing, upstream MIS error, OR freshness check errored). EMIT refused (fail-closed default).';
    default:
      return assertNever(outcome);
  }
}

/**
 * Compose a SafeguardingOutcome from independent freshness predicates.
 * Order of precedence:
 *
 *   1. If KCSiE is stale -> KCSiE_STALE (always FIRST; safeguarding
 *      trumps inspection trumps EYFS).
 *   2. Else if Ofsted handbook drifted -> OFSTED_VERSION_DRIFT.
 *   3. Else if Key Stage targets EYFS AND EYFS framework is stale ->
 *      EYFS_STALE.
 *   4. Else if any one of the above is UNKNOWN-state -> UNKNOWN.
 *   5. Else -> FRESH_DFE.
 *
 * This composition is the single point where multi-source freshness
 * becomes a single closed-enum verdict.
 */
export function composeSafeguardingOutcome(input: {
  readonly kcsieStale: boolean | 'unknown';
  readonly ofstedHandbookDrift: boolean | 'unknown';
  readonly eyfsStale: boolean | 'unknown';
  readonly keyStageIsEYFS: boolean;
}): SafeguardingOutcome {
  // Any 'unknown' triggers UNKNOWN unless a stronger FAIL already fired
  // (the order-of-precedence ensures we still hit the matching FAIL).
  if (input.kcsieStale === true) return SAFEGUARDING_KCSIE_STALE;
  if (input.ofstedHandbookDrift === true) return SAFEGUARDING_OFSTED_VERSION_DRIFT;
  if (input.keyStageIsEYFS && input.eyfsStale === true) return SAFEGUARDING_EYFS_STALE;
  if (
    input.kcsieStale === 'unknown' ||
    input.ofstedHandbookDrift === 'unknown' ||
    (input.keyStageIsEYFS && input.eyfsStale === 'unknown')
  ) {
    return SAFEGUARDING_UNKNOWN;
  }
  return SAFEGUARDING_FRESH_DFE;
}
