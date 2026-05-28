import { describe, test, expect, beforeEach } from 'vitest';
import {
  LOUD_ONCE_PREFIX,
  SEVERITY_INFO,
  SEVERITY_WARN,
  SEVERITY_ERROR,
  loudOnce,
  resetLoudOnceForTests,
  hasFired,
  firedCount,
  assertValidAdvisory,
  CANONICAL_ADVISORIES,
  CANONICAL_ADVISORIES_COUNT,
  CLASSROOM_KCSiE_STATUTORY_NOT_LIVE,
  CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED,
  CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED,
  CLASSROOM_EYFS_FRAMEWORK_NOT_REVIEWED,
  CLASSROOM_AGE_VERIFICATION_PLACEHOLDER,
  CLASSROOM_ARTICLE_9_SPECIAL_CATEGORY,
  CLASSROOM_MIRRORMARK_PLACEHOLDER_BOOT,
  fireAllCanonicalAdvisoriesOnce,
  bootQuietRequested,
} from '../src/honest.js';

beforeEach(() => {
  resetLoudOnceForTests();
});

describe('R143 LOUD-ONCE-WARNING prefix', () => {
  test('cohort-canonical literal', () => {
    expect(LOUD_ONCE_PREFIX).toBe('[LOUD-ONCE-WARNING]');
  });
});

describe('R143.A SEVERITY-LADDER-CONVENTION (3-rung)', () => {
  test('INFO / WARN / ERROR are the only severities', () => {
    expect(SEVERITY_INFO).toBe('INFO');
    expect(SEVERITY_WARN).toBe('WARN');
    expect(SEVERITY_ERROR).toBe('ERROR');
  });
});

describe('assertValidAdvisory', () => {
  test('accepts a fully-populated advisory', () => {
    expect(() => assertValidAdvisory({
      code: 'TEST', severity: 'INFO', message: 'm', docLink: 'd',
    })).not.toThrow();
  });
  test('rejects empty code', () => {
    expect(() => assertValidAdvisory({
      code: '', severity: 'INFO', message: 'm', docLink: 'd',
    })).toThrow();
  });
  test('rejects empty message', () => {
    expect(() => assertValidAdvisory({
      code: 'C', severity: 'INFO', message: '', docLink: 'd',
    })).toThrow();
  });
  test('rejects empty docLink', () => {
    expect(() => assertValidAdvisory({
      code: 'C', severity: 'INFO', message: 'm', docLink: '',
    })).toThrow();
  });
  test('rejects bad severity', () => {
    expect(() => assertValidAdvisory({
      code: 'C', severity: 'BANANA' as 'INFO', message: 'm', docLink: 'd',
    })).toThrow();
  });
});

describe('loudOnce per-process dedup', () => {
  test('first call writes; second call does not', () => {
    const lines: string[] = [];
    const sink = (s: string): void => { lines.push(s); };
    loudOnce(CLASSROOM_KCSiE_STATUTORY_NOT_LIVE, sink);
    loudOnce(CLASSROOM_KCSiE_STATUTORY_NOT_LIVE, sink);
    expect(lines.length).toBe(1);
  });

  test('different codes both fire once', () => {
    const lines: string[] = [];
    const sink = (s: string): void => { lines.push(s); };
    loudOnce(CLASSROOM_KCSiE_STATUTORY_NOT_LIVE, sink);
    loudOnce(CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED, sink);
    expect(lines.length).toBe(2);
  });

  test('first line starts with [LOUD-ONCE-WARNING]', () => {
    const lines: string[] = [];
    loudOnce(CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED, (s) => { lines.push(s); });
    expect(lines[0].startsWith('[LOUD-ONCE-WARNING] ')).toBe(true);
  });

  test('line contains severity + code + message + docLink', () => {
    const lines: string[] = [];
    loudOnce(CLASSROOM_KCSiE_STATUTORY_NOT_LIVE, (s) => { lines.push(s); });
    expect(lines[0]).toContain('ERROR');
    expect(lines[0]).toContain('CLASSROOM_KCSiE_STATUTORY_NOT_LIVE');
    expect(lines[0]).toContain('(see CONTEXT.md');
  });

  test('hasFired tracks state', () => {
    expect(hasFired('CLASSROOM_KCSiE_STATUTORY_NOT_LIVE')).toBe(false);
    loudOnce(CLASSROOM_KCSiE_STATUTORY_NOT_LIVE, () => undefined);
    expect(hasFired('CLASSROOM_KCSiE_STATUTORY_NOT_LIVE')).toBe(true);
  });

  test('firedCount returns the number of fired codes', () => {
    expect(firedCount()).toBe(0);
    loudOnce(CLASSROOM_KCSiE_STATUTORY_NOT_LIVE, () => undefined);
    loudOnce(CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED, () => undefined);
    expect(firedCount()).toBe(2);
  });

  test('resetLoudOnceForTests clears the gate', () => {
    loudOnce(CLASSROOM_KCSiE_STATUTORY_NOT_LIVE, () => undefined);
    expect(firedCount()).toBe(1);
    resetLoudOnceForTests();
    expect(firedCount()).toBe(0);
    expect(hasFired('CLASSROOM_KCSiE_STATUTORY_NOT_LIVE')).toBe(false);
  });
});

