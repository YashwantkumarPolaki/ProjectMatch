// ============================================================
// ProjectMatch — Matching Engine v2
// Extends v1 with semantic skill matching (synonym partial credit).
// Round 1 weights preserved:
//   overallScore = gapFillPercent*0.6 + availabilityScore*0.25 + experienceScore*0.15
// ============================================================

import { AVAILABILITY, EXPERIENCE } from "../data/profiles.js";
import { bestSemanticMatch, clusterLabel } from "./synonyms.js";

// ── Availability tier helpers ─────────────────────────────────
const AVAIL_ORDER = [AVAILABILITY.LOW, AVAILABILITY.MID, AVAILABILITY.HIGH];

function availabilityScore(candidateAvail, impliedAvail) {
  const ci = AVAIL_ORDER.indexOf(candidateAvail);
  const ri = AVAIL_ORDER.indexOf(impliedAvail);
  const diff = Math.abs(ci - ri);
  if (diff === 0) return 1.0;
  if (diff === 1) return 0.6;
  return 0.2;
}

// ── Experience level helpers ─────────────────────────────────
const EXP_ORDER = [EXPERIENCE.BEGINNER, EXPERIENCE.INTERMEDIATE, EXPERIENCE.ADVANCED];

function experienceScore(candidateExp, impliedExp) {
  const ci = EXP_ORDER.indexOf(candidateExp);
  const ri = EXP_ORDER.indexOf(impliedExp);
  const diff = Math.abs(ci - ri);
  if (diff === 0) return 1.0;
  if (diff === 1) return 0.65;
  return 0.30;
}

// ── Core scorer ──────────────────────────────────────────────
/**
 * Score a single candidate against a project using semantic matching.
 * Returns extended score object with semanticMatches for UI rendering.
 */
export function scoreCandidate(candidate, project) {
  // Unmet skills = required - already covered
  const allRequired = [...new Set(project.roles.flatMap((r) => r.requiredSkills))];
  const unmetSkills = allRequired.filter((s) => !project.coveredSkills.includes(s));

  // ── Semantic gap-fill ───────────────────────────────────────
  // Each unmet skill gets credit: 1.0 exact, 0.5 synonym, 0 none.
  let semanticCreditTotal = 0;
  const semanticMatches = []; // { unmetSkill, matchedSkill, isExact, credit }
  const filledUnmetSkills = []; // exact matches only (for chip highlighting)

  for (const unmetSkill of unmetSkills) {
    const match = bestSemanticMatch(candidate.skills, unmetSkill);
    if (match) {
      semanticCreditTotal += match.credit;
      semanticMatches.push({
        unmetSkill,
        matchedSkill: match.matchedCandidateSkill,
        isExact: match.isExact,
        credit: match.credit,
      });
      if (match.isExact) filledUnmetSkills.push(unmetSkill);
    }
  }

  const gapFillPct =
    unmetSkills.length > 0 ? semanticCreditTotal / unmetSkills.length : 0;

  // Redundancy: candidate skills already covered by the team (not scoring factor)
  const redundancyCount = candidate.skills.filter((s) =>
    project.coveredSkills.includes(s)
  ).length;

  // Reference role = highest experience/availability demand
  const roles = project.roles;
  const refRole = roles.reduce((best, r) => {
    const ri = EXP_ORDER.indexOf(r.impliedExperience);
    const bi = EXP_ORDER.indexOf(best.impliedExperience);
    return ri >= bi ? r : best;
  }, roles[0]);

  const availScore = availabilityScore(candidate.availability, refRole.impliedAvailability);
  const expScore   = experienceScore(candidate.experienceLevel, refRole.impliedExperience);

  const overall = gapFillPct * 0.6 + availScore * 0.25 + expScore * 0.15;

  return {
    candidateId:       candidate.id,
    gapFillPercent:    Math.round(gapFillPct * 100),
    availabilityScore: Math.round(availScore * 100),
    experienceScore:   Math.round(expScore * 100),
    overallScore:      Math.round(overall * 100),
    redundancyCount,
    filledUnmetSkills,
    unmetSkills,
    semanticMatches, // NEW: for "why matched" + chip rendering
  };
}

