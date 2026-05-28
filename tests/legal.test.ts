import { describe, test, expect } from 'vitest';
import {
  LEGAL_LIABILITY_FOOTER,
  REVIEWED_BY_COUNSEL,
  LIBRARY_RECOMMENDS_HOST_ACTS,
  LEGAL_CITATIONS,
  LEGAL_CITATIONS_COUNT,
  findCitationByName,
  citationsByIssuer,
  getLegalLiabilityDisclosure,
} from '../src/legal.js';

describe('R166 LIABILITY-FOOTER-CONST', () => {
  test('LEGAL_LIABILITY_FOOTER is a non-empty const', () => {
    expect(typeof LEGAL_LIABILITY_FOOTER).toBe('string');
    expect(LEGAL_LIABILITY_FOOTER.length).toBeGreaterThan(200);
  });
  test('footer mentions Ofsted handbook', () => {
    expect(LEGAL_LIABILITY_FOOTER).toContain('Ofsted School');
  });
  test('footer mentions DfE GenAI policy', () => {
    expect(LEGAL_LIABILITY_FOOTER).toContain('Generative AI in Education');
  });
  test('footer mentions KCSiE statutory guidance', () => {
    expect(LEGAL_LIABILITY_FOOTER).toContain('Keeping Children Safe in Education');
  });
  test('footer mentions UK GDPR Article 9', () => {
    expect(LEGAL_LIABILITY_FOOTER).toContain('Article');
  });
  test('footer mentions qualified UK education-law solicitor', () => {
    expect(LEGAL_LIABILITY_FOOTER).toContain('UK education-law solicitor');
  });
});

describe('R166 REVIEWED_BY_COUNSEL honest-default', () => {
  test('defaults to false', () => {
    expect(REVIEWED_BY_COUNSEL).toBe(false);
  });
});

describe('LIBRARY_RECOMMENDS_HOST_ACTS', () => {
  test('starts with the LIBRARY-RECOMMENDS-HOST-ACTS literal', () => {
    expect(LIBRARY_RECOMMENDS_HOST_ACTS.startsWith('LIBRARY-RECOMMENDS-HOST-ACTS:')).toBe(true);
  });
  test('names DPO + Article 35 DPIA', () => {
    expect(LIBRARY_RECOMMENDS_HOST_ACTS).toContain('DPO');
    expect(LIBRARY_RECOMMENDS_HOST_ACTS).toContain('Article 35');
  });
  test('names DSL', () => {
    expect(LIBRARY_RECOMMENDS_HOST_ACTS).toContain('DSL');
  });
  test('names R145.B SIBLING-NOT-STACKED', () => {
    expect(LIBRARY_RECOMMENDS_HOST_ACTS).toContain('R145.B');
  });
});

describe('LEGAL_CITATIONS pin', () => {
  test('LEGAL_CITATIONS_COUNT is 10', () => {
    expect(LEGAL_CITATIONS_COUNT).toBe(10);
  });
  test('LEGAL_CITATIONS has 10 entries', () => {
    expect(LEGAL_CITATIONS.length).toBe(10);
  });
  test('each citation has the 4 required fields', () => {
    for (const c of LEGAL_CITATIONS) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.regulatorUrl.startsWith('https://')).toBe(true);
      expect(c.issuer.length).toBeGreaterThan(0);
      expect(c.scopeNote.length).toBeGreaterThan(0);
    }
  });
  test('Ofsted handbook citation present', () => {
    const c = findCitationByName('Ofsted School Inspection Handbook 2024');
    expect(c).not.toBeUndefined();
    expect(c?.issuer).toBe('Ofsted');
  });
  test('KCSiE citation present', () => {
    const c = findCitationByName('Keeping Children Safe in Education (KCSiE) Statutory Guidance');
    expect(c).not.toBeUndefined();
  });
  test('DfE GenAI policy citation present', () => {
    const c = findCitationByName('DfE Generative AI in Education Policy Paper');
    expect(c).not.toBeUndefined();
  });
  test('EYFS citation present', () => {
    const c = findCitationByName('Early Years Foundation Stage (EYFS) Statutory Framework');
    expect(c).not.toBeUndefined();
  });
  test('UK GDPR Article 6 citation present', () => {
    const c = findCitationByName('UK GDPR Article 6 (Lawfulness of processing)');
    expect(c).not.toBeUndefined();
  });
  test('UK GDPR Article 8 citation present', () => {
    const c = findCitationByName("UK GDPR Article 8 (Conditions applicable to child's consent)");
    expect(c).not.toBeUndefined();
  });
  test('UK GDPR Article 9 citation present', () => {
    const c = findCitationByName('UK GDPR Article 9 (Special categories of personal data)');
    expect(c).not.toBeUndefined();
  });
  test('UK GDPR Article 35 citation present', () => {
    const c = findCitationByName('UK GDPR Article 35 (Data protection impact assessment)');
    expect(c).not.toBeUndefined();
  });
  test('Education Act 2002 section 175 citation present', () => {
    const c = findCitationByName('Education Act 2002 Section 175 (Safeguarding duty)');
    expect(c).not.toBeUndefined();
  });
  test('citationsByIssuer Ofsted returns 1', () => {
    expect(citationsByIssuer('Ofsted').length).toBe(1);
  });
  test('citationsByIssuer DfE returns >= 3', () => {
    expect(citationsByIssuer('DfE').length).toBeGreaterThanOrEqual(3);
  });
  test('citationsByIssuer Parliament returns >= 4', () => {
    expect(citationsByIssuer('Parliament').length).toBeGreaterThanOrEqual(4);
  });
});

describe('getLegalLiabilityDisclosure composition', () => {
  test('returns the 4-tuple footer / reviewedByCounsel / hostActs / citations', () => {
    const d = getLegalLiabilityDisclosure();
    expect(d.footer).toBe(LEGAL_LIABILITY_FOOTER);
    expect(d.reviewedByCounsel).toBe(false);
    expect(d.hostActs).toBe(LIBRARY_RECOMMENDS_HOST_ACTS);
    expect(d.citations).toBe(LEGAL_CITATIONS);
  });
});
