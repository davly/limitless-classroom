/**
 * L43 Mirror-Mark v1 -- substrate-baked attestation for Limitless Classroom.
 *
 * The TypeScript / Node.js stdlib port of L43 Mirror-Mark v1. Every emitted
 * classroom lesson plan / pupil-facing AI worksheet / safeguarding-gate
 * receipt that callers choose to stamp now carries a `mirrorMark` string --
 * a header-value-shape HMAC over `(corpusSHA || markVersion-prefixed payload)`
 * keyed by an `iik_...` HMAC key.
 *
 * An Ofsted inspector, DfE auditor, headteacher, DSL (Designated Safeguarding
 * Lead), school DPO (under UK GDPR Article 37 + Article 35 DPIA gating for
 * special-category pupil data), or another LLM holding `(corpus, payload,
 * key)` can independently re-derive the mark and confirm two things in one
 * pass:
 *
 *   1. The corpus SHA prefix in the mark matches a clean re-hash of the
 *      deployed `lore.tar.gz`, AND
 *   2. The HMAC over `(markVersion || corpusSHA || payload)` matches the
 *      value Classroom emitted at the moment the content went to a child.
 *
 * For Classroom this turns every AI-assisted artefact that ever touched a
 * child-facing surface into a tamper-evident receipt the school can show in
 * an Ofsted inspection or DSL incident review months or years later.
 *
 * Why ported in-process rather than calling Nexus over HTTP:
 *
 *   * Zero runtime coupling -- Classroom's emit-paths must remain fast and
 *     free of inter-service dependencies in the classroom context where
 *     network reliability is unpredictable (e.g. rural primary schools).
 *   * Algorithm parity -- pure Node `node:crypto` HMAC-SHA256 is
 *     byte-identical to OpenSSL / Go `crypto/hmac` / Python
 *     `hmac.new(...)` / Rust `hmac` crate / C# `HMACSHA256` / Java
 *     `Mac.getInstance("HmacSHA256")` / Swift `CryptoKit.HMAC`.
 *   * Same wire format -- `MARK_PREFIX = "lore@v1:"` + 8-byte corpus
 *     prefix || 32-byte HMAC body. `lore-mark-verify` verifies Classroom
 *     marks identically to every cohort sibling.
 *
 * Status when this file was first shipped (2026-05-27):
 *
 *   SHIPPED AS LIBRARY ONLY (additive). Per R176 LIBRARY-FIRST-WIRE-LATER
 *   the mark stamp itself does NOT yet wire-in to a child-facing endpoint
 *   in this scaffold. Wire-in is behaviour-changing and per R145 / R145.B
 *   BEHAVIOR-CHANGING-WORK-GETS-ITS-OWN-BRANCH must not land in the same
 *   change as the library port.
 *
 * Configuration (environment variables, namespaced `CLASSROOM_*`):
 *
 *   `CLASSROOM_LORE_CORPUS_SHA_PATH`  optional; path to a 32-byte file
 *                                     (raw or 64-char hex) holding the
 *                                     corpus SHA.
 *   `CLASSROOM_MIRRORMARK_KEY`        optional; the `iik_...` HMAC key.
 *                                     Defaults to
 *                                     `iik_dev_CLASSROOM_NOT_FOR_PRODUCTION`.
 *
 * Cross-substrate cohort after this port (counts per godfather memory
 * R151 + Phase B / Phase A close 2026-05-27):
 *
 *   Go (~10+):        nexus / folio / howler-ref / dipstick-ref /
 *                     pigeonhole-ref / casino / ledger / pulse /
 *                     baseline / oracle (canonical-literal site).
 *   Kotlin KMM (3):   howler / dipstick / pigeonhole.
 *   C# (1):           fleetworks-torque.
 *   Rust (1):         foundry B16.
 *   Python (4):       iris / forge-game / ghost / gleam-js.
 *   **TypeScript (4): forge-ide / graphql-forge / conjure /
 *   limitless-classroom (THIS MODULE -- 4th TS substrate consumer,
 *   2nd standalone-Node-stdlib after graphql-forge).**
 *   Plus 20+ more substrate languages across the L43 cohort.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Wire-format constants -- byte-identical to every cohort sibling.
// ---------------------------------------------------------------------------

/** 1-byte version tag prefixed to the HMAC input. Identical to every cohort sibling. */
export const MARK_VERSION: number = 0x01;

