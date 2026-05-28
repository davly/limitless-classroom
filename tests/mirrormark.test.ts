import { describe, test, expect } from 'vitest';
import { createHmac, randomBytes } from 'node:crypto';
import {
  sign,
  verify,
  MARK_VERSION,
  MARK_PREFIX,
  MARK_CORPUS_PREFIX_LEN,
  MARK_BODY_LEN,
  DIGEST_LEN,
  CORPUS_SHA_LEN,
  MARK_BODY_BASE64URL_LEN,
  DEV_KEY_PLACEHOLDER,
  MirrorMarker,
  MalformedMark,
  UnknownMarkVersion,
  CorpusMismatch,
  SignatureMismatch,
  KAT1_CANONICAL_HMAC_HEX,
  KAT1_CANONICAL_INPUT_LEN,
  deriveKat1Hex,
  verifyKat1,
  canonicalLessonPlanReceiptPayload,
  canonicalPupilWorksheetReceiptPayload,
} from '../src/mirrormark.js';

// Cohort-canonical KAT mark literals (byte-identical to every cohort sibling).
const KAT1_MARK = 'lore@v1:AAAAAAAAAAAjmn0NPxu-Opiu3gHirYGMLbYLcXfALi8BUDWytbfbyg';
const KAT6_MARK = 'lore@v1:MzMzMzMzMzNDXUcWs_KJVkPQfl3-ykizfhchYGxWCw-IoxKxgijBOw';
const KAT7_MARK = 'lore@v1:AAECAwQFBgdXSiwQoZ5vwuA9nIqeZ_2v8tfAsQWV2ow_OiE34Pud_w';

describe('mirrormark constants', () => {
  test('MARK_VERSION is 0x01', () => {
    expect(MARK_VERSION).toBe(0x01);
  });
  test('MARK_PREFIX is the cohort literal', () => {
    expect(MARK_PREFIX).toBe('lore@v1:');
  });
  test('MARK_CORPUS_PREFIX_LEN is 8', () => {
    expect(MARK_CORPUS_PREFIX_LEN).toBe(8);
  });
  test('DIGEST_LEN is 32 (SHA-256 output)', () => {
    expect(DIGEST_LEN).toBe(32);
  });
  test('CORPUS_SHA_LEN is 32 (SHA-256 output)', () => {
    expect(CORPUS_SHA_LEN).toBe(32);
  });
  test('MARK_BODY_LEN is 40 (8 + 32)', () => {
    expect(MARK_BODY_LEN).toBe(40);
  });
  test('MARK_BODY_BASE64URL_LEN is 54 (ceil(40 * 4 / 3))', () => {
    expect(MARK_BODY_BASE64URL_LEN).toBe(54);
  });
  test('DEV_KEY_PLACEHOLDER is loud-by-name and grep-discoverable', () => {
    expect(DEV_KEY_PLACEHOLDER).toBe('iik_dev_CLASSROOM_NOT_FOR_PRODUCTION');
  });
});

describe('mirrormark.sign produces canonical KAT literals', () => {
  test('KAT-1: zero corpus + empty payload + empty key', () => {
    const corpus = Buffer.alloc(32);
    expect(sign(corpus, Buffer.alloc(0), Buffer.alloc(0))).toBe(KAT1_MARK);
  });
  test('KAT-6: 0x33 corpus + hello-world + iik_hello key', () => {
    const corpus = Buffer.alloc(32, 0x33);
    expect(sign(corpus, Buffer.from('hello world'), Buffer.from('iik_hello'))).toBe(KAT6_MARK);
  });
  test('KAT-7: identity corpus + pulse probe-failure JSON', () => {
    const corpus = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) corpus[i] = i;
    const payload = Buffer.from(
      '{"probeId":"https-google","verdict":"red","ms":5000,"error":"connection-timeout"}',
    );
    const key = Buffer.from('iik_pulse_kat_probe_failure');
    expect(sign(corpus, payload, key)).toBe(KAT7_MARK);
  });
});

describe('mirrormark.verify accepts canonical KAT literals', () => {
  test('KAT-1 verifies', () => {
    const corpus = Buffer.alloc(32);
    expect(verify(KAT1_MARK, corpus, Buffer.alloc(0), Buffer.alloc(0))).toBe(true);
  });
  test('KAT-6 verifies', () => {
    const corpus = Buffer.alloc(32, 0x33);
    expect(verify(KAT6_MARK, corpus, Buffer.from('hello world'), Buffer.from('iik_hello'))).toBe(true);
  });
  test('KAT-7 verifies', () => {
    const corpus = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) corpus[i] = i;
    const payload = Buffer.from(
      '{"probeId":"https-google","verdict":"red","ms":5000,"error":"connection-timeout"}',
    );
    const key = Buffer.from('iik_pulse_kat_probe_failure');
    expect(verify(KAT7_MARK, corpus, payload, key)).toBe(true);
  });
});

