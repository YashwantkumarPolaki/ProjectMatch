import styles from "./UrgencyCallout.module.css";

/**
 * UrgencyCallout — Feature 3
 * Appears ABOVE a MatchCard on PersonPage when the project is "Almost Locked".
 * Visually distinct from normal cards — not just a text label.
 */
export default function UrgencyCallout({ project, spotsLeft }) {
  return (
    <div className={styles.callout}>
      <div className={styles.iconWrap}>
        <span className={styles.icon}>⚡</span>
      </div>
      <div className={styles.body}>
        <p className={styles.headline}>
          This team needs you now
        </p>
        <p className={styles.sub}>
          <strong>{project.title}</strong> has only{" "}
          <strong>{spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left</strong> — closing soon.
          Your skills are a direct match for what's missing.
        </p>
      </div>
      <div className={styles.urgencyDot} />
    </div>
  );
}
