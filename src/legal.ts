/**
 * R166 R-LIABILITY-FOOTER-CONST + REVIEWED-BY-COUNSEL-FALSE for Limitless
 * Classroom.
 *
 * R166 (promoted 2026-05-27) requires every flagship shipping founder-
 * authored legal text on a domain-bearing surface to satisfy a 3-element
 * discipline:
 *
 *   1. The liability footer is a TYPED CONSTANT in domain code, NEVER a
 *      string literal inlined at the call site. The named constant is
 *      grep-discoverable and version-controlled.
 *
 *   2. The flagship ships a paired `REVIEWED_BY_COUNSEL: boolean = false`
 *      module-level / dataclass-level honest-default sentinel. The
 *      boolean defaults to false; flipping to true is a behaviour-
 *      changing event requiring its own additive branch per R145.B and a
 *      named-counsel signoff commit message.
 *
 *   3. The constant + sentinel pair is documented in CONTEXT.md /
 *      SECURITY.md as an honest-disclosure scope contract -- operators
 *      reading the source see the founder-authored boundary explicitly.
 *
 * Limitless Classroom is the 12th cohort member (and 2nd TypeScript) after:
 *   forgefit (Go) + tidepool (Go) + paradox (Go) + casino (Go) +
 *   ledger (Go) + haven (Python) + dreamcatcher (Python) + diagnosis
 *   (Prolog) + arbiter-legal (Go) + catala-forge (Python) + conjure
 *   (TypeScript) + limitless-classroom (THIS MODULE).
 *
 * # Ofsted + DfE references (citation-only, NOT inline legal advice)
 *
 *   - Ofsted School Inspection Handbook 2024 (for maintained schools and
 *     academies). Authoritative source:
 *     https://www.gov.uk/government/publications/school-inspection-handbook-eif
 *
 *   - DfE policy paper "Generative artificial intelligence (AI) in
 *     education" (March 2023, updated October 2023, with further updates
 *     during 2024-2025). Authoritative source:
 *     https://www.gov.uk/government/publications/generative-artificial-intelligence-in-education
 *
 *   - Keeping Children Safe in Education (KCSiE) statutory guidance --
 *     the live version in force at the time of pupil contact is the
 *     ground truth, NOT a hardcoded snapshot. Authoritative source:
 *     https://www.gov.uk/government/publications/keeping-children-safe-in-education--2
 *
 *   - Early Years Foundation Stage (EYFS) statutory framework.
 *     Authoritative source:
 *     https://www.gov.uk/government/publications/early-years-foundation-stage-framework--2
 *
 *   - UK GDPR Article 6 lawful basis + Article 9 special-category
 *     personal data + Article 8 conditions applicable to child's consent
 *     in relation to information society services + Article 35 DPIA.
 *     Authoritative source: https://www.legislation.gov.uk/eur/2016/679
 *
 *   - DfE "Meeting digital and technology standards in schools and
 *     colleges". Authoritative source:
 *     https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges
 *
 *   - PSHE / Relationships and Sex Education statutory guidance (relevant
 *     to safeguarding gates around content). Authoritative source:
 *     https://www.gov.uk/government/publications/relationships-education-relationships-and-sex-education-rse-and-health-education
 */

/**
 * Founder-drafted liability footer. The Ofsted-grade audit trail surface,
 * the DfE GenAI-in-Education compliance posture, the KCSiE safeguarding
 * gate, and the Article 9 special-category data flow are all founder
 * specifications. Counsel review (qualified UK education-law solicitor)
 * has NOT YET completed.
 *
 * GREP-DISCOVERABLE: `grep -rn 'LEGAL_LIABILITY_FOOTER' src/` finds this
 * constant + every call site. NEVER inline a string literal of this text
 * at a call site.
 */
export const LEGAL_LIABILITY_FOOTER: string =
  'Limitless Classroom is a Limitless flagship. References to Ofsted School ' +
  'Inspection Handbook 2024, the DfE "Generative AI in Education" policy ' +
  'paper, Keeping Children Safe in Education (KCSiE) statutory guidance, ' +
  'the Early Years Foundation Stage (EYFS) framework, and UK GDPR Articles 6 / ' +
  '8 / 9 / 35 are citation-only -- the live version in force at the time of ' +
  'pupil contact is the ground truth, NOT this software. Founder-drafted ' +
  'mappings (Key Stage <-> subject curriculum coverage; safeguarding outcome ' +
  'literals; manifest freshness axes; advisory severity ladder) have NOT YET ' +
  'been reviewed by a qualified UK education-law solicitor. This library ' +
  'recommends host acts: the host school / MAT / LA / DfE-funded program is ' +
  'responsible for qualified counsel review of all safeguarding / data-protection / ' +
  'age-gating / curriculum surfaces BEFORE any pupil-facing emission. ' +
  'Classroom does NOT constitute legal advice and does NOT discharge the ' +
  'school\'s statutory duties under the Children Act 2004, Education Act 2002, ' +
  'or any other relevant legislation. Operators reading this footer MUST ' +
  'consult counsel admitted in the relevant jurisdiction (England + Wales / ' +
  'Scotland / Northern Ireland have distinct education-law regimes).';