describe('KAT-1 cohort invariance', () => {
  test('KAT1_CANONICAL_HMAC_HEX is the cohort literal (single grep moat)', () => {
    expect(KAT1_CANONICAL_HMAC_HEX).toBe(
      '239a7d0d3f1bbe3a98aede01e2ad818c2db60b7177c02e2f015035b2b5b7dbca',
    );
  });
  test('KAT1_CANONICAL_INPUT_LEN is 33 (version byte + 32 corpus bytes)', () => {
    expect(KAT1_CANONICAL_INPUT_LEN).toBe(33);
  });
  test('deriveKat1Hex re-derives the cohort literal', () => {
    expect(deriveKat1Hex()).toBe(KAT1_CANONICAL_HMAC_HEX);
  });
  test('verifyKat1 returns true', () => {
    expect(verifyKat1()).toBe(true);
  });
  test('KAT-1 mark embeds the cohort HMAC hex', () => {
    const body = Buffer.from(KAT1_MARK.slice(MARK_PREFIX.length), 'base64url');
    expect(body.length).toBe(MARK_BODY_LEN);
    expect(body.subarray(MARK_CORPUS_PREFIX_LEN).toString('hex')).toBe(KAT1_CANONICAL_HMAC_HEX);
  });
});

describe('mirrormark round-trip', () => {
  test('32 random round-trips all verify', () => {
    for (let i = 0; i < 32; i++) {
      const corpus = randomBytes(32);
      const key = randomBytes(32);
      const payload = randomBytes(64);
      const mark = sign(corpus, payload, key);
      expect(mark.startsWith(MARK_PREFIX)).toBe(true);
      expect(verify(mark, corpus, payload, key)).toBe(true);
    }
  });
  test('mark length is exactly 62 chars', () => {
    const corpus = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) corpus[i] = i * 3;
    expect(sign(corpus, Buffer.from('anything'), Buffer.from('k')).length).toBe(62);
    expect(MARK_PREFIX.length).toBe(8);
  });
});

describe('R132 mutual cross-validation against inline node:crypto', () => {
  test('sign output equals inline HMAC-SHA256 derivation', () => {
    const corpus = Buffer.alloc(32, 0x77);
    const key = Buffer.from('limitless_classroom_test_key');
    const payload = Buffer.from('{"lesson":"y4-maths-3","keyStage":"KS2"}');

    const pathSign = sign(corpus, payload, key);

    const mac = createHmac('sha256', key);
    mac.update(Buffer.from([0x01]));
    mac.update(corpus);
    mac.update(payload);
    const digest = mac.digest();
    const body = Buffer.concat([corpus.subarray(0, MARK_CORPUS_PREFIX_LEN), digest]);
    const pathInline = 'lore@v1:' + body.toString('base64url');

    expect(pathSign).toBe(pathInline);
  });
});

describe('mirrormark.verify rejects tampered inputs (sentinel errors)', () => {
  test('missing prefix throws UnknownMarkVersion', () => {
    const corpus = Buffer.alloc(32);
    expect(() => verify('not-a-mark', corpus, Buffer.alloc(0), Buffer.from('k'))).toThrow(UnknownMarkVersion);
  });
  test('malformed base64 throws MalformedMark', () => {
    const corpus = Buffer.alloc(32);
    expect(() => verify('lore@v1:abc', corpus, Buffer.alloc(0), Buffer.from('k'))).toThrow(MalformedMark);
  });
  test('wrong corpus throws CorpusMismatch', () => {
    const corpusA = Buffer.alloc(32, 0x11);
    const corpusB = Buffer.alloc(32, 0x22);
    const mark = sign(corpusA, Buffer.from('p'), Buffer.from('k'));
    expect(() => verify(mark, corpusB, Buffer.from('p'), Buffer.from('k'))).toThrow(CorpusMismatch);
  });
  test('tampered payload throws SignatureMismatch', () => {
    const corpus = Buffer.alloc(32, 0x44);
    const mark = sign(corpus, Buffer.from('original payload'), Buffer.from('k'));
    expect(() => verify(mark, corpus, Buffer.from('tampered payload'), Buffer.from('k'))).toThrow(SignatureMismatch);
  });
  test('tampered key throws SignatureMismatch', () => {
    const corpus = Buffer.alloc(32, 0x55);
    const mark = sign(corpus, Buffer.from('p'), Buffer.from('alice'));
    expect(() => verify(mark, corpus, Buffer.from('p'), Buffer.from('bob'))).toThrow(SignatureMismatch);
  });
  test('sign throws on wrong-length corpus', () => {
    expect(() => sign(Buffer.alloc(31), Buffer.alloc(0), Buffer.alloc(0))).toThrow();
  });
  test('verify throws on wrong-length corpus', () => {
    expect(() => verify(KAT1_MARK, Buffer.alloc(31), Buffer.alloc(0), Buffer.alloc(0))).toThrow();
  });
});