describe('Canonical 7 Classroom advisories', () => {
  test('CANONICAL_ADVISORIES_COUNT is 7', () => {
    expect(CANONICAL_ADVISORIES_COUNT).toBe(7);
  });
  test('CANONICAL_ADVISORIES has 7 entries', () => {
    expect(CANONICAL_ADVISORIES.length).toBe(7);
  });
  test('each advisory is well-formed', () => {
    for (const adv of CANONICAL_ADVISORIES) {
      expect(() => assertValidAdvisory(adv)).not.toThrow();
    }
  });
  test('all 7 codes are unique', () => {
    const codes = new Set(CANONICAL_ADVISORIES.map((a) => a.code));
    expect(codes.size).toBe(7);
  });
  test('KCSiE / Ofsted / DfE GenAI are ERROR severity', () => {
    expect(CLASSROOM_KCSiE_STATUTORY_NOT_LIVE.severity).toBe('ERROR');
    expect(CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED.severity).toBe('ERROR');
    expect(CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED.severity).toBe('ERROR');
  });
  test('EYFS + age verification are WARN severity', () => {
    expect(CLASSROOM_EYFS_FRAMEWORK_NOT_REVIEWED.severity).toBe('WARN');
    expect(CLASSROOM_AGE_VERIFICATION_PLACEHOLDER.severity).toBe('WARN');
  });
  test('Article 9 + Mirror-Mark placeholder are INFO severity', () => {
    expect(CLASSROOM_ARTICLE_9_SPECIAL_CATEGORY.severity).toBe('INFO');
    expect(CLASSROOM_MIRRORMARK_PLACEHOLDER_BOOT.severity).toBe('INFO');
  });

  test('all codes start with CLASSROOM_', () => {
    for (const adv of CANONICAL_ADVISORIES) {
      expect(adv.code.startsWith('CLASSROOM_')).toBe(true);
    }
  });
});

describe('fireAllCanonicalAdvisoriesOnce', () => {
  test('emits each advisory once', () => {
    const lines: string[] = [];
    fireAllCanonicalAdvisoriesOnce((s) => { lines.push(s); });
    expect(lines.length).toBe(CANONICAL_ADVISORIES_COUNT);
  });
  test('second call after fireAll is a no-op', () => {
    const lines: string[] = [];
    fireAllCanonicalAdvisoriesOnce((s) => { lines.push(s); });
    fireAllCanonicalAdvisoriesOnce((s) => { lines.push(s); });
    expect(lines.length).toBe(CANONICAL_ADVISORIES_COUNT);
  });
});

describe('bootQuietRequested', () => {
  test('returns false when env-var is unset', () => {
    expect(bootQuietRequested({})).toBe(false);
  });
  test('returns true on 1', () => {
    expect(bootQuietRequested({ CLASSROOM_BOOT_QUIET: '1' })).toBe(true);
  });
  test('returns true on true (case-insensitive)', () => {
    expect(bootQuietRequested({ CLASSROOM_BOOT_QUIET: 'TRUE' })).toBe(true);
  });
  test('returns false on unknown value', () => {
    expect(bootQuietRequested({ CLASSROOM_BOOT_QUIET: 'whatever' })).toBe(false);
  });
});
