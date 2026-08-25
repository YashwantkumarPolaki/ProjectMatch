import { useRef, useState } from "react";
import { rankCandidatesForProject } from "../../matching/engine.js";
import { useInterest } from "../../context/InterestContext.jsx";
import MatchCard from "../MatchCard/MatchCard.jsx";
import NearMissCard from "../NearMissCard/NearMissCard.jsx";
import ProjectDetailsModal from "../ProjectDetailsModal/ProjectDetailsModal.jsx";
import { limitWords } from "../../utils/textUtils.js";
import styles from "./ProjectPage.module.css";

export default function ProjectPage({ project, profiles, onSelectPerson, onBack }) {
  const { ranked, nearMisses } = rankCandidatesForProject(project, profiles);
  const [nearMissOpen, setNearMissOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const nearMissRef = useRef(null);

  const {
    isMutualMatch,
    isProjectInterested,
    toggleProjectInterest,
    isPersonInterested,
    isShortlisted,
    toggleShortlist,
    getProjectStage,
    spotsRemaining,
  } = useInterest();

  const stage = getProjectStage(project);
  const spotsLeft = spotsRemaining(project);

  const applicants = profiles.filter((p) => isPersonInterested(p.id, project.id));
  const shortlistedApplicants = applicants.filter((p) => isShortlisted(project.id, p.id));
  const generalApplicants = applicants.filter((p) => !isShortlisted(project.id, p.id));

  function toggleNearMiss() {
    setNearMissOpen((v) => !v);
  }

  return (
    <div className={styles.page}>
      {/* ── Back & Details Button ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className={styles.back} onClick={onBack}>
          ← All Projects
        </button>
        <button
          className={styles.back}
          style={{ color: "var(--accent)", fontWeight: 600 }}
          onClick={() => setShowModal(true)}
        >
          📄 View Team Lead & Full Details
        </button>
      </div>

      {/* ── Project Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span className={styles.categoryBadge}>{project.category}</span>
            {stage === "Almost Locked" && (
              <span className={styles.gapChip} style={{ background: "#FFDAD6", color: "#BA1A1A" }}>
                ⚡ {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left — closing soon
              </span>
            )}
            {stage === "Locked" && (
              <span className={styles.coveredChip} style={{ textDecoration: "none", opacity: 0.9 }}>
                🔒 Fully Staffed
              </span>
            )}
          </div>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.description}>{limitWords(project.description, 150)}</p>

          {/* Role chips */}
          <div className={styles.roles}>
            {project.roles.map((role) => (
              <span key={role.roleName} className={styles.roleChip}>
                <span className={styles.roleIcon}>🔍</span>
                {role.roleName}
                <span className={styles.roleSkills}>
                  {role.requiredSkills.join(" · ")}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Team gap summary */}
        <div className={styles.gapSummary}>
          <div className={styles.gapLabel}>Skills Needed</div>
          <div className={styles.gapSkills}>
            {[
              ...new Set(project.roles.flatMap((r) => r.requiredSkills)),
            ].filter((s) => !project.coveredSkills.includes(s))
              .map((s) => (
                <span key={s} className={styles.gapChip}>{s}</span>
              ))}
          </div>
          <div className={styles.coveredLabel}>Already Covered</div>
          <div className={styles.gapSkills}>
            {project.coveredSkills.map((s) => (
              <span key={s} className={styles.coveredChip}>{s}</span>
            ))}
          </div>

          <button
            style={{
              marginTop: "12px",
              padding: "8px",
              borderRadius: "6px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--accent-dark)",
              cursor: "pointer",
            }}
            onClick={() => setShowModal(true)}
          >
            📋 Project Lead & Full Specs →
          </button>
        </div>
      </header>

      {/* ── Applicants Review Section ── */}
      <section className={styles.applicantSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Applicants ({applicants.length})</h2>
          <span className={styles.sectionCount}>
            {shortlistedApplicants.length} Shortlisted · {generalApplicants.length} Pending
          </span>
        </div>

        {applicants.length === 0 ? (
          <div className={styles.emptyApplicantsBox}>
            <div className={styles.emptyApplicantsIcon}>📥</div>
            <h3>No applicants yet</h3>
            <p>Candidates who express interest in joining this project will appear here for review.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Shortlisted Candidates Subsection */}
            {shortlistedApplicants.length > 0 && (
              <div className={styles.shortlistedBox}>
                <div className={styles.shortlistedHeader}>
                  <span className={styles.starIcon}>⭐</span>
                  <h3 className={styles.shortlistedTitle}>
                    Shortlisted Candidates ({shortlistedApplicants.length})
                  </h3>
                </div>
                <div className={styles.grid}>
                  {shortlistedApplicants.map((p, i) => {
                    const entry = ranked.find((r) => r.candidate.id === p.id) || {
                      candidate: p,
                      scores: { overallScore: 85, gapFillPercent: 80, availabilityScore: 90, experienceScore: 85 },
                      whyMatched: "Expressed direct interest in joining this project.",
                    };
                    return (
                      <MatchCard
                        key={p.id}
                        candidate={p}
                        scores={entry.scores}
                        whyMatched={entry.whyMatched}
                        rank={i + 1}
                        delay={i * 40}
                        animate
                        isMutual={isMutualMatch(p.id, project.id)}
                        isInterested={isProjectInterested(project.id, p.id)}
                        onInterest={() => toggleProjectInterest(project.id, p.id)}
                        interestLabel="Confirm Match"
                        isShortlisted={true}
                        onShortlist={() => toggleShortlist(project.id, p.id)}
                        onClick={() => onSelectPerson(p)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Applicants Subsection */}
            {generalApplicants.length > 0 && (
              <div className={styles.generalApplicantsBox}>
                {shortlistedApplicants.length > 0 && (
                  <h3 className={styles.generalTitle}>
                    Other Applicants ({generalApplicants.length})
                  </h3>
                )}
                <div className={styles.grid}>
                  {generalApplicants.map((p, i) => {
                    const entry = ranked.find((r) => r.candidate.id === p.id) || {
                      candidate: p,
                      scores: { overallScore: 80, gapFillPercent: 75, availabilityScore: 85, experienceScore: 80 },
                      whyMatched: "Expressed direct interest in joining this project.",
                    };
                    return (
                      <MatchCard
                        key={p.id}
                        candidate={p}
                        scores={entry.scores}
                        whyMatched={entry.whyMatched}
                        rank={i + 1}
                        delay={i * 40}
                        animate
                        isMutual={isMutualMatch(p.id, project.id)}
                        isInterested={isProjectInterested(project.id, p.id)}
                        onInterest={() => toggleProjectInterest(project.id, p.id)}
                        interestLabel="Confirm Match"
                        isShortlisted={false}
                        onShortlist={() => toggleShortlist(project.id, p.id)}
                        onClick={() => onSelectPerson(p)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Top Matches ── */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Top Matches</h2>
          <span className={styles.sectionCount}>{ranked.length} candidates</span>
        </div>

        {ranked.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔎</div>
            <h3>No matches found</h3>
            <p>No candidates meet the threshold for this project.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {ranked.map((entry, i) => (
              <MatchCard
                key={entry.candidate.id}
                candidate={entry.candidate}
                scores={entry.scores}
                whyMatched={entry.whyMatched}
                rank={i + 1}
                delay={i * 40}
                animate
                isMutual={isMutualMatch(entry.candidate.id, project.id)}
                isInterested={isProjectInterested(project.id, entry.candidate.id)}
                onInterest={() => toggleProjectInterest(project.id, entry.candidate.id)}
                interestLabel="Express Interest"
                isShortlisted={isShortlisted(project.id, entry.candidate.id)}
                onShortlist={() => toggleShortlist(project.id, entry.candidate.id)}
                onClick={() => onSelectPerson(entry.candidate)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Near Misses ── */}
      {nearMisses.length > 0 && (
        <section className={styles.nearMissSection}>
          <button
            className={styles.nearMissToggle}
            onClick={toggleNearMiss}
            aria-expanded={nearMissOpen}
          >
            <span className={styles.nearMissToggleLeft}>
              <span className={styles.nearMissTitle}>Close Matches</span>
              <span className={styles.nearMissBadge}>{nearMisses.length}</span>
            </span>
            <span
              className={`${styles.chevron} ${nearMissOpen ? styles.chevronOpen : ""}`}
            >
              ↓
            </span>
          </button>

          {/* Height-animated container */}
          <div
            ref={nearMissRef}
            className={styles.nearMissList}
            style={{
              maxHeight: nearMissOpen ? (nearMissRef.current?.scrollHeight || 1200) + "px" : "0px",
            }}
          >
            <div className={styles.nearMissInner}>
              {nearMisses.map((entry, i) => (
                <NearMissCard
                  key={entry.candidate.id}
                  candidate={entry.candidate}
                  scores={entry.scores}
                  blockingReason={entry.blockingReason}
                  rank={ranked.length + i + 1}
                  onClick={() => onSelectPerson(entry.candidate)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Project Details Modal */}
      {showModal && (
        <ProjectDetailsModal
          project={project}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
