import { describe, test, expect } from 'vitest';
import {
  SAFEGUARDING_FRESH_DFE,
  SAFEGUARDING_KCSIE_STALE,
  SAFEGUARDING_EYFS_STALE,
  SAFEGUARDING_OFSTED_VERSION_DRIFT,
  SAFEGUARDING_UNKNOWN,
  ALL_SAFEGUARDING_OUTCOMES,
  SAFEGUARDING_OUTCOME_COUNT,
  SAFEGUARDING_FAIL_CLASS_COUNT,
  isPassOutcome,
  isFailOutcome,
  failOutcomes,
  explainOutcome,
  composeSafeguardingOutcome,
} from '../src/safeguarding_gate.js';

describe('SafeguardingOutcome closed-enum', () => {
  test('SAFEGUARDING_OUTCOME_COUNT is 5', () => {
    expect(SAFEGUARDING_OUTCOME_COUNT).toBe(5);
  });
  test('SAFEGUARDING_FAIL_CLASS_COUNT is 4', () => {
    expect(SAFEGUARDING_FAIL_CLASS_COUNT).toBe(4);
  });
  test('ALL_SAFEGUARDING_OUTCOMES has 5 entries', () => {
    expect(ALL_SAFEGUARDING_OUTCOMES.length).toBe(5);
  });
  test('canonical literals match', () => {
    expect(SAFEGUARDING_FRESH_DFE).toBe('FRESH_DFE');
    expect(SAFEGUARDING_KCSIE_STALE).toBe('KCSiE_STALE');
    expect(SAFEGUARDING_EYFS_STALE).toBe('EYFS_STALE');
    expect(SAFEGUARDING_OFSTED_VERSION_DRIFT).toBe('OFSTED_VERSION_DRIFT');
    expect(SAFEGUARDING_UNKNOWN).toBe('UNKNOWN');
  });
});

describe('isPassOutcome / isFailOutcome', () => {
  test('FRESH_DFE is the only PASS outcome', () => {
    expect(isPassOutcome('FRESH_DFE')).toBe(true);
    expect(isPassOutcome('KCSiE_STALE')).toBe(false);
    expect(isPassOutcome('EYFS_STALE')).toBe(false);
    expect(isPassOutcome('OFSTED_VERSION_DRIFT')).toBe(false);
    expect(isPassOutcome('UNKNOWN')).toBe(false);
  });
  test('every FAIL outcome is fail', () => {
    expect(isFailOutcome('KCSiE_STALE')).toBe(true);
    expect(isFailOutcome('EYFS_STALE')).toBe(true);
    expect(isFailOutcome('OFSTED_VERSION_DRIFT')).toBe(true);
    expect(isFailOutcome('UNKNOWN')).toBe(true);
  });
  test('FRESH_DFE is not fail', () => {
    expect(isFailOutcome('FRESH_DFE')).toBe(false);
  });
  test('every outcome is either PASS xor FAIL', () => {
    for (const o of ALL_SAFEGUARDING_OUTCOMES) {
      expect(isPassOutcome(o) !== isFailOutcome(o)).toBe(true);
    }
  });
  test('failOutcomes returns exactly 4', () => {
    expect(failOutcomes().length).toBe(4);
    expect(failOutcomes()).not.toContain(SAFEGUARDING_FRESH_DFE);
  });
});

describe('explainOutcome', () => {
  test('each outcome returns a non-empty human-readable string', () => {
    for (const o of ALL_SAFEGUARDING_OUTCOMES) {
      const s = explainOutcome(o);
      expect(s.length).toBeGreaterThan(20);
    }
  });
  test('FRESH_DFE explanation mentions EMIT permitted', () => {
    expect(explainOutcome('FRESH_DFE')).toContain('EMIT permitted');
  });
  test('KCSiE_STALE explanation mentions EMIT refused', () => {
    expect(explainOutcome('KCSiE_STALE')).toContain('EMIT refused');
  });
  test('UNKNOWN explanation mentions fail-closed', () => {
    expect(explainOutcome('UNKNOWN')).toContain('fail-closed');
  });
});

describe('composeSafeguardingOutcome precedence', () => {
  test('all fresh -> FRESH_DFE', () => {
    expect(composeSafeguardingOutcome({
      kcsieStale: false, ofstedHandbookDrift: false, eyfsStale: false, keyStageIsEYFS: false,
    })).toBe('FRESH_DFE');
  });
  test('kcsieStale=true -> KCSiE_STALE (always wins)', () => {
    expect(composeSafeguardingOutcome({
      kcsieStale: true, ofstedHandbookDrift: true, eyfsStale: true, keyStageIsEYFS: true,
    })).toBe('KCSiE_STALE');
  });
  test('Ofsted drift but KCSiE fresh -> OFSTED_VERSION_DRIFT', () => {
    expect(composeSafeguardingOutcome({
      kcsieStale: false, ofstedHandbookDrift: true, eyfsStale: false, keyStageIsEYFS: false,
    })).toBe('OFSTED_VERSION_DRIFT');
  });
  test('EYFS stale + keyStageIsEYFS=true (others fresh) -> EYFS_STALE', () => {
    expect(composeSafeguardingOutcome({
      kcsieStale: false, ofstedHandbookDrift: false, eyfsStale: true, keyStageIsEYFS: true,
    })).toBe('EYFS_STALE');
  });
  test('EYFS stale + keyStageIsEYFS=false -> FRESH_DFE (not EYFS context)', () => {
    expect(composeSafeguardingOutcome({
      kcsieStale: false, ofstedHandbookDrift: false, eyfsStale: true, keyStageIsEYFS: false,
    })).toBe('FRESH_DFE');
  });
  test('any unknown without a stronger FAIL -> UNKNOWN', () => {
    expect(composeSafeguardingOutcome({
      kcsieStale: 'unknown', ofstedHandbookDrift: false, eyfsStale: false, keyStageIsEYFS: false,
    })).toBe('UNKNOWN');
  });
  test('kcsie unknown but ofsted drift fires -> OFSTED_VERSION_DRIFT (drift trumps unknown)', () => {
    expect(composeSafeguardingOutcome({
      kcsieStale: 'unknown', ofstedHandbookDrift: true, eyfsStale: false, keyStageIsEYFS: false,
    })).toBe('OFSTED_VERSION_DRIFT');
  });
  test('all unknown -> UNKNOWN', () => {
    expect(composeSafeguardingOutcome({
      kcsieStale: 'unknown', ofstedHandbookDrift: 'unknown', eyfsStale: 'unknown', keyStageIsEYFS: true,
    })).toBe('UNKNOWN');
  });
});
