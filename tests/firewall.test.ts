import { describe, test, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KAT1_HEX,
  KAT1_INPUT_LEN,
  KAT6_MARK,
  KAT7_MARK,
  KAT7_KEY,
  KAT7_PAYLOAD,
  assertKat1Parity,
  assertKat6Parity,
  assertKat7Parity,
  assertAllKatParity,
  assertWireFormatPins,
  PIN_MARK_PREFIX,
  PIN_MARK_BODY_LEN,
  PIN_MARK_STRING_LEN,
  PIN_MARK_CORPUS_PREFIX_LEN,
  expectedModules,
  EXPECTED_MODULE_COUNT,
  scanSrcModules,
  moduleDrift,
} from '../src/firewall.js';

describe('KAT-1 cohort anchor', () => {
  test('KAT1_HEX matches the cohort moat literal', () => {
    expect(KAT1_HEX).toBe('239a7d0d3f1bbe3a98aede01e2ad818c2db60b7177c02e2f015035b2b5b7dbca');
  });
  test('KAT1_INPUT_LEN is 33 (version byte + 32 corpus bytes)', () => {
    expect(KAT1_INPUT_LEN).toBe(33);
  });
  test('assertKat1Parity returns true', () => {
    expect(assertKat1Parity()).toBe(true);
  });
});

describe('KAT-6 cohort firewall', () => {
  test('KAT6_MARK is the cohort literal', () => {
    expect(KAT6_MARK).toBe('lore@v1:MzMzMzMzMzNDXUcWs_KJVkPQfl3-ykizfhchYGxWCw-IoxKxgijBOw');
  });
  test('assertKat6Parity returns true', () => {
    expect(assertKat6Parity()).toBe(true);
  });
});

describe('KAT-7 cohort firewall', () => {
  test('KAT7_MARK is the cohort literal', () => {
    expect(KAT7_MARK).toBe('lore@v1:AAECAwQFBgdXSiwQoZ5vwuA9nIqeZ_2v8tfAsQWV2ow_OiE34Pud_w');
  });
  test('KAT7_KEY is the cohort literal', () => {
    expect(KAT7_KEY).toBe('iik_pulse_kat_probe_failure');
  });
  test('KAT7_PAYLOAD is the cohort literal', () => {
    expect(KAT7_PAYLOAD).toContain('"probeId":"https-google"');
  });
  test('assertKat7Parity returns true', () => {
    expect(assertKat7Parity()).toBe(true);
  });
});

describe('assertAllKatParity (composite)', () => {
  test('all three KATs pass', () => {
    const r = assertAllKatParity();
    expect(r.kat1).toBe(true);
    expect(r.kat6).toBe(true);
    expect(r.kat7).toBe(true);
    expect(r.allPass).toBe(true);
  });
});

describe('Wire-format constant pins', () => {
  test('PIN_MARK_PREFIX is the cohort literal', () => {
    expect(PIN_MARK_PREFIX).toBe('lore@v1:');
  });
  test('PIN_MARK_BODY_LEN is 40', () => {
    expect(PIN_MARK_BODY_LEN).toBe(40);
  });
  test('PIN_MARK_STRING_LEN is 62', () => {
    expect(PIN_MARK_STRING_LEN).toBe(62);
  });
  test('PIN_MARK_CORPUS_PREFIX_LEN is 8', () => {
    expect(PIN_MARK_CORPUS_PREFIX_LEN).toBe(8);
  });
  test('assertWireFormatPins returns true', () => {
    expect(assertWireFormatPins()).toBe(true);
  });
});

describe('Structural firewall (on-disk src/ layout)', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, '..');

  test('EXPECTED_MODULE_COUNT is 7', () => {
    expect(EXPECTED_MODULE_COUNT).toBe(7);
  });
  test('expectedModules has 7 entries', () => {
    expect(expectedModules().length).toBe(7);
  });
  test('expectedModules contains the canonical 7', () => {
    const m = expectedModules();
    expect(m).toContain('mirrormark');
    expect(m).toContain('honest');
    expect(m).toContain('legal');
    expect(m).toContain('manifest');
    expect(m).toContain('safeguarding_gate');
    expect(m).toContain('lore');
    expect(m).toContain('firewall');
  });
  test('scanSrcModules finds at least the 7 canonical modules', () => {
    const onDisk = scanSrcModules(repoRoot);
    for (const m of expectedModules()) {
      expect(onDisk).toContain(m);
    }
  });
  test('moduleDrift reports no declared-but-missing modules', () => {
    const drift = moduleDrift(repoRoot);
    expect(drift.declaredNotOnDisk.length).toBe(0);
  });
});
