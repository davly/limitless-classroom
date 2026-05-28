/**
 * R-AI-SURFACE-CITATION-GATE Profile-B composition for Limitless Classroom.
 *
 * Profile-B (cohort-canonical, sage.eldercare / arbiter / counsel / etc.)
 * binds three primitives at one surface:
 *
 *   1. A `CitationGate` that runs (a) the R150 IsStale predicate on the
 *      underlying knowledge-bedrock row AND (b) the R143 LOUD-ONCE-WARN
 *      flag on first refusal of the process.
 *
 *   2. A `LessonPlanReceiptSigner` that wraps the L43 Mirror-Mark v1
 *      signer with a typed payload shape (lesson_id / key_stage /
 *      subject / curriculum_version / teacher_id / generated_at_unix_ms
 *      / safeguarding_outcome) so the call site cannot accidentally
 *      omit a field. Refuses to emit when SafeguardingOutcome is one
 *      of the four FAIL classes (KCSiE_STALE / EYFS_STALE /
 *      OFSTED_VERSION_DRIFT / UNKNOWN); a successful emit ONLY happens
 *      on FRESH_DFE.
 *
 *   3. An `AuditEvent` shape that records every emit attempt (success
 *      OR refusal) for downstream observability. DSL / DPO / Ofsted
 *      inspector reading the audit log sees the entire decision chain.
 *
 * # Why Profile-B specifically
 *
 * Profile-A (the lighter sibling) gates citations on the IsStale
 * predicate alone. Profile-B additionally gates on the SafeguardingOutcome
 * enum -- meaning a Classroom emit refuses NOT JUST when the curriculum
 * map is stale, but ALSO when the safeguarding posture is anything other
 * than FRESH_DFE. This composition is mandatory for any child-facing
 * surface where a "stale but might be fine" emission is unsafe.
 *
 * # R145.B SIBLING-NOT-STACKED
 *
 * This module is pure-additive: it imports the mirrormark / honest /
 * safeguarding_gate / manifest / legal modules but does NOT modify any
 * of them. The CitationGate sits in front of MirrorMark.sign; it does
 * NOT replace it.
 */

import { sign as mirrorMarkSign, canonicalLessonPlanReceiptPayload, canonicalPupilWorksheetReceiptPayload } from './mirrormark.js';
import { isStale, type Entry } from './manifest.js';
import { SafeguardingOutcome, isFailOutcome, isPassOutcome } from './safeguarding_gate.js';
import {
  loudOnce,
  CLASSROOM_KCSiE_STATUTORY_NOT_LIVE,
  CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED,
  CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED,
  CLASSROOM_EYFS_FRAMEWORK_NOT_REVIEWED,
  type Advisory,
} from './honest.js';

// ---------------------------------------------------------------------------
// Citation receipt + refusal shape.
// ---------------------------------------------------------------------------

/**
 * CitationReceipt is the success-path artefact: the per-row Mirror-Mark
 * stamp + the original payload bytes used for HMAC computation. Returned
 * to the caller iff (a) the manifest row is fresh AND (b) the
 * SafeguardingOutcome is FRESH_DFE.
 */
export interface CitationReceipt {
  readonly kind: 'receipt';
  readonly mark: string;
  readonly payload: Buffer;
  readonly safeguardingOutcome: SafeguardingOutcome;
  readonly emittedAtUnixMs: number;
}

/**
 * CitationRefusal is the refusal-path artefact. Carries the typed
 * refusal reason (PASS_THROUGH covers a SafeguardingOutcome that is
 * literally not in the closed enum). Caller MUST surface this to the
 * teacher / DSL / audit log; emit MUST NOT bypass.
 */
export interface CitationRefusal {
  readonly kind: 'refusal';
  readonly reason: RefusalReason;
  readonly safeguardingOutcome: SafeguardingOutcome;
  readonly staleManifestEntries: ReadonlyArray<Entry>;
  readonly refusedAtUnixMs: number;
  readonly advisoryCode: string;
}

export type CitationResult = CitationReceipt | CitationRefusal;

/**
 * Closed enum of refusal reasons. R115 single-enum rejection-outcome.
 */
export type RefusalReason =
  | 'SAFEGUARDING_FAIL'
  | 'MANIFEST_STALE'
  | 'SAFEGUARDING_AND_MANIFEST_BOTH_FAIL'
  | 'PLACEHOLDER_CORPUS_OR_KEY'
  | 'PASS_THROUGH';

export const REFUSAL_SAFEGUARDING_FAIL: RefusalReason = 'SAFEGUARDING_FAIL';
export const REFUSAL_MANIFEST_STALE: RefusalReason = 'MANIFEST_STALE';
export const REFUSAL_BOTH_FAIL: RefusalReason = 'SAFEGUARDING_AND_MANIFEST_BOTH_FAIL';
export const REFUSAL_PLACEHOLDER: RefusalReason = 'PLACEHOLDER_CORPUS_OR_KEY';
export const REFUSAL_PASS_THROUGH: RefusalReason = 'PASS_THROUGH';

