/**
 * Skill synonym/cluster map for semantic matching.
 *
 * PARTIAL_CREDIT = 0.50 (50% of full credit).
 * Chosen deliberately so:
 *   - Gap filler with 3 exact matches (3.0 / 5 = 60%) beats
 *   - Stacker with 5 synonym matches (5 × 0.5 = 2.5 / 5 = 50%)
 * This preserves the Round 1 gap-filler > stacker invariant.
 */

export const PARTIAL_CREDIT = 0.50;

// Each key lists related skills that provide partial credit toward it.
// Relationships are intentionally directional — tuned for the seeded skill pool.
export const SYNONYM_MAP = {
  "React":             ["UI Design", "Figma"],
  "UI Design":         ["React", "Figma"],
  "Figma":             ["UI Design", "React"],
  "Backend/Node":      ["Data Engineering"],
  "Data Engineering":  ["Backend/Node", "ML", "Research"],
  "ML":                ["Data Engineering", "Research"],
  "Research":          ["ML", "Data Engineering", "Product Management"],
  "Copywriting":       ["Growth Marketing"],
  "Growth Marketing":  ["Copywriting", "Product Management"],
  "Product Management":["Research", "Growth Marketing"],
};

// Human-readable cluster label for "why matched" lines
const CLUSTER_LABELS = {
  "React":             "Frontend",
  "UI Design":         "Design",
  "Figma":             "Design",
  "Backend/Node":      "Backend",
  "Data Engineering":  "Data",
  "ML":                "ML / AI",
  "Research":          "Research",
  "Copywriting":       "Content",
  "Growth Marketing":  "Growth",
  "Product Management":"Product",
};

export function clusterLabel(skill) {
  return CLUSTER_LABELS[skill] || skill;
}

/**
 * Returns { credit, isExact } for a candidate skill → unmet skill pair.
 * credit = 1.0 (exact), PARTIAL_CREDIT (synonym), or 0 (no match).
 */
export function getSemanticCredit(candidateSkill, unmetSkill) {
  if (candidateSkill === unmetSkill) {
    return { credit: 1.0, isExact: true };
  }
  const synonyms = SYNONYM_MAP[unmetSkill] ?? [];
  if (synonyms.includes(candidateSkill)) {
    return { credit: PARTIAL_CREDIT, isExact: false };
  }
  return { credit: 0, isExact: false };
}

/**
 * For a candidate skill set vs an unmet skill, find the best match.
 * Returns { credit, isExact, matchedCandidateSkill } or null.
 */
export function bestSemanticMatch(candidateSkills, unmetSkill) {
  let best = { credit: 0, isExact: false, matchedCandidateSkill: null };
  for (const cs of candidateSkills) {
    const { credit, isExact } = getSemanticCredit(cs, unmetSkill);
    if (credit > best.credit) {
      best = { credit, isExact, matchedCandidateSkill: cs };
    }
  }
  return best.credit > 0 ? best : null;
}