/**
 * R166 honest-default sentinel. MUST default to false at module load.
 *
 * Flipping this to `true` is a behaviour-changing event per R145.B
 * SIBLING-NOT-STACKED -- it MUST land on its own additive branch with a
 * commit message naming:
 *   - The qualified counsel (full name + Law Society / Bar Council
 *     admission jurisdiction).
 *   - The date of counsel signoff.
 *   - The scope of counsel review (which surfaces are validated).
 *   - The KCSiE / Ofsted handbook / DfE GenAI policy versions in force at
 *     review time.
 *
 * Reading `REVIEWED_BY_COUNSEL === false` SHOULD trigger the R143
 * `CLASSROOM_OFSTED_HANDBOOK_NOT_REVIEWED` /
 * `CLASSROOM_DFE_GENAI_POLICY_NOT_REVIEWED` /
 * `CLASSROOM_KCSiE_STATUTORY_NOT_LIVE` LOUD-ONCE-WARN advisories at boot.
 */
export const REVIEWED_BY_COUNSEL: boolean = false;

/**
 * R166 LIBRARY-RECOMMENDS-HOST-ACTS expression. The library scope ends at
 * "name the boundary"; the host (school / MAT / LA) MUST act on the
 * boundary before any pupil-facing emission lands.
 *
 * Five named host acts:
 *
 *   1. Engage qualified counsel for review of the safeguarding gate +
 *      KCSiE alignment + Article 9 data-flow + Ofsted-handbook references.
 *   2. School DPO completes Article 35 DPIA covering AI-assisted
 *      classroom-content emission to pupils (specific-special-category
 *      lawful basis identified per Article 9(2)).
 *   3. School DSL signs off the KCSiE safeguarding gate posture against
 *      the live KCSiE version in force.
 *   4. Update privacy notice + parent-facing AI usage disclosure with
 *      counsel-validated language; parental consent recorded per Article 8
 *      where the school relies on consent.
 *   5. Flip REVIEWED_BY_COUNSEL to true on its own R145.B SIBLING-NOT-STACKED
 *      branch with a commit message naming the counsel + DPO + DSL + date
 *      + scope.
 */
export const LIBRARY_RECOMMENDS_HOST_ACTS: string =
  'LIBRARY-RECOMMENDS-HOST-ACTS: ' +
  '(1) Engage qualified counsel for review of safeguarding gate + KCSiE alignment ' +
  '+ Article 9 special-category data-flow + Ofsted-handbook references. ' +
  '(2) School DPO completes UK GDPR Article 35 DPIA covering AI-assisted ' +
  'classroom-content emission to pupils with specific-special-category ' +
  'lawful basis identified per Article 9(2). ' +
  '(3) School DSL signs off the KCSiE safeguarding-gate posture against the ' +
  'KCSiE version in force at the time of pupil contact. ' +
  '(4) Update privacy notice + parent-facing AI usage disclosure with ' +
  'counsel-validated language; parental consent recorded per Article 8 ' +
  'where the school relies on consent as the Article 6 lawful basis. ' +
  '(5) Flip REVIEWED_BY_COUNSEL to true on its own R145.B SIBLING-NOT-STACKED ' +
  'branch with a commit message naming the counsel + DPO + DSL + date + scope ' +
  '+ KCSiE/Ofsted/DfE versions in force at review time.';

/**
 * Citation record -- one row per authoritative source. Used by counsel and
 * inspectors to cross-reference the source-of-truth URL alongside the
 * version-in-force at the time of pupil contact.
 */
export interface Citation {
  /** Short canonical name; grep-discoverable. */
  readonly name: string;
  /** Authoritative URL (gov.uk / legislation.gov.uk / EUR-Lex). */
  readonly regulatorUrl: string;
  /**
   * Issuing body short name (Ofsted / DfE / Parliament / ICO / EU).
   * Used for the cohort firewall pin (count by body).
   */
  readonly issuer: string;
  /**
   * Free-text scope: which surface of Classroom is anchored to this
   * citation. Loud-by-name for greppability.
   */
  readonly scopeNote: string;
}

/**
 * The canonical Classroom citation list. Each entry is grep-discoverable.
 * Adding a citation requires updating LEGAL_CITATIONS_COUNT and the
 * cohort firewall test.
 */