/** Pinned closed-enum cardinality for the cohort firewall. */
export const REFUSAL_REASON_COUNT: number = 5;

// ---------------------------------------------------------------------------
// AuditEvent shape -- one row per emit attempt.
// ---------------------------------------------------------------------------

/**
 * AuditEvent is the structured row written to the DSL / DPO / Ofsted
 * inspection-ready audit log on every emit attempt (success OR refusal).
 *
 * The fields are deliberately verbose: any inspector reading a row
 * months later should be able to reconstruct the exact safeguarding +
 * manifest posture without re-running the pipeline.
 */
export interface AuditEvent {
  readonly kind: 'audit_event';
  readonly outcome: 'EMIT' | 'REFUSE' | 'PLACEHOLDER_WARN';
  readonly safeguardingOutcome: SafeguardingOutcome;
  readonly refusalReason: RefusalReason | null;
  readonly lessonId: string;
  readonly teacherId: string;
  readonly keyStage: string;
  readonly subject: string;
  readonly curriculumVersion: string;
  readonly atUnixMs: number;
  readonly mark: string | null;
  readonly staleManifestKeys: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------------
// LessonPlanReceiptSigner -- per-process signer holding (corpus, key).
// ---------------------------------------------------------------------------

/**
 * LessonPlanReceiptSigner wraps mirrormark.sign with typed payloads and a
 * Profile-B gate. Holds (corpusSha, key) immutably across the process.
 */
export class LessonPlanReceiptSigner {
  readonly corpusSha: Buffer;
  readonly key: Buffer;
  readonly usingPlaceholderCorpus: boolean;
  readonly usingPlaceholderKey: boolean;

  // R143 LOUD-ONCE-WARN state for first refusal of the process.
  #refusedOnce: boolean = false;

  constructor(opts: {
    corpusSha: Buffer;
    key: Buffer;
    usingPlaceholderCorpus?: boolean;
    usingPlaceholderKey?: boolean;
  }) {
    if (opts.corpusSha.length !== 32) {
      throw new Error(`corpusSha must be 32 bytes; got ${opts.corpusSha.length}`);
    }
    this.corpusSha = opts.corpusSha;
    this.key = opts.key;
    this.usingPlaceholderCorpus = opts.usingPlaceholderCorpus ?? false;
    this.usingPlaceholderKey = opts.usingPlaceholderKey ?? false;
  }

  /**
   * Returns true if either corpus or key is placeholder. Production
   * code SHOULD refuse to call sign-paths from a placeholder signer.
   */
  usingPlaceholders(): { corpus: boolean; key: boolean } {
    return {
      corpus: this.usingPlaceholderCorpus,
      key: this.usingPlaceholderKey,
    };
  }

