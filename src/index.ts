/**
 * Public API barrel for Limitless Classroom.
 *
 * `package.json` declares `"main": "src/index.ts"`; this file is the
 * single documented public entry point so that
 * `import { ... } from 'limitless-classroom'` resolves to the real
 * module surface.
 *
 * Purely additive (R145.B SIBLING-NOT-STACKED): re-exports the existing
 * modules without modifying any of them. The seven src/ modules pinned by
 * firewall.ts (mirrormark / honest / legal / manifest / lore /
 * safeguarding_gate / firewall) are each surfaced here.
 *
 * Note on duplicate re-exports: `lore.ts` re-exports `isPassOutcome` /
 * `isFailOutcome` from `safeguarding_gate.ts`. To keep a single
 * unambiguous binding for each, the safeguarding-gate module is the
 * authoritative source for those two helpers; the wildcard star-exports
 * are ordered so the gate module owns them. ECMAScript `export *`
 * semantics drop a name that is ambiguously exported by two stars, so we
 * additionally re-export them explicitly from the canonical source below.
 */

export * from './mirrormark.js';
export * from './honest.js';
export * from './legal.js';
export * from './manifest.js';
export * from './safeguarding_gate.js';
export * from './lore.js';
export * from './firewall.js';

// Canonical bindings for the two helpers re-exported by both
// safeguarding_gate.ts and lore.ts (a doubly-starred name is otherwise
// dropped as ambiguous). safeguarding_gate.ts is the authoritative source.
export { isPassOutcome, isFailOutcome } from './safeguarding_gate.js';
