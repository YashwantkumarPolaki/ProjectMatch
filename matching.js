// ============================================================
// ProjectMatch — Matching Engine
// ============================================================
// Weights
const W_GAP_FILL     = 0.50;
const W_AVAILABILITY = 0.30;
const W_EXPERIENCE   = 0.20;

const NEAR_MISS_GAP_THRESHOLD   = 0.55; // gap-fill >= 55% → candidate is relevant
const NEAR_MISS_SCORE_CEILING   = 0.65; // but overall score < 65% → near miss

/**
 * Collect all skills already covered by the current team for a project.
 * Returns a Set of skill strings.
 */
export function getTeamSkills(project, allProfiles) {
  const teamSkills = new Set();
  for (const memberId of project.currentTeam) {
    const member = allProfiles.find(p => p.id === memberId);
    if (member) member.skills.forEach(s => teamSkills.add(s));
  }
  return teamSkills;
}

/**
 * Collect ALL required skills across all open roles for a project.
 * Returns an array of skill strings (may have duplicates if multiple roles need same skill — deduplicated).
 */
export function getProjectRequiredSkills(project) {
  const all = new Set();
  for (const role of project.roles) {
    for (const skill of role.requiredSkills) all.add(skill);
  }
  return [...all];
}

/**
 * Identify skills in the project that are NOT covered by the current team.
 */
export function getUnmetSkills(project, allProfiles) {
  const teamSkills = getTeamSkills(project, allProfiles);
  const required = getProjectRequiredSkills(project);
  return required.filter(s => !teamSkills.has(s));
}

// ────────────────────────────────────────────────────────────
// Dimension Scorers
// ────────────────────────────────────────────────────────────

/**
 * Gap-fill %: ratio of *unmet* skills this candidate covers.
 * If 0 unmet skills exist, return 0 (no gap to fill).
 */
function scoreGapFill(candidate, unmetSkills) {
  if (unmetSkills.length === 0) return 0;
  const covered = unmetSkills.filter(s => candidate.skills.includes(s)).length;
  return covered / unmetSkills.length;
}

/**
 * Availability match %: candidate's hours vs. the minimum role requirement.
 * Uses the most demanding open role.
 */
function scoreAvailability(candidate, project) {
  // Take the maximum hours/week across open roles
  const maxRequired = Math.max(...project.roles.map(r => r.hoursPerWeek));
  if (candidate.availability >= maxRequired) return 1.0;
  return candidate.availability / maxRequired;
}

/**
 * Experience fit %: how close candidate level is to the average desired level.
 * Score is 1 at exact match, reduces linearly by 0.25 per level of difference.
 */
function scoreExperience(candidate, project) {
  const avgDesired = project.roles.reduce((sum, r) => sum + r.desiredExperience, 0) / project.roles.length;
  const diff = Math.abs(candidate.experienceLevel - avgDesired);
  return Math.max(0, 1 - diff * 0.25);
}

// ────────────────────────────────────────────────────────────
// Overall Scorer
// ────────────────────────────────────────────────────────────

/**
 * Score a candidate against a project.
 * Returns { overall, gapFill, availability, experience }
 */
export function scoreCandidate(candidate, project, allProfiles) {
  const unmet = getUnmetSkills(project, allProfiles);
  const gapFill     = scoreGapFill(candidate, unmet);
  const availability = scoreAvailability(candidate, project);
  const experience  = scoreExperience(candidate, project);

  const overall = gapFill * W_GAP_FILL +
                  availability * W_AVAILABILITY +
                  experience * W_EXPERIENCE;

  return {
    overall:      Math.round(overall * 100),
    gapFill:      Math.round(gapFill * 100),
    availability: Math.round(availability * 100),
    experience:   Math.round(experience * 100),
    coveredUnmetSkills: unmet.filter(s => candidate.skills.includes(s)),
    unmetSkills:  unmet
  };
}

// ────────────────────────────────────────────────────────────
// Near-Miss Detection
// ────────────────────────────────────────────────────────────

/**
 * Returns a plain-language blocking reason for a near-miss candidate.
 */
function getNearMissReason(scores) {
  // Identify the single weakest dimension
  const dims = [
    { key: "availability", label: "availability conflict", value: scores.availability },
    { key: "experience",   label: "experience mismatch",   value: scores.experience   },
    { key: "gapFill",      label: "only partial gap fill",  value: scores.gapFill      }
  ];
  dims.sort((a, b) => a.value - b.value);
  const worst = dims[0];

  const reasons = {
    availability: `Not enough free hours — available ${Math.round(scores.availability)}% of what the project needs`,
    experience:   `Experience level is off — ${Math.round(scores.experience)}% match to the required seniority`,
    gapFill:      `Only covers ${scores.gapFill}% of the project's unmet skills`
  };

  return reasons[worst.key];
}

