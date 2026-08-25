import { rankProjectsForPerson } from "../../matching/engine.js";
import { useInterest } from "../../context/InterestContext.jsx";
import MatchCard from "../MatchCard/MatchCard.jsx";
import UrgencyCallout from "../UrgencyCallout/UrgencyCallout.jsx";
import styles from "./PersonPage.module.css";

function expDots(level) {
  const filled = { Beginner: 1, Intermediate: 2, Advanced: 3 }[level] || 1;
  return Array.from({ length: 3 }, (_, i) => (
    <span key={i} className={`${styles.dot} ${i < filled ? styles.dotFilled : ""}`} />
  ));
}

export default function PersonPage({ person, projects, profiles, onSelectProject, onBack }) {
  const ranked = rankProjectsForPerson(person, projects, profiles);
  const avatarUrl = `https://api.dicebear.com/7.x/${person.avatarStyle}/svg?seed=${person.avatarSeed}&backgroundColor=${person.avatarBg}`;

  const {
    isMutualMatch,
    isPersonInterested,
    togglePersonInterest,
    getProjectStage,
    spotsRemaining,
  } = useInterest();

  return (
    <div className={styles.page}>
      {/* ── Back ── */}
      <button className={styles.back} onClick={onBack}>
        ← All People
      </button>

      {/* ── Person Header ── */}
      <header className={styles.header}>
        <div className={styles.avatarWrap}>
          <img src={avatarUrl} alt={person.name} />
        </div>
        <div className={styles.info}>
          <h1 className={styles.name}>{person.name}</h1>
          <div className={styles.expRow}>
            <span className={styles.expDots}>{expDots(person.experienceLevel)}</span>
            <span className={styles.expText}>{person.experienceLevel}</span>
            <span className={styles.sep}>·</span>
            <span className={styles.availText}>{person.availability}</span>
          </div>
          <p className={styles.bio}>{person.bio}</p>

          <div className={styles.skills}>
            {person.skills.map((s) => (
              <span key={s} className={styles.chip}>{s}</span>
            ))}
          </div>
          <div className={styles.interests}>
            {person.interests.map((t) => (
              <span key={t} className={styles.interestChip}>{t}</span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Project Matches ── */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Best Project Fits</h2>
          <span className={styles.sectionSub}>Ranked by how much {person.name.split(" ")[0]} fills each project's gaps</span>
        </div>

        <div className={styles.grid}>
          {ranked.map((entry, i) => {
            const stage = getProjectStage(entry.project);
            const isAlmostLocked = stage === "Almost Locked";
            const spots = spotsRemaining(entry.project);

            return (
              <div key={entry.project.id} className={styles.projectMatchWrap}>
                {/* Feature 3: Urgency Callout above top match if Almost Locked */}
                {isAlmostLocked && (
                  <UrgencyCallout project={entry.project} spotsLeft={spots} />
                )}

                {/* Project label above card */}
                <div className={styles.projectLabel}>
                  <span className={styles.projectCat}>{entry.project.category}</span>
                  <span className={styles.projectName}>{entry.project.title}</span>
                </div>
                <MatchCard
                  candidate={person}
                  lead={entry.project.lead}
                  scores={entry.scores}
                  whyMatched={entry.whyMatched}
                  rank={i + 1}
                  delay={i * 40}
                  animate
                  isMutual={isMutualMatch(person.id, entry.project.id)}
                  isInterested={isPersonInterested(person.id, entry.project.id)}
                  onInterest={() => togglePersonInterest(person.id, entry.project.id)}
                  interestLabel="I'm Interested"
                  onClick={() => onSelectProject(entry.project)}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
