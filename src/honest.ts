/**
 * R143 LOUD-ONCE-WARNING-FLAG primitive for Limitless Classroom.
 *
 * R143 (LOUD-ONCE-WARNING-FLAG, promoted 4/3 from Session 2026-05-11) pins
 * a canonical literal prefix `[LOUD-ONCE-WARNING]` that fires exactly once
 * per process per Code. The cohort-wide grep-discovery property: a single
 * grep across the ecosystem for the literal `[LOUD-ONCE-WARNING]` finds
 * every R143 honesty-defaults warning surface.
 *
 * TypeScript-native (not JS-loose) implementation:
 *   - `Severity` is a strict 3-rung type literal union (no `string` fallback).
 *   - `Advisory` is a `readonly` interface; every field is required + non-empty
 *     at runtime via `assertValidAdvisory()`.
 *   - The per-process dedup gate uses `Map<string, true>` keyed on the code
 *     literal (atomic check-and-set via `set()` returning previous-keyed
 *     read), which is TS-equivalent of the Go canonical's
 *     `sync.Map.LoadOrStore` semantics.
 *
 * Per-process dedup is implemented via a module-level `Map<string, true>`.
 * A second invocation with the same Code is a no-op. Test code may invoke
 * `resetLoudOnceForTests()` to clear the gate.
 */

import { argv, env, stderr } from 'node:process';

/**
 * Cohort-canonical literal prefix. A single grep across the ecosystem for
 * this literal finds every R143 surface. DO NOT EDIT.
 */
export const LOUD_ONCE_PREFIX: string = '[LOUD-ONCE-WARNING]';

/**
 * R143.A SEVERITY-LADDER-CONVENTION. The cohort vocabulary is exactly three
 * levels:
 *
 *  - `INFO`  -- the honest-default is benign in production; surfaced so an
 *    audit can enumerate every stub.
 *  - `WARN`  -- the honest-default is degraded; downstream consumers may
 *    observe partial output.
 *  - `ERROR` -- the honest-default is broken; downstream consumers MUST
 *    treat output as unreliable (liability-bearing). For a Classroom
 *    surface ERROR means a child-facing artefact MUST NOT be emitted in
 *    production until the upstream gap is closed.
 */
export type Severity = 'INFO' | 'WARN' | 'ERROR';

export const SEVERITY_INFO: Severity = 'INFO';
export const SEVERITY_WARN: Severity = 'WARN';
export const SEVERITY_ERROR: Severity = 'ERROR';

/**
 * Advisory describes a single honest-defaults surface in Classroom.
 *
 * Each field is load-bearing:
 *   - `code` is the dot-or-underscore-separated identifier; non-empty,
 *     unique across the canonical advisory set; grep-discoverable.
 *   - `severity` is one of INFO / WARN / ERROR per R143.A.
 *   - `message` is the human-readable body; non-empty.
 *   - `docLink` is a relative-path pointer to docs (CONTEXT.md / README.md
 *     section / SECURITY.md surface); non-empty.
 */
export interface Advisory {
  readonly code: string;
  readonly severity: Severity;
  readonly message: string;
  readonly docLink: string;
}

/**
 * Per-process dedup gate. Keyed on Advisory.code. Module-level state --
 * survives across multiple loudOnce() calls but is cleared on module
 * re-import (test-framework re-init) so loud-once-per-process matches the
 * cohort R143 behaviour.
 *
 * Single module-level binding (no class field) so this is genuinely atomic
 * in the Node.js single-thread per-process semantics (no second VM can
 * race it within the same process).
 */
const _firedCodes: Map<string, true> = new Map();

/** Default sink -- writes to process.stderr (NOT console.warn — process.stderr is reliably captured by Ofsted ingest pipelines). */
function defaultSink(line: string): void {
  stderr.write(line + '\n');
}

/**
 * Strict at-runtime validator. Catches accidentally-empty fields at the
 * point of advisory construction (Mirror-Problem: a stale-doc or autofill
 * that produced an empty `code` would silently dedup ALL advisories
 * together; this guard forces the failure to land at construction).
 */