// ── "Why matched" one-liner (semantic-aware) ─────────────────
function whyMatched(scores) {
  // Check if the biggest gap-fill contribution was via semantic (non-exact) match
  const topSemanticMatch = scores.semanticMatches
    ?.filter((m) => !m.isExact)
    .sort((a, b) => b.credit - a.credit)[0];

  const dims = [
    { label: "gap-fill",     value: scores.gapFillPercent,    text: "Covers critical skill gaps the team is missing" },
    { label: "availability", value: scores.availabilityScore, text: "Availability aligns well with project demands" },
    { label: "experience",   value: scores.experienceScore,   text: "Experience level is a strong match for this role" },
  ];
  dims.sort((a, b) => b.value - a.value);

  // If gap-fill is dominant AND there's a semantic match, use the semantic context line
  if (dims[0].label === "gap-fill" && topSemanticMatch) {
    const cluster = clusterLabel(topSemanticMatch.unmetSkill);
    return `Covers ${cluster} gap via ${topSemanticMatch.matchedSkill} experience`;
  }

  return dims[0].text;
}

// ── Blocking reason for near-misses ─────────────────────────
function blockingReason(scores) {
  const dims = [
    { key: "availability", value: scores.availabilityScore, label: "availability doesn't align with what the project needs" },
    { key: "experience",   value: scores.experienceScore,   label: "experience level doesn't match the role's expectations" },
    { key: "gapFill",      value: scores.gapFillPercent,    label: "only partially covers the team's skill gaps" },
  ];
  dims.sort((a, b) => a.value - b.value);
  const worst = dims[0];
  const prefixes = {
    availability: "Strong skill fit, but",
    experience:   "Good gap coverage, but",
    gapFill:      "Solid profile, but",
  };
  return `${prefixes[worst.key]} ${worst.label}.`;
}

// ── Public: rank candidates for a project ───────────────────
/**
 * Returns { ranked: top5, nearMisses: [...] }
 */
export function rankCandidatesForProject(project, allProfiles) {
  const scoredAll = allProfiles.map((candidate) => ({
    candidate,
    scores: scoreCandidate(candidate, project),
  }));

  scoredAll.sort((a, b) => b.scores.overallScore - a.scores.overallScore);

  const top5 = scoredAll.slice(0, 5).map((entry) => ({
    ...entry,
    whyMatched: whyMatched(entry.scores),
  }));

  // Near-misses: outside top 5, gapFillPercent >= 60%
  const rest = scoredAll.slice(5);
  const nearMisses = rest
    .filter((entry) => entry.scores.gapFillPercent >= 60)
    .map((entry) => ({
      ...entry,
      blockingReason: blockingReason(entry.scores),
    }));

  return { ranked: top5, nearMisses };
}

// ── Public: rank projects for a person ──────────────────────
export function rankProjectsForPerson(person, allProjects, allProfiles) {
  return allProjects
    .map((project) => {
      const scores = scoreCandidate(person, project);
      return {
        project,
        scores,
        whyMatched: whyMatched(scores),
      };
    })
    .sort((a, b) => b.scores.overallScore - a.scores.overallScore);
}

// ── Verification (call once on app load) ────────────────────
export function runVerification(profiles, projects) {
  console.group("🔍 ProjectMatch — Verification v2 (Semantic)");

  const proj1 = projects.find((p) => p.id === "proj1");
  const gapFiller = profiles.find((p) => p.id === "p16"); // Nandini — gap filler
  const stacker   = profiles.find((p) => p.id === "p17"); // Siddharth — redundancy stacker

  if (proj1 && gapFiller && stacker) {
    const gfScore = scoreCandidate(gapFiller, proj1);
    const stScore = scoreCandidate(stacker, proj1);

    console.log(
      `Gap Filler (${gapFiller.name}): overall=${gfScore.overallScore} gapFill=${gfScore.gapFillPercent}% redundancy=${gfScore.redundancyCount}`
    );
    console.log(
      `Stacker    (${stacker.name}): overall=${stScore.overallScore} gapFill=${stScore.gapFillPercent}% redundancy=${stScore.redundancyCount}`
    );

    const semanticMatchStr = stScore.semanticMatches
      .filter((m) => !m.isExact)
      .map((m) => `${m.unmetSkill}←${m.matchedSkill}(${Math.round(m.credit * 100)}%)`)
      .join(", ");
    console.log(`Stacker semantic matches: ${semanticMatchStr || "none"}`);

    const pass = gfScore.overallScore > stScore.overallScore;
    console.log(`[${pass ? "✅ PASS" : "❌ FAIL"}] Gap filler outranks stacker (${gfScore.overallScore} > ${stScore.overallScore})`);
  }

  // Near-miss check
  projects.forEach((project) => {
    const { nearMisses } = rankCandidatesForProject(project, profiles);
    const pass = nearMisses.length > 0;
    console.log(
      `[${pass ? "✅" : "❌ FAIL"}] ${project.title}: ${nearMisses.length} near-miss(es)`,
      nearMisses.map((nm) => `\n    ${nm.candidate.name}: "${nm.blockingReason}"`)
    );
  });

  console.groupEnd();
}