  /**
   * Gated lesson-plan-receipt emit. Profile-B gate runs in order:
   *
   *   1. If safeguardingOutcome is one of the four FAIL classes ->
   *      refuse with REFUSAL_SAFEGUARDING_FAIL. Fire the matching
   *      R143 advisory ONCE per process via the supplied sink.
   *   2. If any manifest entry is stale -> refuse with
   *      REFUSAL_MANIFEST_STALE.
   *   3. Both stale + fail-outcome -> refuse with REFUSAL_BOTH_FAIL.
   *   4. If signer is placeholder-mode -> refuse with
   *      REFUSAL_PLACEHOLDER (emit is technically syntactically valid
   *      but the cold-verify chain would fail).
   *   5. Otherwise -> sign + return CitationReceipt.
   *
   * The refusal+ refusal-reason CASE ORDERING matters: SAFEGUARDING
   * is FIRST so a teacher sees the safeguarding rejection even when
   * the manifest is also stale; both are mentioned in REFUSAL_BOTH_FAIL
   * when both conditions hold.
   */
  emitLessonPlanReceipt(opts: {
    lessonId: string;
    keyStage: string;
    subject: string;
    curriculumVersion: string;
    teacherId: string;
    generatedAtUnixMs: number;
    safeguardingOutcome: SafeguardingOutcome;
    relevantManifestEntries: ReadonlyArray<Entry>;
    sink?: (line: string) => void;
  }): CitationResult {
    const sink = opts.sink;
    const failing = isFailOutcome(opts.safeguardingOutcome);
    const staleEntries = opts.relevantManifestEntries.filter(isStale);
    const manifestStale = staleEntries.length > 0;

    if (failing && manifestStale) {
      this.#fireFirstRefusal(opts.safeguardingOutcome, sink);
      return {
        kind: 'refusal',
        reason: REFUSAL_BOTH_FAIL,
        safeguardingOutcome: opts.safeguardingOutcome,
        staleManifestEntries: staleEntries,
        refusedAtUnixMs: opts.generatedAtUnixMs,
        advisoryCode: this.#advisoryCodeFor(opts.safeguardingOutcome),
      };
    }
    if (failing) {
      this.#fireFirstRefusal(opts.safeguardingOutcome, sink);
      return {
        kind: 'refusal',
        reason: REFUSAL_SAFEGUARDING_FAIL,
        safeguardingOutcome: opts.safeguardingOutcome,
        staleManifestEntries: [],
        refusedAtUnixMs: opts.generatedAtUnixMs,
        advisoryCode: this.#advisoryCodeFor(opts.safeguardingOutcome),
      };
    }
    if (manifestStale) {
      return {
        kind: 'refusal',
        reason: REFUSAL_MANIFEST_STALE,
        safeguardingOutcome: opts.safeguardingOutcome,
        staleManifestEntries: staleEntries,
        refusedAtUnixMs: opts.generatedAtUnixMs,
        advisoryCode: 'CLASSROOM_MANIFEST_STALE',
      };
    }
    if (this.usingPlaceholderCorpus || this.usingPlaceholderKey) {
      return {
        kind: 'refusal',
        reason: REFUSAL_PLACEHOLDER,
        safeguardingOutcome: opts.safeguardingOutcome,
        staleManifestEntries: [],
        refusedAtUnixMs: opts.generatedAtUnixMs,
        advisoryCode: 'CLASSROOM_MIRRORMARK_PLACEHOLDER_BOOT',
      };
    }
    // Success path: safeguardingOutcome === FRESH_DFE, manifest is fresh,
    // signer is non-placeholder.
    const payload = canonicalLessonPlanReceiptPayload({
      lessonId: opts.lessonId,
      keyStage: opts.keyStage,
      subject: opts.subject,
      curriculumVersion: opts.curriculumVersion,
      teacherId: opts.teacherId,
      generatedAtUnixMs: opts.generatedAtUnixMs,
      safeguardingOutcome: opts.safeguardingOutcome,
    });
    const mark = mirrorMarkSign(this.corpusSha, payload, this.key);
    return {
      kind: 'receipt',
      mark,
      payload,
      safeguardingOutcome: opts.safeguardingOutcome,
      emittedAtUnixMs: opts.generatedAtUnixMs,
    };
  }

  /**
   * Pupil-worksheet sibling of `emitLessonPlanReceipt`. Identical gate
   * order; smaller canonical payload (the worksheet is what the pupil
   * actually receives, so the lesson context is referenced by id only).
   */
  emitPupilWorksheetReceipt(opts: {
    worksheetId: string;
    lessonId: string;
    keyStage: string;
    contentHash: string;
    emittedAtUnixMs: number;
    safeguardingOutcome: SafeguardingOutcome;
    relevantManifestEntries: ReadonlyArray<Entry>;
    sink?: (line: string) => void;
  }): CitationResult {
    const sink = opts.sink;
    const failing = isFailOutcome(opts.safeguardingOutcome);
    const staleEntries = opts.relevantManifestEntries.filter(isStale);
    const manifestStale = staleEntries.length > 0;

    if (failing && manifestStale) {
      this.#fireFirstRefusal(opts.safeguardingOutcome, sink);
      return {
        kind: 'refusal',
        reason: REFUSAL_BOTH_FAIL,
        safeguardingOutcome: opts.safeguardingOutcome,
        staleManifestEntries: staleEntries,
        refusedAtUnixMs: opts.emittedAtUnixMs,
        advisoryCode: this.#advisoryCodeFor(opts.safeguardingOutcome),
      };
    }
    if (failing) {
      this.#fireFirstRefusal(opts.safeguardingOutcome, sink);
      return {
        kind: 'refusal',
        reason: REFUSAL_SAFEGUARDING_FAIL,
        safeguardingOutcome: opts.safeguardingOutcome,
        staleManifestEntries: [],
        refusedAtUnixMs: opts.emittedAtUnixMs,
        advisoryCode: this.#advisoryCodeFor(opts.safeguardingOutcome),
      };
    }
    if (manifestStale) {
      return {
        kind: 'refusal',
        reason: REFUSAL_MANIFEST_STALE,
        safeguardingOutcome: opts.safeguardingOutcome,
        staleManifestEntries: staleEntries,
        refusedAtUnixMs: opts.emittedAtUnixMs,
        advisoryCode: 'CLASSROOM_MANIFEST_STALE',
      };
    }
    if (this.usingPlaceholderCorpus || this.usingPlaceholderKey) {
      return {
        kind: 'refusal',
        reason: REFUSAL_PLACEHOLDER,
        safeguardingOutcome: opts.safeguardingOutcome,
        staleManifestEntries: [],
        refusedAtUnixMs: opts.emittedAtUnixMs,
        advisoryCode: 'CLASSROOM_MIRRORMARK_PLACEHOLDER_BOOT',
      };
    }
    const payload = canonicalPupilWorksheetReceiptPayload({
      worksheetId: opts.worksheetId,
      lessonId: opts.lessonId,
      keyStage: opts.keyStage,
      contentHash: opts.contentHash,
      emittedAtUnixMs: opts.emittedAtUnixMs,
      safeguardingOutcome: opts.safeguardingOutcome,
    });
    const mark = mirrorMarkSign(this.corpusSha, payload, this.key);
    return {
      kind: 'receipt',
      mark,
      payload,
      safeguardingOutcome: opts.safeguardingOutcome,
      emittedAtUnixMs: opts.emittedAtUnixMs,
    };
  }