/** Public header-value prefix for v1 Mirror-Mark. Identical to every cohort sibling. */
export const MARK_PREFIX: string = 'lore@v1:';

/** Corpus-SHA prefix length embedded in the mark body. Identical to every cohort sibling. */
export const MARK_CORPUS_PREFIX_LEN: number = 8;

/** SHA-256 digest length in bytes. Identical to every cohort sibling. */
export const DIGEST_LEN: number = 32;

/** Unencoded mark body length (corpus prefix + HMAC digest). */
export const MARK_BODY_LEN: number = MARK_CORPUS_PREFIX_LEN + DIGEST_LEN;

/** Corpus SHA full length (32 bytes, SHA-256 output). */
export const CORPUS_SHA_LEN: number = DIGEST_LEN;

/**
 * Base64url-encoded mark body length. 40 raw bytes -> ceil(40 * 4 / 3) = 54
 * base64url chars (no padding). Pinned for the cohort firewall test.
 */
export const MARK_BODY_BASE64URL_LEN: number = 54;

/**
 * Loud-by-name placeholder key. Production callers MUST override via
 * `CLASSROOM_MIRRORMARK_KEY` -- the `iik_dev_CLASSROOM_` prefix makes any
 * leaked-to-prod use grep-loud across logs.
 */
export const DEV_KEY_PLACEHOLDER: string = 'iik_dev_CLASSROOM_NOT_FOR_PRODUCTION';

// ---------------------------------------------------------------------------
// Errors -- sentinel-shaped (each subclass distinct, name match used by callers).
// ---------------------------------------------------------------------------

/** Base class for Mirror-Mark verify errors. */
export class MirrorMarkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MirrorMarkError';
  }
}

export class MalformedMark extends MirrorMarkError {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedMark';
  }
}

export class UnknownMarkVersion extends MirrorMarkError {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownMarkVersion';
  }
}

export class CorpusMismatch extends MirrorMarkError {
  constructor(message: string) {
    super(message);
    this.name = 'CorpusMismatch';
  }
}

export class SignatureMismatch extends MirrorMarkError {
  constructor(message: string) {
    super(message);
    this.name = 'SignatureMismatch';
  }
}

// ---------------------------------------------------------------------------
// MirrorMarker -- per-process signer holding (corpusSha, key).
// ---------------------------------------------------------------------------

/**
 * Per-process signer. Constructed once at boot via `MirrorMarker.fromEnv()`.
 * Emits exactly one R143 LOUD-ONCE WARN on first sign if either corpus or
 * key is the placeholder.
 */
export class MirrorMarker {
  readonly corpusSha: Buffer;
  readonly key: Buffer;
  readonly usingPlaceholderCorpus: boolean;
  readonly usingPlaceholderKey: boolean;

  /** R143 LOUD-ONCE class-level state -- one WARN per process. */
  static #warned: boolean = false;

  constructor(opts: {
    corpusSha: Buffer;
    key: Buffer;
    usingPlaceholderCorpus?: boolean;
    usingPlaceholderKey?: boolean;
  }) {
    if (opts.corpusSha.length !== CORPUS_SHA_LEN) {
      throw new Error(
        `corpusSha must be ${CORPUS_SHA_LEN} bytes; got ${opts.corpusSha.length}`,
      );
    }
    this.corpusSha = opts.corpusSha;
    this.key = opts.key;
    this.usingPlaceholderCorpus = opts.usingPlaceholderCorpus ?? false;
    this.usingPlaceholderKey = opts.usingPlaceholderKey ?? false;
  }