export function assertValidAdvisory(adv: Advisory): void {
  if (typeof adv.code !== 'string' || adv.code.length === 0) {
    throw new Error('R143 Advisory.code must be a non-empty string');
  }
  if (adv.severity !== 'INFO' && adv.severity !== 'WARN' && adv.severity !== 'ERROR') {
    throw new Error(`R143 Advisory.severity must be INFO|WARN|ERROR; got ${String(adv.severity)}`);
  }
  if (typeof adv.message !== 'string' || adv.message.length === 0) {
    throw new Error('R143 Advisory.message must be a non-empty string');
  }
  if (typeof adv.docLink !== 'string' || adv.docLink.length === 0) {
    throw new Error('R143 Advisory.docLink must be a non-empty string');
  }
}

/**
 * Emit the advisory exactly once per code per process. Canonical shape:
 *
 *   [LOUD-ONCE-WARNING] {SEVERITY} {CODE}: {MESSAGE} (see {DOC_LINK})
 *
 * Grep-discoverable: the literal `[LOUD-ONCE-WARNING]` is at the start of
 * every emit; a single grep across the ecosystem finds every R143 surface.
 *
 * The `sink` parameter lets tests intercept the output. Production callers
 * leave it unset (defaults to process.stderr).
 *
 * Atomicity: `Map.has` + `Map.set` is single-thread atomic under Node.js
 * (event-loop single-thread) so the dedup is genuinely once-per-process
 * even under concurrent async callers within the same process.
 */
export function loudOnce(adv: Advisory, sink: (line: string) => void = defaultSink): void {
  assertValidAdvisory(adv);
  if (_firedCodes.has(adv.code)) return;
  _firedCodes.set(adv.code, true);
  const line = `${LOUD_ONCE_PREFIX} ${adv.severity} ${adv.code}: ${adv.message} (see ${adv.docLink})`;
  sink(line);
}

/**
 * Clear the per-process dedup gate. Test-only entry point. Production code
 * MUST NOT call this. Exported for the cohort firewall + per-package tests
 * to verify once-per-process gating across multiple loudOnce calls without
 * process restart.
 */
export function resetLoudOnceForTests(): void {
  _firedCodes.clear();
}

/** Returns whether the given code has already fired. Test-only inspection helper. */
export function hasFired(code: string): boolean {
  return _firedCodes.has(code);
}

/** Returns the count of fired codes. Test-only inspection helper. */
export function firedCount(): number {
  return _firedCodes.size;
}

// ---------------------------------------------------------------------------
// Canonical Classroom advisories. Each advisory is grep-discoverable.
// ---------------------------------------------------------------------------

/**
 * The 7 canonical honesty-defaults surfaces for limitless-classroom at
 * inception. Loud on first call, then deduplicated for the rest of process
 * lifetime.
 *
 * Severity ladder per R143.A:
 *   - ERROR (3): child-facing emit MUST NOT land in production until closed.
 *   - WARN  (2): degraded posture; emit is allowed but flagged.
 *   - INFO  (2): benign in production; documented for audit completeness.
 */
export const CLASSROOM_KCSiE_STATUTORY_NOT_LIVE: Advisory = Object.freeze({
  code: 'CLASSROOM_KCSiE_STATUTORY_NOT_LIVE',
  severity: SEVERITY_ERROR,
  message:
    "KCSiE (Keeping Children Safe in Education) statutory guidance is the live ground-truth for child-facing AI. Until the school's DSL has signed off the current KCSiE version against this manifest entry, classroom MUST NOT emit pupil-facing artefacts.",
  docLink: 'CONTEXT.md#kcsie-statutory-gate',
});

export const CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED: Advisory = Object.freeze({
  code: 'CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED',
  severity: SEVERITY_ERROR,
  message:
    "Ofsted School Inspection Handbook 2024 references in legal/ have NOT been counsel-reviewed against the current handbook version. REVIEWED_BY_COUNSEL defaults to false.",
  docLink: 'CONTEXT.md#ofsted-handbook-reference',
});

export const CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED: Advisory = Object.freeze({
  code: 'CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED',
  severity: SEVERITY_ERROR,
  message:
    "DfE 'Generative AI in Education' policy paper references in legal/ have NOT been counsel-reviewed against the current DfE publication.",
  docLink: 'CONTEXT.md#dfe-genai-policy-reference',
});

