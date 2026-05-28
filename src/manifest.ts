/**
 * R150 PARALLEL-MAP review-metadata envelope for Limitless Classroom.
 *
 * R150 (R-PARALLEL-MAP-R144-REVIEW-METADATA-SIBLING, promoted 2026-05-22)
 * requires every flagship's static curated content to ship the canonical
 * 5-field schematised-knowledge envelope:
 *
 *   1. source        -- citation / provenance string
 *   2. freshAt       -- ISO-8601 date the source was last verified
 *   3. schemaVersion -- pinned schema-version literal
 *   4. confidence    -- degree-of-justification (low/medium/high/unknown)
 *   5. note          -- free-text citation specifics + IsStale sentinel
 *
 * # Curriculum-version axis (Class-3 jurisdiction-version anchored)
 *
 * Classroom's manifest extends the R150 envelope with a 2-D axis pair:
 *
 *   curriculumVersion axis: KS1 / KS2 / KS3 / KS4 / A-level / EYFS
 *     (covers reception through year-13, plus EYFS for under-5s)
 *
 *   subject axis: Maths / English / Science / History / Geography /
 *     Modern Languages / Computing / RE / PSHE / Art / Music / PE /
 *     Design and Technology
 *
 * Every entry asserts (curriculumVersion, subject) so a reviewer scanning
 * the manifest can immediately see which Key Stage + subject combinations
 * are pinned and which honestly admit they're not yet covered.
 *
 * # Why a 9-path IsStale taxonomy
 *
 * R150 IsStale isn't binary -- a piece of curated knowledge can be stale
 * along nine independent axes:
 *
 *   1. STALE_FRESH_AT              -- the freshAt sentinel was never updated
 *   2. STALE_CURRICULUM_VERSION    -- DfE updated KS1/2/3/4 or A-level spec
 *   3. STALE_SUBJECT_GUIDANCE      -- subject association updated guidance
 *   4. STALE_KCSiE_VERSION         -- KCSiE statutory version superseded
 *   5. STALE_OFSTED_HANDBOOK       -- Ofsted handbook updated
 *   6. STALE_DFE_GENAI_POLICY      -- DfE GenAI policy paper updated
 *   7. STALE_EYFS_FRAMEWORK        -- EYFS statutory framework updated
 *   8. STALE_LEGISLATION_AMENDED   -- underlying Education Act amendment
 *   9. STALE_UNKNOWN               -- caller marked unknown / under review
 *
 * 7 honest-TODO sentinels are exposed as exports so Phase-2 freshness-
 * checking code can switch on them rather than parse free-text.
 */

/**
 * SchemaVersion pins the canonical R150 schematised-knowledge schema
 * version. Bumped only on additive-and-non-breaking schema changes. Any
 * breaking change forces a new constant + parallel surface during
 * migration (R145-strict additive discipline).
 */
export const SCHEMA_VERSION: string = 'classroom.r150.v1';

/** R150 confidence ladder. Aligned with the ecosystem cohort. */
export type Confidence = 'high' | 'medium' | 'low' | 'unknown';

// ---------------------------------------------------------------------------
// Curriculum-version axis -- Key Stages + EYFS + A-level.
// ---------------------------------------------------------------------------

/** Key Stage / EYFS / A-level discriminator. Closed enum per R115. */
export type CurriculumVersion =
  | 'EYFS'       // Early Years (birth to 5)
  | 'KS1'        // Key Stage 1 (years 1-2, ages 5-7)
  | 'KS2'        // Key Stage 2 (years 3-6, ages 7-11)
  | 'KS3'        // Key Stage 3 (years 7-9, ages 11-14)
  | 'KS4'        // Key Stage 4 (years 10-11, ages 14-16; GCSE)
  | 'A_LEVEL';   // Post-16 A-level (years 12-13, ages 16-18)

export const CURRICULUM_VERSION_EYFS: CurriculumVersion = 'EYFS';
export const CURRICULUM_VERSION_KS1: CurriculumVersion = 'KS1';
export const CURRICULUM_VERSION_KS2: CurriculumVersion = 'KS2';
export const CURRICULUM_VERSION_KS3: CurriculumVersion = 'KS3';
export const CURRICULUM_VERSION_KS4: CurriculumVersion = 'KS4';
export const CURRICULUM_VERSION_A_LEVEL: CurriculumVersion = 'A_LEVEL';

/** Pinned closed-enum cardinality for the cohort firewall test. */
export const CURRICULUM_VERSION_COUNT: number = 6;