  /**
   * Read `CLASSROOM_LORE_CORPUS_SHA_PATH` + `CLASSROOM_MIRRORMARK_KEY`.
   * Either being absent triggers a one-shot WARN log on first sign --
   * emission stays emit-able even when corpus/key are not wired (per
   * R143 LOUD-ONCE).
   */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): MirrorMarker {
    // Resolve corpus
    let usingPlaceholderCorpus = false;
    let corpusSha: Buffer = Buffer.alloc(CORPUS_SHA_LEN);
    const corpusPath = env.CLASSROOM_LORE_CORPUS_SHA_PATH ?? '';
    if (corpusPath === '') {
      usingPlaceholderCorpus = true;
    } else {
      try {
        const raw = readFileSync(corpusPath);
        if (raw.length === CORPUS_SHA_LEN) {
          corpusSha = raw;
        } else {
          const trimmed = raw.toString('ascii').trim();
          if (trimmed.length === 2 * CORPUS_SHA_LEN && /^[0-9a-fA-F]+$/.test(trimmed)) {
            corpusSha = Buffer.from(trimmed, 'hex');
          } else {
            usingPlaceholderCorpus = true;
          }
        }
      } catch {
        usingPlaceholderCorpus = true;
      }
    }

    // Resolve key
    let usingPlaceholderKey = false;
    let keyStr = env.CLASSROOM_MIRRORMARK_KEY ?? '';
    if (keyStr === '') {
      keyStr = DEV_KEY_PLACEHOLDER;
      usingPlaceholderKey = true;
    }

    return new MirrorMarker({
      corpusSha,
      key: Buffer.from(keyStr, 'utf8'),
      usingPlaceholderCorpus,
      usingPlaceholderKey,
    });
  }

  /** Reset the LOUD-ONCE state -- test-only entry point. */
  static _resetWarnedOnceForTests(): void {
    MirrorMarker.#warned = false;
  }

  /** R143 LOUD-ONCE-WARN-FLAG -- fire one WARN per process on placeholders. */
  _maybeWarnOnce(sink: (msg: string) => void = consoleWarn): void {
    if (!(this.usingPlaceholderCorpus || this.usingPlaceholderKey)) return;
    if (MirrorMarker.#warned) return;
    MirrorMarker.#warned = true;
    const descr: string[] = [];
    if (this.usingPlaceholderCorpus) descr.push('corpus');
    if (this.usingPlaceholderKey) descr.push('key');
    sink(
      `[LOUD-ONCE-WARNING] WARN CLASSROOM_MIRRORMARK_PLACEHOLDER: classroom mirrormark using placeholder ${descr.join(' ')}; emitted marks will NOT pass cold-verify against a real lore corpus / production key`,
    );
  }

  /** Return the canonical Mirror-Mark string for the given payload. */
  sign(payload: Buffer | Uint8Array, sink?: (msg: string) => void): string {
    this._maybeWarnOnce(sink);
    return signInternal(this.corpusSha, payload, this.key);
  }

  /** Reports whether boot fell back to placeholders. */
  usingPlaceholders(): { corpus: boolean; key: boolean } {
    return {
      corpus: this.usingPlaceholderCorpus,
      key: this.usingPlaceholderKey,
    };
  }
}

function consoleWarn(msg: string): void {
  // eslint-disable-next-line no-console
  console.warn(msg);
}

// ---------------------------------------------------------------------------
// Module-level sign + verify -- stateless, regulator-replayable.
// ---------------------------------------------------------------------------

function signInternal(
  corpusSha: Buffer,
  payload: Buffer | Uint8Array,
  key: Buffer | Uint8Array,
): string {
  if (corpusSha.length !== CORPUS_SHA_LEN) {
    throw new Error(
      `corpusSha must be ${CORPUS_SHA_LEN} bytes; got ${corpusSha.length}`,
    );
  }
  const hmac = createHmac('sha256', key);
  hmac.update(Buffer.from([MARK_VERSION]));
  hmac.update(corpusSha);
  hmac.update(payload);
  const digest = hmac.digest(); // 32 bytes
  const body = Buffer.concat([
    corpusSha.subarray(0, MARK_CORPUS_PREFIX_LEN),
    digest,
  ]);
  return MARK_PREFIX + body.toString('base64url');
}

