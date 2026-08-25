import styles from "./NearMissCard.module.css";

/**
 * NearMissCard — muted card showing blocking reason as primary text.
 * No score animation per spec.
 */
export default function NearMissCard({ candidate, scores, blockingReason, rank, onClick }) {
  const avatarUrl = `https://api.dicebear.com/7.x/${candidate.avatarStyle}/svg?seed=${candidate.avatarSeed}&backgroundColor=${candidate.avatarBg}`;

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      {/* Avatar + name */}
      <div className={styles.identity}>
        <div className={styles.avatar}>
          <img src={avatarUrl} alt={candidate.name} loading="lazy" />
        </div>
        <div className={styles.nameBlock}>
          <h4 className={styles.name}>{candidate.name}</h4>
          <div className={styles.subRow}>
            <span className={styles.score}>{scores.overallScore} pts</span>
            <span className={styles.sep}>·</span>
            <span className={styles.gapLabel}>
              Gap-fill: {scores.gapFillPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Blocking reason — primary text */}
      <div className={styles.reasonWrap}>
        <span className={styles.reasonIcon}>⚠</span>
        <p className={styles.reason}>{blockingReason}</p>
      </div>
    </div>
  );
}