/** All curriculum versions in canonical order. */
export const ALL_CURRICULUM_VERSIONS: ReadonlyArray<CurriculumVersion> = Object.freeze([
  CURRICULUM_VERSION_EYFS,
  CURRICULUM_VERSION_KS1,
  CURRICULUM_VERSION_KS2,
  CURRICULUM_VERSION_KS3,
  CURRICULUM_VERSION_KS4,
  CURRICULUM_VERSION_A_LEVEL,
]);

// ---------------------------------------------------------------------------
// Subject axis -- the subject-association vocabulary in current use.
// ---------------------------------------------------------------------------

/**
 * Subject vocabulary. Closed enum per R115; mirrors the DfE national
 * curriculum + DfE post-16 vocational/A-level subject codes at the
 * coarse-grained tier (specific A-level boards subdivide further).
 */
export type Subject =
  | 'Maths'
  | 'English'
  | 'Science'
  | 'History'
  | 'Geography'
  | 'ModernLanguages'
  | 'Computing'
  | 'ReligiousEducation'
  | 'PSHE'
  | 'Art'
  | 'Music'
  | 'PE'
  | 'DesignAndTechnology';

export const ALL_SUBJECTS: ReadonlyArray<Subject> = Object.freeze([
  'Maths',
  'English',
  'Science',
  'History',
  'Geography',
  'ModernLanguages',
  'Computing',
  'ReligiousEducation',
  'PSHE',
  'Art',
  'Music',
  'PE',
  'DesignAndTechnology',
]);

/** Pinned closed-enum cardinality for the cohort firewall test. */
export const SUBJECT_COUNT: number = 13;

// ---------------------------------------------------------------------------
// Source vocabulary.
// ---------------------------------------------------------------------------

export const SOURCE_DFE_NATIONAL_CURRICULUM = 'dfe_national_curriculum';
export const SOURCE_DFE_GENAI_POLICY = 'dfe_genai_in_education_policy';
export const SOURCE_OFSTED_HANDBOOK = 'ofsted_school_inspection_handbook_2024';
export const SOURCE_KCSiE_STATUTORY = 'kcsie_statutory_guidance';
export const SOURCE_EYFS_FRAMEWORK = 'eyfs_statutory_framework';
export const SOURCE_FOUNDER_BRIEF = 'classroom_founder_brief';
export const SOURCE_COMMUNITY_BEST_PRACTICE = 'community_best_practice';

// ---------------------------------------------------------------------------
// IsStale taxonomy -- 9 honest-TODO sentinels.
// ---------------------------------------------------------------------------

/**
 * 9-path IsStale taxonomy. Each sentinel is the exact `freshAt` literal
 * that triggers the corresponding stale-path. Phase-2 freshness-checking
 * code switches on these rather than parsing free-text.
 *
 * Sentinel literals use the `1970-01-01` ISO date base + a discriminator
 * suffix so they sort together when sorted alphabetically while remaining
 * distinct as enum values.
 */
export const STALE_FRESH_AT: string = '1970-01-01';
export const STALE_CURRICULUM_VERSION: string = '1970-01-02';
export const STALE_SUBJECT_GUIDANCE: string = '1970-01-03';
export const STALE_KCSiE_VERSION: string = '1970-01-04';
export const STALE_OFSTED_HANDBOOK: string = '1970-01-05';
export const STALE_DFE_GENAI_POLICY: string = '1970-01-06';
export const STALE_EYFS_FRAMEWORK: string = '1970-01-07';
export const STALE_LEGISLATION_AMENDED: string = '1970-01-08';
export const STALE_UNKNOWN: string = '1970-01-09';

/** Canonical list of all 9 stale sentinels. Pinned for the firewall. */
export const STALE_SENTINELS: ReadonlyArray<string> = Object.freeze([
  STALE_FRESH_AT,
  STALE_CURRICULUM_VERSION,
  STALE_SUBJECT_GUIDANCE,
  STALE_KCSiE_VERSION,
  STALE_OFSTED_HANDBOOK,
  STALE_DFE_GENAI_POLICY,
  STALE_EYFS_FRAMEWORK,
  STALE_LEGISLATION_AMENDED,
  STALE_UNKNOWN,
]);

/** Pinned stale-sentinel cardinality for the cohort firewall. */
export const STALE_SENTINELS_COUNT: number = 9;

// ---------------------------------------------------------------------------
// Entry shape.
// ---------------------------------------------------------------------------

/**
 * R150 5-field schematised-knowledge envelope, extended with the
 * curriculum-version + subject axis pair.
 */