/** Stdlib-only sign -- same algorithm an Ofsted inspector / DPO can replay. */
export function sign(
  corpusSha: Buffer,
  payload: Buffer | Uint8Array,
  key: Buffer | Uint8Array,
): string {
  return signInternal(corpusSha, payload, key);
}

/**
 * Re-derive `mark` from `(corpusSha, payload, key)` and return true on
 * match. Throws `UnknownMarkVersion`, `MalformedMark`, `CorpusMismatch`, or
 * `SignatureMismatch` on failure -- caller can branch on the sentinel-shaped
 * error names without parsing the message.
 */
export function verify(
  mark: string,
  corpusSha: Buffer,
  payload: Buffer | Uint8Array,
  key: Buffer | Uint8Array,
): boolean {
  if (corpusSha.length !== CORPUS_SHA_LEN) {
    throw new Error(
      `corpusSha must be ${CORPUS_SHA_LEN} bytes; got ${corpusSha.length}`,
    );
  }
  if (!mark.startsWith(MARK_PREFIX)) {
    throw new UnknownMarkVersion(`mark missing prefix ${MARK_PREFIX}`);
  }
  const encoded = mark.slice(MARK_PREFIX.length);
  let body: Buffer;
  try {
    body = Buffer.from(encoded, 'base64url');
  } catch (err) {
    throw new MalformedMark(`base64 decode failed: ${String(err)}`);
  }
  if (body.length !== MARK_BODY_LEN) {
    throw new MalformedMark(
      `mark body length: got ${body.length} want ${MARK_BODY_LEN}`,
    );
  }

  const corpusPrefix = body.subarray(0, MARK_CORPUS_PREFIX_LEN);
  const digest = body.subarray(MARK_CORPUS_PREFIX_LEN);

  const expectedCorpusPrefix = corpusSha.subarray(0, MARK_CORPUS_PREFIX_LEN);
  if (!bufferEquals(corpusPrefix, expectedCorpusPrefix)) {
    throw new CorpusMismatch(
      `corpus prefix ${corpusPrefix.toString('hex')} != expected ${expectedCorpusPrefix.toString('hex')}`,
    );
  }

  const hmac = createHmac('sha256', key);
  hmac.update(Buffer.from([MARK_VERSION]));
  hmac.update(corpusSha);
  hmac.update(payload);
  const expected = hmac.digest();

  if (!bufferEquals(digest, expected)) {
    throw new SignatureMismatch(
      'HMAC re-derivation does not match embedded HMAC',
    );
  }
  return true;
}