// ────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────

/**
 * Rank all candidates for a project.
 * Returns { ranked: [...], nearMisses: [...] }
 */
export function rankCandidatesForProject(project, allProfiles) {
  // Exclude current team members
  const candidates = allProfiles.filter(p => !project.currentTeam.includes(p.id));

  const scored = candidates.map(candidate => ({
    candidate,
    scores: scoreCandidate(candidate, project, allProfiles)
  }));

  // Sort by overall score desc
  scored.sort((a, b) => b.scores.overall - a.scores.overall);

  const ranked = scored.filter(
    s => s.scores.overall >= NEAR_MISS_SCORE_CEILING * 100 ||
         !(s.scores.gapFill / 100 >= NEAR_MISS_GAP_THRESHOLD)
  );

  const nearMisses = scored
    .filter(s => s.scores.gapFill / 100 >= NEAR_MISS_GAP_THRESHOLD &&
                 s.scores.overall < NEAR_MISS_SCORE_CEILING * 100)
    .map(s => ({
      ...s,
      blockingReason: getNearMissReason(s.scores)
    }));

  // Re-sort ranked: those not in nearMisses, by overall
  const nearMissIds = new Set(nearMisses.map(s => s.candidate.id));
  const topRanked = scored.filter(s => !nearMissIds.has(s.candidate.id));

  return { ranked: topRanked, nearMisses };
}

/**
 * Get top project matches for a person.
 */
export function rankProjectsForPerson(person, allProjects, allProfiles) {
  return allProjects.map(project => ({
    project,
    scores: scoreCandidate(person, project, allProfiles)
  })).sort((a, b) => b.scores.overall - a.scores.overall);
}

// ────────────────────────────────────────────────────────────
// Verification Assertions (run in dev, logged to console)
// ────────────────────────────────────────────────────────────

export function runVerification(profiles, projects) {
  console.group("🔍 ProjectMatch — Verification Assertions");

  // 1. Gap-fill priority: Aisha (fills React/TS/CSS gaps on Sage) vs Jordan (also React but lower exp)
  const sageProjIndex = projects.findIndex(p => p.id === "proj1");
  if (sageProjIndex !== -1) {
    const sageProj = projects[sageProjIndex];
    const { ranked } = rankCandidatesForProject(sageProj, profiles);
    const aishaRank  = ranked.findIndex(r => r.candidate.id === "p1");
    const jordanRank = ranked.findIndex(r => r.candidate.id === "p4");
    const aishaScore = ranked.find(r => r.candidate.id === "p1")?.scores;
    const jordanScore = ranked.find(r => r.candidate.id === "p4")?.scores;
    if (aishaScore && jordanScore) {
      const pass = aishaScore.overall >= jordanScore.overall;
      console.log(
        `[${pass ? "✅ PASS" : "❌ FAIL"}] Gap-fill priority: Aisha (${aishaScore.overall}) vs Jordan (${jordanScore.overall}) on Sage`,
        `\n  Aisha gap-fill: ${aishaScore.gapFill}%  Jordan gap-fill: ${jordanScore.gapFill}%`
      );
    }
  }

  // 2. Near-miss accuracy: check near-misses have accurate blocking reasons
  projects.forEach(project => {
    const { nearMisses } = rankCandidatesForProject(project, profiles);
    nearMisses.forEach(nm => {
      const dims = {
        availability: nm.scores.availability,
        experience:   nm.scores.experience,
        gapFill:      nm.scores.gapFill
      };
      const minKey = Object.entries(dims).reduce((a, b) => a[1] < b[1] ? a : b)[0];
      const reasonMentionsCorrect =
        (minKey === "availability" && nm.blockingReason.includes("hours")) ||
        (minKey === "experience"   && nm.blockingReason.includes("Experience")) ||
        (minKey === "gapFill"      && nm.blockingReason.includes("covers"));
      console.log(
        `[${reasonMentionsCorrect ? "✅ PASS" : "❌ FAIL"}] Near-miss reason for ${nm.candidate.name} on ${project.title}: "${nm.blockingReason}"`
      );
    });
  });

  console.groupEnd();
}