export const CLASSROOM_EYFS_FRAMEWORK_NOT_REVIEWED: Advisory = Object.freeze({
  code: 'CLASSROOM_EYFS_FRAMEWORK_NOT_REVIEWED',
  severity: SEVERITY_WARN,
  message:
    "EYFS (Early Years Foundation Stage) statutory framework references in manifest are anchored to the version-axis but have NOT been counsel-reviewed against the current EYFS framework.",
  docLink: 'CONTEXT.md#eyfs-framework-reference',
});

export const CLASSROOM_AGE_VERIFICATION_PLACEHOLDER: Advisory = Object.freeze({
  code: 'CLASSROOM_AGE_VERIFICATION_PLACEHOLDER',
  severity: SEVERITY_WARN,
  message:
    'Age-verification gating is a declarative tag only -- the upstream school MIS / parental-consent record is the source of truth. Classroom does NOT verify pupil age directly.',
  docLink: 'CONTEXT.md#age-verification-boundary',
});

export const CLASSROOM_ARTICLE_9_SPECIAL_CATEGORY: Advisory = Object.freeze({
  code: 'CLASSROOM_ARTICLE_9_SPECIAL_CATEGORY',
  severity: SEVERITY_INFO,
  message:
    'UK GDPR Article 9 special-category personal data (pupil mental-health observations, racial-ethnic origin in cultural-curriculum context, religion) MAY transit through AI surfaces. School DPO is the controller for Article 6 + Article 9 lawful-basis selection; classroom is a processor under Article 28.',
  docLink: 'CONTEXT.md#article-9-boundary',
});

export const CLASSROOM_MIRRORMARK_PLACEHOLDER_BOOT: Advisory = Object.freeze({
  code: 'CLASSROOM_MIRRORMARK_PLACEHOLDER_BOOT',
  severity: SEVERITY_INFO,
  message:
    'Mirror-Mark corpus + key are placeholder values until CLASSROOM_LORE_CORPUS_SHA_PATH and CLASSROOM_MIRRORMARK_KEY env-vars are wired in production. Emitted marks will NOT pass cold-verify against the real lore corpus.',
  docLink: 'CONTEXT.md#mirror-mark-configuration',
});

/**
 * Canonical advisory list (length-pinned for the cohort firewall test).
 */
export const CANONICAL_ADVISORIES: ReadonlyArray<Advisory> = Object.freeze([
  CLASSROOM_KCSiE_STATUTORY_NOT_LIVE,
  CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED,
  CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED,
  CLASSROOM_EYFS_FRAMEWORK_NOT_REVIEWED,
  CLASSROOM_AGE_VERIFICATION_PLACEHOLDER,
  CLASSROOM_ARTICLE_9_SPECIAL_CATEGORY,
  CLASSROOM_MIRRORMARK_PLACEHOLDER_BOOT,
]);

/** Pinned advisory count for the cohort firewall. */
export const CANONICAL_ADVISORIES_COUNT: number = 7;

/**
 * Fire every canonical advisory once. Boot-time hook: a Classroom boot
 * should call this exactly once near startup so an audit log enumerates
 * every honest-default before any emit lands.
 *
 * Subsequent calls are no-ops (per-code dedup).
 */
export function fireAllCanonicalAdvisoriesOnce(sink?: (line: string) => void): void {
  for (const adv of CANONICAL_ADVISORIES) {
    loudOnce(adv, sink);
  }
}

/**
 * Used by tests + CLI to indicate boot context. Reads CLASSROOM_BOOT_QUIET
 * environment variable. When set to '1' or 'true', the canonical
 * advisories will not be auto-emitted (tests / silent builds).
 */
export function bootQuietRequested(envVars: NodeJS.ProcessEnv = env): boolean {
  const v = (envVars.CLASSROOM_BOOT_QUIET ?? '').toLowerCase();
  return v === '1' || v === 'true';
}

/** Return process argv (test-friendly inspection helper). */
export function processArgv(): readonly string[] {
  return argv;
}
