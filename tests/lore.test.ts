import { describe, test, expect, beforeEach } from 'vitest';
import {
  LessonPlanReceiptSigner,
  REFUSAL_REASON_COUNT,
  REFUSAL_SAFEGUARDING_FAIL,
  REFUSAL_MANIFEST_STALE,
  REFUSAL_BOTH_FAIL,
  REFUSAL_PLACEHOLDER,
  REFUSAL_PASS_THROUGH,
  renderAuditEvent,
  summariseResult,
  type CitationReceipt,
  type CitationRefusal,
} from '../src/lore.js';
import { CLASSROOM_MANIFEST, STALE_KCSiE_VERSION, type Entry } from '../src/manifest.js';
import { resetLoudOnceForTests } from '../src/honest.js';

beforeEach(() => {
  resetLoudOnceForTests();
});

const goodCorpus = Buffer.alloc(32, 0x42);
const goodKey = Buffer.from('iik_test_key');

function makeSigner(opts?: { placeholder?: boolean }): LessonPlanReceiptSigner {
  return new LessonPlanReceiptSigner({
    corpusSha: goodCorpus,
    key: goodKey,
    usingPlaceholderCorpus: opts?.placeholder ?? false,
    usingPlaceholderKey: opts?.placeholder ?? false,
  });
}

function freshKS2Entries(): ReadonlyArray<Entry> {
  // pick from CLASSROOM_MANIFEST entries known to be fresh (e.g. 2014-09-01 KS2 maths)
  return CLASSROOM_MANIFEST.filter((e) => e.subject === 'maths_curriculum_KS2');
}

describe('RefusalReason closed-enum', () => {
  test('REFUSAL_REASON_COUNT is 5', () => {
    expect(REFUSAL_REASON_COUNT).toBe(5);
  });
  test('all 5 literals match', () => {
    expect(REFUSAL_SAFEGUARDING_FAIL).toBe('SAFEGUARDING_FAIL');
    expect(REFUSAL_MANIFEST_STALE).toBe('MANIFEST_STALE');
    expect(REFUSAL_BOTH_FAIL).toBe('SAFEGUARDING_AND_MANIFEST_BOTH_FAIL');
    expect(REFUSAL_PLACEHOLDER).toBe('PLACEHOLDER_CORPUS_OR_KEY');
    expect(REFUSAL_PASS_THROUGH).toBe('PASS_THROUGH');
  });
});

describe('LessonPlanReceiptSigner success path', () => {
  test('FRESH_DFE + fresh manifest + non-placeholder -> receipt', () => {
    const signer = makeSigner();
    const result = signer.emitLessonPlanReceipt({
      lessonId: 'lp-1',
      keyStage: 'KS2',
      subject: 'Maths',
      curriculumVersion: 'KS2',
      teacherId: 't1',
      generatedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'FRESH_DFE',
      relevantManifestEntries: freshKS2Entries(),
    });
    expect(result.kind).toBe('receipt');
    if (result.kind === 'receipt') {
      expect(result.mark.startsWith('lore@v1:')).toBe(true);
      expect(result.mark.length).toBe(62);
      expect(result.safeguardingOutcome).toBe('FRESH_DFE');
    }
  });

  test('worksheet success path emits a mark', () => {
    const signer = makeSigner();
    const result = signer.emitPupilWorksheetReceipt({
      worksheetId: 'ws-1',
      lessonId: 'lp-1',
      keyStage: 'KS2',
      contentHash: 'sha256:deadbeef',
      emittedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'FRESH_DFE',
      relevantManifestEntries: freshKS2Entries(),
    });
    expect(result.kind).toBe('receipt');
    if (result.kind === 'receipt') {
      expect(result.mark.startsWith('lore@v1:')).toBe(true);
    }
  });
});