export const LEGAL_CITATIONS: ReadonlyArray<Citation> = Object.freeze([
  Object.freeze({
    name: 'Ofsted School Inspection Handbook 2024',
    regulatorUrl:
      'https://www.gov.uk/government/publications/school-inspection-handbook-eif',
    issuer: 'Ofsted',
    scopeNote:
      'AI-assisted classroom content emission audit-trail expectations under the EIF (Education Inspection Framework). Cited by manifest entries with curriculum_version axis.',
  }),
  Object.freeze({
    name: 'DfE Generative AI in Education Policy Paper',
    regulatorUrl:
      'https://www.gov.uk/government/publications/generative-artificial-intelligence-in-education',
    issuer: 'DfE',
    scopeNote:
      'DfE position on safe, effective and proportionate use of generative AI in education settings. Cited by the safeguarding-gate refusal-on-stale logic.',
  }),
  Object.freeze({
    name: 'Keeping Children Safe in Education (KCSiE) Statutory Guidance',
    regulatorUrl:
      'https://www.gov.uk/government/publications/keeping-children-safe-in-education--2',
    issuer: 'DfE',
    scopeNote:
      'Statutory safeguarding guidance under Section 175 Education Act 2002. The live version in force at the time of pupil contact is the ground truth; cited by safeguarding_gate.ts SafeguardingOutcome.KCSiE_STALE.',
  }),
  Object.freeze({
    name: 'Early Years Foundation Stage (EYFS) Statutory Framework',
    regulatorUrl:
      'https://www.gov.uk/government/publications/early-years-foundation-stage-framework--2',
    issuer: 'DfE',
    scopeNote:
      'Statutory framework covering learning, development and care for children from birth to 5. Cited by safeguarding_gate.ts SafeguardingOutcome.EYFS_STALE.',
  }),
  Object.freeze({
    name: 'UK GDPR Article 6 (Lawfulness of processing)',
    regulatorUrl: 'https://www.legislation.gov.uk/eur/2016/679/article/6',
    issuer: 'Parliament',
    scopeNote:
      'Article 6 lawful basis selection is the school DPO\'s responsibility. Classroom is a processor under Article 28.',
  }),
  Object.freeze({
    name: 'UK GDPR Article 8 (Conditions applicable to child\'s consent)',
    regulatorUrl: 'https://www.legislation.gov.uk/eur/2016/679/article/8',
    issuer: 'Parliament',
    scopeNote:
      'Where the school relies on consent under Article 6(1)(a), Article 8 conditions apply for under-13s (UK age threshold). Parental consent record is upstream of Classroom.',
  }),
  Object.freeze({
    name: 'UK GDPR Article 9 (Special categories of personal data)',
    regulatorUrl: 'https://www.legislation.gov.uk/eur/2016/679/article/9',
    issuer: 'Parliament',
    scopeNote:
      'Special-category pupil data (mental health, racial-ethnic origin in cultural-curriculum, religion) requires Article 9(2) lawful basis in addition to Article 6. School DPO is the Article 9 controller.',
  }),
  Object.freeze({
    name: 'UK GDPR Article 35 (Data protection impact assessment)',
    regulatorUrl: 'https://www.legislation.gov.uk/eur/2016/679/article/35',
    issuer: 'Parliament',
    scopeNote:
      'AI-assisted classroom-content emission triggers Article 35 high-risk processing criteria. School DPO completes the DPIA. Classroom provides the data-flow documentation; DPIA itself is upstream.',
  }),
  Object.freeze({
    name: 'Education Act 2002 Section 175 (Safeguarding duty)',
    regulatorUrl: 'https://www.legislation.gov.uk/ukpga/2002/32/section/175',
    issuer: 'Parliament',
    scopeNote:
      'Statutory safeguarding duty on governing bodies of maintained schools. Source of authority for KCSiE.',
  }),
  Object.freeze({
    name: 'DfE Meeting Digital and Technology Standards in Schools and Colleges',
    regulatorUrl:
      'https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges',
    issuer: 'DfE',
    scopeNote:
      'DfE technical standards expectations. Classroom\'s Mirror-Mark audit trail provides one piece of the broader technology-standards compliance posture.',
  }),
]);

/** Pinned citation count for the cohort firewall. */
export const LEGAL_CITATIONS_COUNT: number = 10;

/**
 * Lookup a citation by short name. Returns undefined if no match.
 */
export function findCitationByName(name: string): Citation | undefined {
  return LEGAL_CITATIONS.find((c) => c.name === name);
}

/**
 * Return citations issued by a particular body (Ofsted / DfE / Parliament).
 */
export function citationsByIssuer(issuer: string): ReadonlyArray<Citation> {
  return LEGAL_CITATIONS.filter((c) => c.issuer === issuer);
}

/**
 * Compose the canonical liability disclosure shown to any operator
 * inspecting the flagship's legal posture. Used by `legal/REVIEW.md` and
 * by any future Phase-2 admin-surface that needs the disclosure verbatim.
 */
export function getLegalLiabilityDisclosure(): {
  readonly footer: string;
  readonly reviewedByCounsel: boolean;
  readonly hostActs: string;
  readonly citations: ReadonlyArray<Citation>;
} {
  return Object.freeze({
    footer: LEGAL_LIABILITY_FOOTER,
    reviewedByCounsel: REVIEWED_BY_COUNSEL,
    hostActs: LIBRARY_RECOMMENDS_HOST_ACTS,
    citations: LEGAL_CITATIONS,
  });
}