export interface Entry {
  /** Canonical subject name. Non-empty, unique within (curriculumVersion, subject, category). */
  readonly subject: string;
  /**
   * The (curriculumVersion, subjectAxis) pair this entry pins. NULLABLE for
   * cross-cutting entries (e.g. KCSiE statutory guidance applies to ALL
   * curriculum versions).
   */
  readonly curriculumVersion: CurriculumVersion | null;
  readonly subjectAxis: Subject | null;
  /** Knowledge-surface category. */
  readonly category: string;
  /** Source constant. One of the SOURCE_* exports. */
  readonly source: string;
  /** ISO-8601 date (YYYY-MM-DD) the source was last verified. */
  readonly freshAt: string;
  /** Confidence label. */
  readonly confidence: Confidence;
  /** Free-text citation specifics + IsStale rationale where applicable. */
  readonly note: string;
}

/** Returns true if the entry's freshAt is any of the 9 stale sentinels. */
export function isStale(e: Entry): boolean {
  return STALE_SENTINELS.includes(e.freshAt);
}

/** Returns which stale path the entry is on, or null if fresh. */
export function staleReason(e: Entry): string | null {
  if (!isStale(e)) return null;
  switch (e.freshAt) {
    case STALE_FRESH_AT:
      return 'FRESH_AT_NEVER_UPDATED';
    case STALE_CURRICULUM_VERSION:
      return 'CURRICULUM_VERSION_SUPERSEDED';
    case STALE_SUBJECT_GUIDANCE:
      return 'SUBJECT_GUIDANCE_SUPERSEDED';
    case STALE_KCSiE_VERSION:
      return 'KCSiE_VERSION_SUPERSEDED';
    case STALE_OFSTED_HANDBOOK:
      return 'OFSTED_HANDBOOK_UPDATED';
    case STALE_DFE_GENAI_POLICY:
      return 'DFE_GENAI_POLICY_UPDATED';
    case STALE_EYFS_FRAMEWORK:
      return 'EYFS_FRAMEWORK_UPDATED';
    case STALE_LEGISLATION_AMENDED:
      return 'LEGISLATION_AMENDED';
    case STALE_UNKNOWN:
      return 'UNKNOWN_PENDING_REVIEW';
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Canonical manifest.
// ---------------------------------------------------------------------------

/**
 * Canonical Classroom manifest. Covers (curriculum-version × subject) +
 * statutory / inspection / GenAI-policy cross-cutting entries. Frozen at
 * module load so callers cannot mutate the cohort firewall surface at
 * runtime.
 */
export const CLASSROOM_MANIFEST: ReadonlyArray<Entry> = Object.freeze([
  // -------- Statutory guidance (cross-cutting, no Key Stage anchor) --------
  Object.freeze({
    subject: 'kcsie_statutory_guidance_reference',
    curriculumVersion: null,
    subjectAxis: null,
    category: 'statutory_safeguarding',
    source: SOURCE_KCSiE_STATUTORY,
    freshAt: STALE_KCSiE_VERSION,
    confidence: 'unknown',
    note: 'KCSiE statutory guidance reference. Honest-TODO: live KCSiE version in force is the ground truth; this entry tracks the freshness axis but does NOT pin a version. Phase-2 freshness check switches on STALE_KCSiE_VERSION.',
  }),
  Object.freeze({
    subject: 'ofsted_handbook_2024_reference',
    curriculumVersion: null,
    subjectAxis: null,
    category: 'inspection_framework',
    source: SOURCE_OFSTED_HANDBOOK,
    freshAt: '2024-09-01',
    confidence: 'medium',
    note: 'Ofsted School Inspection Handbook 2024 (September 2024 revision). Founder-anchored to this version; counsel review pending per legal/REVIEW.md.',
  }),
  Object.freeze({
    subject: 'dfe_genai_policy_2023_2024',
    curriculumVersion: null,
    subjectAxis: null,
    category: 'policy_reference',
    source: SOURCE_DFE_GENAI_POLICY,
    freshAt: STALE_DFE_GENAI_POLICY,
    confidence: 'low',
    note: 'DfE generative AI policy paper (March 2023, October 2023 update, 2024-2025 incremental updates). Honest-TODO: live policy version is the ground truth; this entry tracks the freshness axis but does NOT pin a version.',
  }),
  Object.freeze({
    subject: 'eyfs_statutory_framework_reference',
    curriculumVersion: 'EYFS',
    subjectAxis: null,
    category: 'statutory_framework',
    source: SOURCE_EYFS_FRAMEWORK,
    freshAt: STALE_EYFS_FRAMEWORK,
    confidence: 'unknown',
    note: 'EYFS statutory framework. Honest-TODO: live version in force is the ground truth; this entry tracks the freshness axis but does NOT pin a version. Phase-2 freshness check switches on STALE_EYFS_FRAMEWORK.',
  }),

  // -------- KS1 entries --------
  Object.freeze({
    subject: 'maths_curriculum_KS1',
    curriculumVersion: 'KS1',
    subjectAxis: 'Maths',
    category: 'national_curriculum_subject',
    source: SOURCE_DFE_NATIONAL_CURRICULUM,
    freshAt: '2014-09-01',
    confidence: 'high',
    note: 'National curriculum in England (2014 framework, Maths KS1). Number / place value / addition / subtraction / multiplication / division / fractions / measurement / geometry / statistics. Long-standing framework; freshness verified against most recent DfE National Curriculum publication page.',
  }),
  Object.freeze({
    subject: 'english_curriculum_KS1',
    curriculumVersion: 'KS1',
    subjectAxis: 'English',
    category: 'national_curriculum_subject',
    source: SOURCE_DFE_NATIONAL_CURRICULUM,
    freshAt: '2014-09-01',
    confidence: 'high',
    note: 'National curriculum in England (2014 framework, English KS1). Spoken language / reading / writing / vocabulary, grammar and punctuation / spelling. Long-standing framework.',
  }),

  // -------- KS2 entries --------
  Object.freeze({
    subject: 'maths_curriculum_KS2',
    curriculumVersion: 'KS2',
    subjectAxis: 'Maths',
    category: 'national_curriculum_subject',
    source: SOURCE_DFE_NATIONAL_CURRICULUM,
    freshAt: '2014-09-01',
    confidence: 'high',
    note: 'National curriculum in England (2014 framework, Maths KS2). Lower KS2 (years 3-4) + upper KS2 (years 5-6). Number / fractions including decimals / measurement / geometry / statistics / ratio and proportion / algebra (year 6).',
  }),
  Object.freeze({
    subject: 'science_curriculum_KS2',
    curriculumVersion: 'KS2',
    subjectAxis: 'Science',
    category: 'national_curriculum_subject',
    source: SOURCE_DFE_NATIONAL_CURRICULUM,
    freshAt: '2014-09-01',
    confidence: 'high',
    note: 'National curriculum in England (2014 framework, Science KS2). Living things and their habitats / animals including humans / states of matter / sound / electricity / light / forces.',
  }),

  // -------- KS3 entries --------
  Object.freeze({
    subject: 'computing_curriculum_KS3',
    curriculumVersion: 'KS3',
    subjectAxis: 'Computing',
    category: 'national_curriculum_subject',
    source: SOURCE_DFE_NATIONAL_CURRICULUM,
    freshAt: '2014-09-01',
    confidence: 'high',
    note: 'National curriculum in England (2014 framework, Computing KS3). Programming in two languages, computational thinking, design and develop modular programs, simple Boolean logic and arithmetic, networks including the Internet, online safety. Highly relevant to AI-assisted classroom-content emission.',
  }),
  Object.freeze({
    subject: 'pshe_curriculum_KS3',
    curriculumVersion: 'KS3',
    subjectAxis: 'PSHE',
    category: 'statutory_subject',
    source: SOURCE_DFE_NATIONAL_CURRICULUM,
    freshAt: STALE_SUBJECT_GUIDANCE,
    confidence: 'low',
    note: 'PSHE / Relationships Education / RSE / Health Education statutory guidance applies. Honest-TODO: subject guidance is non-statutory in framework form but the relationships and health components are statutory under DfE guidance. Phase-2 freshness check switches on STALE_SUBJECT_GUIDANCE.',
  }),

  // -------- KS4 entries --------
  Object.freeze({
    subject: 'english_gcse_KS4',
    curriculumVersion: 'KS4',
    subjectAxis: 'English',
    category: 'gcse_specification_reference',
    source: SOURCE_DFE_NATIONAL_CURRICULUM,
    freshAt: STALE_CURRICULUM_VERSION,
    confidence: 'medium',
    note: 'GCSE English Language and English Literature subject content (DfE 2013 publication, with various exam-board specifications). Honest-TODO: exam-board specifications evolve faster than the DfE subject content. Phase-2 freshness check switches on STALE_CURRICULUM_VERSION.',
  }),
  Object.freeze({
    subject: 'science_gcse_KS4',
    curriculumVersion: 'KS4',
    subjectAxis: 'Science',
    category: 'gcse_specification_reference',
    source: SOURCE_DFE_NATIONAL_CURRICULUM,
    freshAt: STALE_CURRICULUM_VERSION,
    confidence: 'medium',
    note: 'GCSE Combined Science / Biology / Chemistry / Physics subject content. Honest-TODO: per exam-board specifications evolve.',
  }),

  // -------- A-level entries --------
  Object.freeze({
    subject: 'maths_a_level',
    curriculumVersion: 'A_LEVEL',
    subjectAxis: 'Maths',
    category: 'a_level_specification_reference',
    source: SOURCE_DFE_NATIONAL_CURRICULUM,
    freshAt: STALE_CURRICULUM_VERSION,
    confidence: 'medium',
    note: 'A-level Mathematics subject content (DfE 2014 publication; AS + A-level structure). Pure mathematics, mechanics, statistics. Honest-TODO: per exam-board specifications evolve.',
  }),
  Object.freeze({
    subject: 'computing_a_level',
    curriculumVersion: 'A_LEVEL',
    subjectAxis: 'Computing',
    category: 'a_level_specification_reference',
    source: SOURCE_DFE_NATIONAL_CURRICULUM,
    freshAt: STALE_CURRICULUM_VERSION,
    confidence: 'medium',
    note: 'A-level Computer Science subject content. Programming, algorithms, theory of computation, data structures, networks, security, ethics. Highly relevant to AI-assisted classroom-content emission.',
  }),

  // -------- EYFS entry --------
  Object.freeze({
    subject: 'eyfs_seven_areas_of_learning',
    curriculumVersion: 'EYFS',
    subjectAxis: null,
    category: 'eyfs_areas_of_learning',
    source: SOURCE_EYFS_FRAMEWORK,
    freshAt: STALE_EYFS_FRAMEWORK,
    confidence: 'unknown',
    note: 'EYFS seven areas of learning and development: 3 prime (communication and language / physical development / personal, social and emotional development) + 4 specific (literacy / mathematics / understanding the world / expressive arts and design). Honest-TODO: live EYFS framework version is the ground truth.',
  }),

  // -------- Cross-cutting AI usage entry --------
  Object.freeze({
    subject: 'ai_assisted_classroom_content_emission_disclosure',
    curriculumVersion: null,
    subjectAxis: null,
    category: 'ai_usage_disclosure',
    source: SOURCE_FOUNDER_BRIEF,
    freshAt: '2026-05-27',
    confidence: 'medium',
    note: 'Founder-brief specification: AI-assisted classroom-content emission MUST disclose AI involvement to teacher; teacher signoff before pupil-facing emit; safeguarding-gate mandatory; audit-trail via Mirror-Mark.',
  }),
]);

/** Canonical entry count for the cohort firewall pin. */
export const CLASSROOM_MANIFEST_COUNT: number = 16;

/**
 * Lookup helper -- returns entries matching a category.
 */
export function entriesByCategory(category: string): ReadonlyArray<Entry> {
  return CLASSROOM_MANIFEST.filter((e) => e.category === category);
}

/**
 * Lookup helper -- returns entries matching a curriculum version.
 * NULL-valued entries (cross-cutting) match every curriculum version.
 */
export function entriesByCurriculumVersion(cv: CurriculumVersion): ReadonlyArray<Entry> {
  return CLASSROOM_MANIFEST.filter(
    (e) => e.curriculumVersion === cv || e.curriculumVersion === null,
  );
}

/**
 * Lookup helper -- returns entries matching a subject.
 * NULL-valued entries (cross-cutting) match every subject.
 */
export function entriesBySubject(s: Subject): ReadonlyArray<Entry> {
  return CLASSROOM_MANIFEST.filter(
    (e) => e.subjectAxis === s || e.subjectAxis === null,
  );
}

/**
 * Returns all entries flagged as stale (any of the 9 stale paths).
 * Useful for the cohort firewall test that pins the count of
 * honest-TODO entries.
 */
export function staleEntries(): ReadonlyArray<Entry> {
  return CLASSROOM_MANIFEST.filter(isStale);
}

/**
 * Returns the count of stale entries grouped by reason.
 */
export function staleEntriesByReason(): ReadonlyMap<string, number> {
  const m = new Map<string, number>();
  for (const e of CLASSROOM_MANIFEST) {
    const reason = staleReason(e);
    if (reason !== null) {
      m.set(reason, (m.get(reason) ?? 0) + 1);
    }
  }
  return m;
}
