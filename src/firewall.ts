/**
 * R145.C FIREWALL-TEST-DISCIPLINE for Limitless Classroom.
 *
 * R145.C (promoted 2026-05-22) pins three cohort-canonical KAT
 * literals at every flagship that consumes L43 Mirror-Mark v1:
 *
 *   KAT-1: zero corpus + empty payload + empty key. Anchor of the
 *           entire R151 cross-substrate cohort. The 32-byte HMAC hex
 *           `239a7d0d3f1bbe3a98aede01e2ad818c2db60b7177c02e2f015035b2b5b7dbca`
 *           is the single most-greppable cohort invariance proof
 *           ("strongest single-claim moat artefact" per godfather
 *           memory).
 *
 *   KAT-6: 0x33 corpus + 'hello world' payload + 'iik_hello' key. Pins
 *           the wire-format mark literal directly.
 *
 *   KAT-7: identity corpus (byte i at index i) + pulse probe-failure
 *           JSON payload + 'iik_pulse_kat_probe_failure' key. Cohort-
 *           realistic payload + key shape.
 *
 * The firewall is a STRUCTURAL surface: it both names the expected
 * src/ modules AND exposes a `scanSrcModules` helper that downstream
 * test code uses to verify the on-disk layout matches the declared
 * cohort shape. Drift in either direction (file deleted, file added
 * without firewall update) fails the firewall test.
 *
 * # Composition with the other firewall pins
 *
 *   - mirrormark.ts pins MARK_VERSION / MARK_PREFIX / DIGEST_LEN /
 *     MARK_BODY_LEN constants.
 *   - safeguarding_gate.ts pins SAFEGUARDING_OUTCOME_COUNT == 5.
 *   - manifest.ts pins CURRICULUM_VERSION_COUNT == 6 + SUBJECT_COUNT
 *     == 13 + STALE_SENTINELS_COUNT == 9 + CLASSROOM_MANIFEST_COUNT.
 *   - legal.ts pins LEGAL_CITATIONS_COUNT == 10.
 *   - honest.ts pins CANONICAL_ADVISORIES_COUNT == 7.
 *
 * All counts are firewall-tested at structural assertion time.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  KAT1_CANONICAL_HMAC_HEX,
  KAT1_CANONICAL_INPUT_LEN,
  deriveKat1Hex,
  sign,
  MARK_PREFIX,
  MARK_CORPUS_PREFIX_LEN,
  MARK_BODY_LEN,
} from './mirrormark.js';

// ---------------------------------------------------------------------------
// KAT-1 cohort anchor -- the single most-greppable cohort invariance.
// ---------------------------------------------------------------------------

/** KAT-1 cohort-canonical HMAC-SHA256 hex literal -- byte-identical to every cohort sibling. */
export const KAT1_HEX: string = KAT1_CANONICAL_HMAC_HEX;

/** KAT-1 cohort-canonical input length: MARK_VERSION (1) + corpus-SHA placeholder (32) = 33. */
export const KAT1_INPUT_LEN: number = KAT1_CANONICAL_INPUT_LEN;

/** Verify KAT-1 cohort invariance at this site (true on match). */
export function assertKat1Parity(): boolean {
  return deriveKat1Hex() === KAT1_HEX;
}

// ---------------------------------------------------------------------------
// KAT-6 cohort firewall.
// ---------------------------------------------------------------------------

/** KAT-6 canonical mark literal -- 0x33 corpus + 'hello world' + 'iik_hello' key. */
export const KAT6_MARK: string = 'lore@v1:MzMzMzMzMzNDXUcWs_KJVkPQfl3-ykizfhchYGxWCw-IoxKxgijBOw';

/** Verify KAT-6 cohort invariance by re-derivation. Returns true on match. */
export function assertKat6Parity(): boolean {
  const corpus = Buffer.alloc(32, 0x33);
  const payload = Buffer.from('hello world');
  const key = Buffer.from('iik_hello');
  return sign(corpus, payload, key) === KAT6_MARK;
}

// ---------------------------------------------------------------------------
// KAT-7 cohort firewall.
// ---------------------------------------------------------------------------

/** KAT-7 canonical mark literal. */
export const KAT7_MARK: string = 'lore@v1:AAECAwQFBgdXSiwQoZ5vwuA9nIqeZ_2v8tfAsQWV2ow_OiE34Pud_w';

/** KAT-7 canonical key literal. */
export const KAT7_KEY: string = 'iik_pulse_kat_probe_failure';

/** KAT-7 canonical payload (pulse probe-failure JSON). */
export const KAT7_PAYLOAD: string =
  '{"probeId":"https-google","verdict":"red","ms":5000,"error":"connection-timeout"}';

/** Verify KAT-7 cohort invariance by re-derivation. Returns true on match. */
export function assertKat7Parity(): boolean {
  const corpus = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) corpus[i] = i;
  const payload = Buffer.from(KAT7_PAYLOAD);
  const key = Buffer.from(KAT7_KEY);
  return sign(corpus, payload, key) === KAT7_MARK;
}