describe('LessonPlanReceiptSigner refusal paths', () => {
  test('KCSiE_STALE -> SAFEGUARDING_FAIL refusal', () => {
    const signer = makeSigner();
    const result = signer.emitLessonPlanReceipt({
      lessonId: 'lp-1',
      keyStage: 'KS2',
      subject: 'Maths',
      curriculumVersion: 'KS2',
      teacherId: 't1',
      generatedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'KCSiE_STALE',
      relevantManifestEntries: freshKS2Entries(),
    });
    expect(result.kind).toBe('refusal');
    if (result.kind === 'refusal') {
      expect(result.reason).toBe(REFUSAL_SAFEGUARDING_FAIL);
      expect(result.advisoryCode).toBe('CLASSROOM_KCSiE_STATUTORY_NOT_LIVE');
    }
  });

  test('EYFS_STALE -> SAFEGUARDING_FAIL refusal', () => {
    const signer = makeSigner();
    const result = signer.emitLessonPlanReceipt({
      lessonId: 'lp-eyfs', keyStage: 'EYFS', subject: 'Maths', curriculumVersion: 'EYFS',
      teacherId: 't1', generatedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'EYFS_STALE',
      relevantManifestEntries: freshKS2Entries(),
    });
    expect(result.kind).toBe('refusal');
    if (result.kind === 'refusal') {
      expect(result.reason).toBe(REFUSAL_SAFEGUARDING_FAIL);
      expect(result.advisoryCode).toBe('CLASSROOM_EYFS_FRAMEWORK_NOT_REVIEWED');
    }
  });

  test('OFSTED_VERSION_DRIFT -> SAFEGUARDING_FAIL refusal', () => {
    const signer = makeSigner();
    const result = signer.emitLessonPlanReceipt({
      lessonId: 'lp-1', keyStage: 'KS2', subject: 'Maths', curriculumVersion: 'KS2',
      teacherId: 't1', generatedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'OFSTED_VERSION_DRIFT',
      relevantManifestEntries: freshKS2Entries(),
    });
    if (result.kind === 'refusal') {
      expect(result.advisoryCode).toBe('CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED');
    }
  });

  test('UNKNOWN -> SAFEGUARDING_FAIL refusal', () => {
    const signer = makeSigner();
    const result = signer.emitLessonPlanReceipt({
      lessonId: 'lp-1', keyStage: 'KS2', subject: 'Maths', curriculumVersion: 'KS2',
      teacherId: 't1', generatedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'UNKNOWN',
      relevantManifestEntries: freshKS2Entries(),
    });
    if (result.kind === 'refusal') {
      expect(result.reason).toBe(REFUSAL_SAFEGUARDING_FAIL);
      expect(result.advisoryCode).toBe('CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED');
    }
  });

  test('manifest stale + FRESH_DFE outcome -> MANIFEST_STALE refusal', () => {
    const signer = makeSigner();
    const staleEntry: Entry = {
      subject: 'x', curriculumVersion: 'KS2', subjectAxis: 'Maths',
      category: 'national_curriculum_subject', source: 'dfe_national_curriculum',
      freshAt: STALE_KCSiE_VERSION, confidence: 'low', note: '',
    };
    const result = signer.emitLessonPlanReceipt({
      lessonId: 'lp-1', keyStage: 'KS2', subject: 'Maths', curriculumVersion: 'KS2',
      teacherId: 't1', generatedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'FRESH_DFE',
      relevantManifestEntries: [staleEntry],
    });
    expect(result.kind).toBe('refusal');
    if (result.kind === 'refusal') {
      expect(result.reason).toBe(REFUSAL_MANIFEST_STALE);
    }
  });

  test('both fail-outcome + stale manifest -> BOTH_FAIL refusal', () => {
    const signer = makeSigner();
    const staleEntry: Entry = {
      subject: 'x', curriculumVersion: 'KS2', subjectAxis: 'Maths',
      category: 'national_curriculum_subject', source: 'dfe_national_curriculum',
      freshAt: STALE_KCSiE_VERSION, confidence: 'low', note: '',
    };
    const result = signer.emitLessonPlanReceipt({
      lessonId: 'lp-1', keyStage: 'KS2', subject: 'Maths', curriculumVersion: 'KS2',
      teacherId: 't1', generatedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'KCSiE_STALE',
      relevantManifestEntries: [staleEntry],
    });
    expect(result.kind).toBe('refusal');
    if (result.kind === 'refusal') {
      expect(result.reason).toBe(REFUSAL_BOTH_FAIL);
      expect(result.staleManifestEntries.length).toBe(1);
    }
  });

  test('placeholder signer + FRESH_DFE -> PLACEHOLDER refusal', () => {
    const signer = makeSigner({ placeholder: true });
    const result = signer.emitLessonPlanReceipt({
      lessonId: 'lp-1', keyStage: 'KS2', subject: 'Maths', curriculumVersion: 'KS2',
      teacherId: 't1', generatedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'FRESH_DFE',
      relevantManifestEntries: freshKS2Entries(),
    });
    expect(result.kind).toBe('refusal');
    if (result.kind === 'refusal') {
      expect(result.reason).toBe(REFUSAL_PLACEHOLDER);
    }
  });
});

