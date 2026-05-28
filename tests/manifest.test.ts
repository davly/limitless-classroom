import { describe, test, expect } from 'vitest';
import {
  SCHEMA_VERSION,
  CURRICULUM_VERSION_EYFS,
  CURRICULUM_VERSION_KS1,
  CURRICULUM_VERSION_KS2,
  CURRICULUM_VERSION_KS3,
  CURRICULUM_VERSION_KS4,
  CURRICULUM_VERSION_A_LEVEL,
  CURRICULUM_VERSION_COUNT,
  ALL_CURRICULUM_VERSIONS,
  SUBJECT_COUNT,
  ALL_SUBJECTS,
  STALE_FRESH_AT,
  STALE_CURRICULUM_VERSION,
  STALE_SUBJECT_GUIDANCE,
  STALE_KCSiE_VERSION,
  STALE_OFSTED_HANDBOOK,
  STALE_DFE_GENAI_POLICY,
  STALE_EYFS_FRAMEWORK,
  STALE_LEGISLATION_AMENDED,
  STALE_UNKNOWN,
  STALE_SENTINELS,
  STALE_SENTINELS_COUNT,
  isStale,
  staleReason,
  CLASSROOM_MANIFEST,
  CLASSROOM_MANIFEST_COUNT,
  staleEntries,
  staleEntriesByReason,
  entriesByCategory,
  entriesByCurriculumVersion,
  entriesBySubject,
  type Entry,
} from '../src/manifest.js';

describe('Schema version pin', () => {
  test('SCHEMA_VERSION is the classroom.r150.v1 literal', () => {
    expect(SCHEMA_VERSION).toBe('classroom.r150.v1');
  });
});

describe('Curriculum-version axis (6 values)', () => {
  test('CURRICULUM_VERSION_COUNT is 6', () => {
    expect(CURRICULUM_VERSION_COUNT).toBe(6);
  });
  test('ALL_CURRICULUM_VERSIONS has 6 entries', () => {
    expect(ALL_CURRICULUM_VERSIONS.length).toBe(6);
  });
  test('canonical literals match', () => {
    expect(CURRICULUM_VERSION_EYFS).toBe('EYFS');
    expect(CURRICULUM_VERSION_KS1).toBe('KS1');
    expect(CURRICULUM_VERSION_KS2).toBe('KS2');
    expect(CURRICULUM_VERSION_KS3).toBe('KS3');
    expect(CURRICULUM_VERSION_KS4).toBe('KS4');
    expect(CURRICULUM_VERSION_A_LEVEL).toBe('A_LEVEL');
  });
});

describe('Subject axis (13 values)', () => {
  test('SUBJECT_COUNT is 13', () => {
    expect(SUBJECT_COUNT).toBe(13);
  });
  test('ALL_SUBJECTS has 13 entries', () => {
    expect(ALL_SUBJECTS.length).toBe(13);
  });
  test('Maths + English + Science present', () => {
    expect(ALL_SUBJECTS).toContain('Maths');
    expect(ALL_SUBJECTS).toContain('English');
    expect(ALL_SUBJECTS).toContain('Science');
  });
  test('PSHE + Computing + ReligiousEducation present', () => {
    expect(ALL_SUBJECTS).toContain('PSHE');
    expect(ALL_SUBJECTS).toContain('Computing');
    expect(ALL_SUBJECTS).toContain('ReligiousEducation');
  });
});

describe('9-path IsStale taxonomy', () => {
  test('STALE_SENTINELS_COUNT is 9', () => {
    expect(STALE_SENTINELS_COUNT).toBe(9);
  });
  test('STALE_SENTINELS has 9 entries', () => {
    expect(STALE_SENTINELS.length).toBe(9);
  });
  test('FRESH_AT sentinel is 1970-01-01', () => {
    expect(STALE_FRESH_AT).toBe('1970-01-01');
  });
  test('all sentinels are unique', () => {
    expect(new Set(STALE_SENTINELS).size).toBe(9);
  });
  test('each STALE_* constant is in STALE_SENTINELS', () => {
    for (const s of [
      STALE_FRESH_AT, STALE_CURRICULUM_VERSION, STALE_SUBJECT_GUIDANCE,
      STALE_KCSiE_VERSION, STALE_OFSTED_HANDBOOK, STALE_DFE_GENAI_POLICY,
      STALE_EYFS_FRAMEWORK, STALE_LEGISLATION_AMENDED, STALE_UNKNOWN,
    ]) {
      expect(STALE_SENTINELS).toContain(s);
    }
  });
});