describe('MirrorMarker per-process signer', () => {
  test('fromEnv with no env vars uses placeholders', () => {
    MirrorMarker._resetWarnedOnceForTests();
    const m = MirrorMarker.fromEnv({});
    expect(m.usingPlaceholderCorpus).toBe(true);
    expect(m.usingPlaceholderKey).toBe(true);
    expect(m.usingPlaceholders()).toEqual({ corpus: true, key: true });
  });

  test('fromEnv with custom key disables placeholder-key flag', () => {
    MirrorMarker._resetWarnedOnceForTests();
    const m = MirrorMarker.fromEnv({ CLASSROOM_MIRRORMARK_KEY: 'iik_prod_real' });
    expect(m.usingPlaceholderKey).toBe(false);
  });

  test('LOUD-ONCE warning fires exactly once', () => {
    MirrorMarker._resetWarnedOnceForTests();
    const messages: string[] = [];
    const sink = (m: string): void => { messages.push(m); };
    const marker = MirrorMarker.fromEnv({});
    marker.sign(Buffer.from('a'), sink);
    marker.sign(Buffer.from('b'), sink);
    marker.sign(Buffer.from('c'), sink);
    expect(messages.length).toBe(1);
    expect(messages[0]).toContain('[LOUD-ONCE-WARNING]');
    expect(messages[0]).toContain('CLASSROOM_MIRRORMARK_PLACEHOLDER');
  });

  test('non-placeholder marker does NOT emit LOUD-ONCE', () => {
    MirrorMarker._resetWarnedOnceForTests();
    const corpus = Buffer.alloc(32, 0x11);
    const key = Buffer.from('iik_real');
    const marker = new MirrorMarker({ corpusSha: corpus, key });
    const messages: string[] = [];
    marker.sign(Buffer.from('a'), (m) => { messages.push(m); });
    expect(messages.length).toBe(0);
  });

  test('MirrorMarker rejects wrong-length corpus at construction', () => {
    expect(() => new MirrorMarker({ corpusSha: Buffer.alloc(31), key: Buffer.alloc(0) })).toThrow();
  });

  test('MirrorMarker.sign delegates to module-level sign', () => {
    MirrorMarker._resetWarnedOnceForTests();
    const corpus = Buffer.alloc(32);
    const marker = new MirrorMarker({ corpusSha: corpus, key: Buffer.alloc(0) });
    expect(marker.sign(Buffer.alloc(0))).toBe(KAT1_MARK);
  });
});

describe('canonical payload helpers', () => {
  test('canonicalLessonPlanReceiptPayload produces NUL-separated UTF-8', () => {
    const buf = canonicalLessonPlanReceiptPayload({
      lessonId: 'lp-1',
      keyStage: 'KS2',
      subject: 'Maths',
      curriculumVersion: 'KS2',
      teacherId: 't1',
      generatedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'FRESH_DFE',
    });
    const s = buf.toString('utf8');
    expect(s.startsWith('lesson_id=lp-1')).toBe(true);
    expect(s.split('\x00').length).toBe(7);
    expect(s).toContain('safeguarding_outcome=FRESH_DFE');
  });

  test('canonicalPupilWorksheetReceiptPayload has 6 NUL-separated fields', () => {
    const buf = canonicalPupilWorksheetReceiptPayload({
      worksheetId: 'ws-1',
      lessonId: 'lp-1',
      keyStage: 'KS2',
      contentHash: 'sha256:abc',
      emittedAtUnixMs: 1700000000000,
      safeguardingOutcome: 'FRESH_DFE',
    });
    expect(buf.toString('utf8').split('\x00').length).toBe(6);
  });
});