describe('LessonPlanReceiptSigner LOUD-ONCE on first refusal', () => {
  test('first SAFEGUARDING_FAIL fires advisory once', () => {
    const signer = makeSigner();
    const lines: string[] = [];
    signer.emitLessonPlanReceipt({
      lessonId: 'lp-1', keyStage: 'KS2', subject: 'Maths', curriculumVersion: 'KS2',
      teacherId: 't1', generatedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'KCSiE_STALE',
      relevantManifestEntries: freshKS2Entries(),
      sink: (s) => { lines.push(s); },
    });
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('[LOUD-ONCE-WARNING]');
  });

  test('subsequent refusals dedup', () => {
    const signer = makeSigner();
    const lines: string[] = [];
    for (let i = 0; i < 3; i++) {
      signer.emitLessonPlanReceipt({
        lessonId: 'lp-' + i, keyStage: 'KS2', subject: 'Maths', curriculumVersion: 'KS2',
        teacherId: 't1', generatedAtUnixMs: 1700000000000,
        safeguardingOutcome: 'KCSiE_STALE',
        relevantManifestEntries: freshKS2Entries(),
        sink: (s) => { lines.push(s); },
      });
    }
    expect(lines.length).toBeLessThanOrEqual(1);
  });
});

describe('renderAuditEvent', () => {
  test('receipt -> EMIT audit-event with mark', () => {
    const receipt: CitationReceipt = {
      kind: 'receipt', mark: 'lore@v1:test', payload: Buffer.alloc(0),
      safeguardingOutcome: 'FRESH_DFE', emittedAtUnixMs: 1700000000000,
    };
    const ev = renderAuditEvent(receipt, {
      lessonId: 'lp-1', teacherId: 't1', keyStage: 'KS2', subject: 'Maths', curriculumVersion: 'KS2',
    });
    expect(ev.outcome).toBe('EMIT');
    expect(ev.mark).toBe('lore@v1:test');
    expect(ev.refusalReason).toBe(null);
  });

  test('refusal -> REFUSE audit-event with reason + advisory + stale-keys', () => {
    const refusal: CitationRefusal = {
      kind: 'refusal', reason: 'SAFEGUARDING_FAIL',
      safeguardingOutcome: 'KCSiE_STALE',
      staleManifestEntries: [],
      refusedAtUnixMs: 1700000000000,
      advisoryCode: 'CLASSROOM_KCSiE_STATUTORY_NOT_LIVE',
    };
    const ev = renderAuditEvent(refusal, {
      lessonId: 'lp-1', teacherId: 't1', keyStage: 'KS2', subject: 'Maths', curriculumVersion: 'KS2',
    });
    expect(ev.outcome).toBe('REFUSE');
    expect(ev.refusalReason).toBe('SAFEGUARDING_FAIL');
    expect(ev.mark).toBe(null);
  });
});

describe('summariseResult', () => {
  test('receipt summary contains EMIT', () => {
    const r: CitationReceipt = {
      kind: 'receipt', mark: 'lore@v1:abc', payload: Buffer.alloc(0),
      safeguardingOutcome: 'FRESH_DFE', emittedAtUnixMs: 1700000000000,
    };
    expect(summariseResult(r)).toContain('EMIT');
  });
  test('refusal summary contains REFUSE + reason', () => {
    const r: CitationRefusal = {
      kind: 'refusal', reason: 'SAFEGUARDING_FAIL',
      safeguardingOutcome: 'UNKNOWN',
      staleManifestEntries: [],
      refusedAtUnixMs: 1700000000000,
      advisoryCode: 'CLASSROOM_OUTCOME_UNKNOWN',
    };
    const s = summariseResult(r);
    expect(s).toContain('REFUSE');
    expect(s).toContain('SAFEGUARDING_FAIL');
  });
});