describe('isStale + staleReason', () => {
  const freshEntry: Entry = {
    subject: 'x', curriculumVersion: 'KS2', subjectAxis: 'Maths',
    category: 'national_curriculum_subject', source: 'dfe_national_curriculum',
    freshAt: '2024-09-01', confidence: 'high', note: '',
  };
  const staleEntry: Entry = { ...freshEntry, freshAt: STALE_KCSiE_VERSION };

  test('fresh entry is not stale', () => {
    expect(isStale(freshEntry)).toBe(false);
    expect(staleReason(freshEntry)).toBe(null);
  });
  test('stale entry is stale', () => {
    expect(isStale(staleEntry)).toBe(true);
    expect(staleReason(staleEntry)).toBe('KCSiE_VERSION_SUPERSEDED');
  });
  test('STALE_FRESH_AT -> FRESH_AT_NEVER_UPDATED', () => {
    expect(staleReason({ ...freshEntry, freshAt: STALE_FRESH_AT })).toBe('FRESH_AT_NEVER_UPDATED');
  });
  test('STALE_CURRICULUM_VERSION -> CURRICULUM_VERSION_SUPERSEDED', () => {
    expect(staleReason({ ...freshEntry, freshAt: STALE_CURRICULUM_VERSION })).toBe('CURRICULUM_VERSION_SUPERSEDED');
  });
  test('STALE_OFSTED_HANDBOOK -> OFSTED_HANDBOOK_UPDATED', () => {
    expect(staleReason({ ...freshEntry, freshAt: STALE_OFSTED_HANDBOOK })).toBe('OFSTED_HANDBOOK_UPDATED');
  });
  test('STALE_DFE_GENAI_POLICY -> DFE_GENAI_POLICY_UPDATED', () => {
    expect(staleReason({ ...freshEntry, freshAt: STALE_DFE_GENAI_POLICY })).toBe('DFE_GENAI_POLICY_UPDATED');
  });
  test('STALE_EYFS_FRAMEWORK -> EYFS_FRAMEWORK_UPDATED', () => {
    expect(staleReason({ ...freshEntry, freshAt: STALE_EYFS_FRAMEWORK })).toBe('EYFS_FRAMEWORK_UPDATED');
  });
  test('STALE_LEGISLATION_AMENDED -> LEGISLATION_AMENDED', () => {
    expect(staleReason({ ...freshEntry, freshAt: STALE_LEGISLATION_AMENDED })).toBe('LEGISLATION_AMENDED');
  });
  test('STALE_UNKNOWN -> UNKNOWN_PENDING_REVIEW', () => {
    expect(staleReason({ ...freshEntry, freshAt: STALE_UNKNOWN })).toBe('UNKNOWN_PENDING_REVIEW');
  });
});

describe('CLASSROOM_MANIFEST', () => {
  test('CLASSROOM_MANIFEST_COUNT is 16', () => {
    expect(CLASSROOM_MANIFEST_COUNT).toBe(16);
  });
  test('CLASSROOM_MANIFEST has 16 entries', () => {
    expect(CLASSROOM_MANIFEST.length).toBe(16);
  });
  test('CLASSROOM_MANIFEST.length === CLASSROOM_MANIFEST_COUNT (firewall pin)', () => {
    expect(CLASSROOM_MANIFEST.length).toBe(CLASSROOM_MANIFEST_COUNT);
  });
  test('each entry has valid source string', () => {
    for (const e of CLASSROOM_MANIFEST) {
      expect(e.source.length).toBeGreaterThan(0);
      expect(e.confidence === 'high' || e.confidence === 'medium' || e.confidence === 'low' || e.confidence === 'unknown').toBe(true);
    }
  });
  test('KCSiE statutory entry is stale (unknown)', () => {
    const e = CLASSROOM_MANIFEST.find((x) => x.subject === 'kcsie_statutory_guidance_reference');
    expect(e).not.toBeUndefined();
    expect(isStale(e as Entry)).toBe(true);
  });
  test('Ofsted handbook 2024 entry is fresh', () => {
    const e = CLASSROOM_MANIFEST.find((x) => x.subject === 'ofsted_handbook_2024_reference');
    expect(isStale(e as Entry)).toBe(false);
  });
  test('staleEntries returns honest-TODO entries', () => {
    const stale = staleEntries();
    expect(stale.length).toBeGreaterThan(0);
    expect(stale.length).toBeLessThan(CLASSROOM_MANIFEST.length);
  });
  test('staleEntriesByReason returns a Map with at least one stale reason', () => {
    const m = staleEntriesByReason();
    expect(m.size).toBeGreaterThan(0);
  });
});

describe('entriesByCurriculumVersion / entriesBySubject', () => {
  test('KS2 entries include cross-cutting entries', () => {
    const ks2 = entriesByCurriculumVersion('KS2');
    expect(ks2.length).toBeGreaterThan(2);
    // KCSiE is cross-cutting (curriculumVersion === null), should appear.
    expect(ks2.some((e) => e.subject === 'kcsie_statutory_guidance_reference')).toBe(true);
  });
  test('EYFS entries include EYFS-specific + cross-cutting', () => {
    const eyfs = entriesByCurriculumVersion('EYFS');
    expect(eyfs.length).toBeGreaterThan(1);
    expect(eyfs.some((e) => e.subject === 'eyfs_seven_areas_of_learning')).toBe(true);
  });
  test('Maths subject includes Maths + cross-cutting', () => {
    const m = entriesBySubject('Maths');
    expect(m.length).toBeGreaterThan(1);
    expect(m.some((e) => e.subjectAxis === 'Maths')).toBe(true);
  });
  test('entriesByCategory finds national_curriculum_subject rows', () => {
    const ncs = entriesByCategory('national_curriculum_subject');
    expect(ncs.length).toBeGreaterThan(0);
  });
});