function bufferEquals(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// R151 KAT-1 cohort anchor -- 33-byte canonical input, empty key.
// ---------------------------------------------------------------------------

/**
 * Cohort-canonical KAT-1 HMAC-SHA256 hex. Byte-identical to every cohort
 * sibling (oracle Go canonical at apps/lore-mark-verify/internal/kat/kat1.go
 * + iris Python + foundry Rust + forge-game / ghost / gleam-js / graphql-forge
 * / forge-ide / conjure + ~30 more substrate languages per godfather memory).
 *
 * Re-derive offline with OpenSSL (any platform):
 *
 *   printf '\x01' > /tmp/canonical.in
 *   dd if=/dev/zero bs=1 count=32 >> /tmp/canonical.in 2>/dev/null
 *   openssl dgst -sha256 -mac hmac -macopt key: -binary /tmp/canonical.in | xxd -p -c 64
 *   # 239a7d0d3f1bbe3a98aede01e2ad818c2db60b7177c02e2f015035b2b5b7dbca
 *
 * DO NOT EDIT without paired bumps at every cohort pin site.
 */
export const KAT1_CANONICAL_HMAC_HEX: string =
  '239a7d0d3f1bbe3a98aede01e2ad818c2db60b7177c02e2f015035b2b5b7dbca';

/** Cohort canonical input length: MARK_VERSION byte (1) + corpus-SHA placeholder (32) = 33 bytes. */
export const KAT1_CANONICAL_INPUT_LEN: number = 33;

/**
 * Compute the cohort canonical KAT-1 HMAC-SHA256 hex from first principles
 * using `node:crypto`. An Ofsted / DfE auditor / DPO holding the cohort
 * definition can run this function and compare against
 * `KAT1_CANONICAL_HMAC_HEX` -- if they match, the cohort invariance is
 * confirmed.
 *
 * Pure function -- no I/O, no side effects, deterministic.
 */
export function deriveKat1Hex(): string {
  const msg = Buffer.concat([
    Buffer.from([0x01]), // MARK_VERSION
    Buffer.alloc(32),    // corpus-SHA placeholder (32 zero bytes)
  ]);
  return createHmac('sha256', Buffer.alloc(0)).update(msg).digest('hex');
}

/** Verify KAT-1 cohort invariance at this site. */
export function verifyKat1(): boolean {
  return deriveKat1Hex() === KAT1_CANONICAL_HMAC_HEX;
}

// ---------------------------------------------------------------------------
// Canonical-payload helpers for Classroom surfaces (library-only -- wire-in
// deferred per R176 LIBRARY-FIRST-WIRE-LATER).
// ---------------------------------------------------------------------------

/**
 * Canonical bytes for a classroom lesson-plan emission receipt. Seven-field
 * canonical surface, NUL-separated UTF-8.
 *
 * Fields chosen for Ofsted / DSL / DPO cold-verify usefulness:
 *   lesson_id / key_stage / subject / curriculum_version / teacher_id /
 *   generated_at_unix_ms / safeguarding_outcome
 *
 * The safeguarding_outcome field is load-bearing: it's the SafeguardingOutcome
 * literal that gates whether the lesson plan was emitted at all (see
 * safeguarding_gate.ts).
 */
export function canonicalLessonPlanReceiptPayload(opts: {
  lessonId: string;
  keyStage: string;
  subject: string;
  curriculumVersion: string;
  teacherId: string;
  generatedAtUnixMs: number;
  safeguardingOutcome: string;
}): Buffer {
  const fields: Array<[string, string]> = [
    ['lesson_id', opts.lessonId],
    ['key_stage', opts.keyStage],
    ['subject', opts.subject],
    ['curriculum_version', opts.curriculumVersion],
    ['teacher_id', opts.teacherId],
    ['generated_at_unix_ms', String(opts.generatedAtUnixMs)],
    ['safeguarding_outcome', opts.safeguardingOutcome],
  ];
  const parts = fields.map(([k, v]) => `${k}=${v}`);
  return Buffer.from(parts.join('\x00'), 'utf8');
}

/**
 * Canonical bytes for a pupil-facing worksheet emission receipt. Six-field
 * canonical surface for the artefact that the pupil ACTUALLY sees.
 */
export function canonicalPupilWorksheetReceiptPayload(opts: {
  worksheetId: string;
  lessonId: string;
  keyStage: string;
  contentHash: string;
  emittedAtUnixMs: number;
  safeguardingOutcome: string;
}): Buffer {
  const fields: Array<[string, string]> = [
    ['worksheet_id', opts.worksheetId],
    ['lesson_id', opts.lessonId],
    ['key_stage', opts.keyStage],
    ['content_hash', opts.contentHash],
    ['emitted_at_unix_ms', String(opts.emittedAtUnixMs)],
    ['safeguarding_outcome', opts.safeguardingOutcome],
  ];
  const parts = fields.map(([k, v]) => `${k}=${v}`);
  return Buffer.from(parts.join('\x00'), 'utf8');
}