// ---------------------------------------------------------------------------
// Convenience: run all three KAT-parity checks.
// ---------------------------------------------------------------------------

export interface KatParityResult {
  readonly kat1: boolean;
  readonly kat6: boolean;
  readonly kat7: boolean;
  readonly allPass: boolean;
}

/** Verify KAT-1 + KAT-6 + KAT-7 in one call. */
export function assertAllKatParity(): KatParityResult {
  const k1 = assertKat1Parity();
  const k6 = assertKat6Parity();
  const k7 = assertKat7Parity();
  return {
    kat1: k1,
    kat6: k6,
    kat7: k7,
    allPass: k1 && k6 && k7,
  };
}

// ---------------------------------------------------------------------------
// Wire-format invariance pins.
// ---------------------------------------------------------------------------

/** Pinned MARK_PREFIX literal for the cohort firewall. */
export const PIN_MARK_PREFIX: string = 'lore@v1:';

/** Pinned MARK_BODY_LEN (8 corpus prefix + 32 HMAC digest = 40 bytes). */
export const PIN_MARK_BODY_LEN: number = 40;

/** Pinned mark string length (8-char prefix + base64url-encoded 40-byte body = 8 + 54 = 62 chars). */
export const PIN_MARK_STRING_LEN: number = 62;

/** Pinned corpus-prefix length (8 bytes). */
export const PIN_MARK_CORPUS_PREFIX_LEN: number = 8;

/**
 * Assert the wire-format constants match the pinned values. Returns
 * `true` on full match. The mirrormark module's exported constants must
 * equal the firewall pins on EVERY cohort flagship.
 */
export function assertWireFormatPins(): boolean {
  return (
    MARK_PREFIX === PIN_MARK_PREFIX &&
    MARK_BODY_LEN === PIN_MARK_BODY_LEN &&
    MARK_CORPUS_PREFIX_LEN === PIN_MARK_CORPUS_PREFIX_LEN
  );
}

// ---------------------------------------------------------------------------
// Structural firewall -- on-disk src/ module layout.
// ---------------------------------------------------------------------------

/**
 * Expected top-level `src/` modules in Limitless Classroom as of
 * inception (I42 ship).
 *
 *   - mirrormark    (L43 Mirror-Mark v1 port)
 *   - honest        (R143 LOUD-ONCE-WARN advisories)
 *   - legal         (R166 LIABILITY-FOOTER-CONST + citations)
 *   - manifest      (R150 5-field schematised-knowledge envelope)
 *   - lore          (R-AI-SURFACE-CITATION-GATE Profile-B composition)
 *   - safeguarding_gate (load-bearing SafeguardingOutcome enum)
 *   - firewall      (this file)
 */
export function expectedModules(): ReadonlyArray<string> {
  return [
    'firewall',
    'honest',
    'legal',
    'lore',
    'manifest',
    'mirrormark',
    'safeguarding_gate',
  ];
}

/** Pinned module-count for the cohort firewall test. */
export const EXPECTED_MODULE_COUNT: number = 7;

/**
 * Scan the on-disk `src/` directory and return the sorted module names
 * found there. Skips `.test.ts`, `.d.ts`, and non-`.ts` files. Sub-
 * directories with an `index.ts` count as a module.
 */
export function scanSrcModules(repoRoot: string): string[] {
  const srcDir = join(repoRoot, 'src');
  const entries = readdirSync(srcDir);
  const out = new Set<string>();
  for (const name of entries) {
    const fullPath = join(srcDir, name);
    const s = statSync(fullPath);
    if (s.isDirectory()) {
      out.add(name);
      continue;
    }
    if (name.endsWith('.test.ts') || name.endsWith('.d.ts')) continue;
    if (!name.endsWith('.ts')) continue;
    out.add(name.slice(0, -'.ts'.length));
  }
  return Array.from(out).sort();
}

/**
 * Returns the set-difference (declared - on-disk) and
 * (on-disk - declared). Either side being non-empty signals firewall
 * drift.
 */
export function moduleDrift(repoRoot: string): {
  readonly declaredNotOnDisk: string[];
  readonly onDiskNotDeclared: string[];
} {
  const declared = new Set(expectedModules());
  const onDisk = new Set(scanSrcModules(repoRoot));
  const declaredNotOnDisk: string[] = [];
  const onDiskNotDeclared: string[] = [];
  for (const m of declared) {
    if (!onDisk.has(m)) declaredNotOnDisk.push(m);
  }
  for (const m of onDisk) {
    if (!declared.has(m)) onDiskNotDeclared.push(m);
  }
  return {
    declaredNotOnDisk: declaredNotOnDisk.sort(),
    onDiskNotDeclared: onDiskNotDeclared.sort(),
  };
}