  /**
   * Fire the appropriate R143 advisory once per process per refusal class.
   * The first refusal of the process emits the canonical advisory on the
   * provided sink. Subsequent refusals are dedup'd by honest.loudOnce.
   */
  #fireFirstRefusal(outcome: SafeguardingOutcome, sink?: (line: string) => void): void {
    if (this.#refusedOnce) return;
    this.#refusedOnce = true;
    const adv = this.#advisoryFor(outcome);
    if (adv !== null) loudOnce(adv, sink);
  }

  /** Map SafeguardingOutcome -> canonical Advisory (or null on PASS). */
  #advisoryFor(outcome: SafeguardingOutcome): Advisory | null {
    switch (outcome) {
      case 'KCSiE_STALE':
        return CLASSROOM_KCSiE_STATUTORY_NOT_LIVE;
      case 'EYFS_STALE':
        return CLASSROOM_EYFS_FRAMEWORK_NOT_REVIEWED;
      case 'OFSTED_VERSION_DRIFT':
        return CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED;
      case 'UNKNOWN':
        return CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED;
      case 'FRESH_DFE':
        return null;
      default:
        return null;
    }
  }

  /** Map SafeguardingOutcome -> advisory code string. */
  #advisoryCodeFor(outcome: SafeguardingOutcome): string {
    const adv = this.#advisoryFor(outcome);
    return adv === null ? 'CLASSROOM_OUTCOME_UNKNOWN' : adv.code;
  }

  /** Test-only entry: reset the once-state for refusal warnings. */
  _resetRefusedOnceForTests(): void {
    this.#refusedOnce = false;
  }

  /** Test-only entry: returns the once-state for refusal warnings. */
  hasRefusedOnce(): boolean {
    return this.#refusedOnce;
  }
}

// ---------------------------------------------------------------------------
// AuditEvent rendering helpers.
// ---------------------------------------------------------------------------

/**
 * Render a CitationResult into an AuditEvent. The audit log is the
 * Ofsted-inspection-ready surface; one row per emit attempt.
 */
export function renderAuditEvent(
  result: CitationResult,
  context: {
    readonly lessonId: string;
    readonly teacherId: string;
    readonly keyStage: string;
    readonly subject: string;
    readonly curriculumVersion: string;
  },
): AuditEvent {
  if (result.kind === 'receipt') {
    return Object.freeze({
      kind: 'audit_event' as const,
      outcome: 'EMIT' as const,
      safeguardingOutcome: result.safeguardingOutcome,
      refusalReason: null,
      lessonId: context.lessonId,
      teacherId: context.teacherId,
      keyStage: context.keyStage,
      subject: context.subject,
      curriculumVersion: context.curriculumVersion,
      atUnixMs: result.emittedAtUnixMs,
      mark: result.mark,
      staleManifestKeys: [],
    });
  }
  return Object.freeze({
    kind: 'audit_event' as const,
    outcome: 'REFUSE' as const,
    safeguardingOutcome: result.safeguardingOutcome,
    refusalReason: result.reason,
    lessonId: context.lessonId,
    teacherId: context.teacherId,
    keyStage: context.keyStage,
    subject: context.subject,
    curriculumVersion: context.curriculumVersion,
    atUnixMs: result.refusedAtUnixMs,
    mark: null,
    staleManifestKeys: result.staleManifestEntries.map((e) => e.subject),
  });
}

/** Returns the human-readable summary of a CitationResult. */
export function summariseResult(result: CitationResult): string {
  if (result.kind === 'receipt') {
    return `EMIT outcome=${result.safeguardingOutcome} mark=${result.mark} at=${result.emittedAtUnixMs}`;
  }
  const stale = result.staleManifestEntries.length;
  return `REFUSE reason=${result.reason} outcome=${result.safeguardingOutcome} staleEntries=${stale} advisory=${result.advisoryCode}`;
}

// Re-export the helpers callers may need.
export { isPassOutcome, isFailOutcome };
