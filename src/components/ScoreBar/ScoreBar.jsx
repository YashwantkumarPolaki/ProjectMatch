import styles from "./ScoreBar.module.css";
import { useMountTrigger } from "../../hooks/useAnimation.js";

/**
 * Three-segment breakdown bar.
 * Segments fill left-to-right with staggered starts: 0ms / 80ms / 160ms.
 * Props: gapFill, availability, experience (all 0-100)
 */
export default function ScoreBar({ gapFill, availability, experience }) {
  // Each segment fills as a % of its own max contribution to bar width.
  // We weight segments visually the same as scoring weights: 60/25/15
  const GAP_WEIGHT   = 60;
  const AVAIL_WEIGHT = 25;
  const EXP_WEIGHT   = 15;

  // Actual filled px-% within each segment zone
  const gapWidth   = (gapFill   / 100) * GAP_WEIGHT;
  const availWidth = (availability / 100) * AVAIL_WEIGHT;
  const expWidth   = (experience   / 100) * EXP_WEIGHT;

  const seg1Active = useMountTrigger(80);   // 80ms delay (after card render)
  const seg2Active = useMountTrigger(160);  // 160ms
  const seg3Active = useMountTrigger(240);  // 240ms

  return (
    <div className={styles.wrap}>
      {/* ── Bar track ── */}
      <div className={styles.track}>
        {/* Gap-fill zone */}
        <div className={styles.zone} style={{ flex: GAP_WEIGHT }}>
          <div
            className={`${styles.seg} ${styles.gap}`}
            style={{ width: seg1Active ? `${gapWidth / GAP_WEIGHT * 100}%` : "0%" }}
          />
        </div>
        {/* Availability zone */}
        <div className={styles.zone} style={{ flex: AVAIL_WEIGHT }}>
          <div
            className={`${styles.seg} ${styles.avail}`}
            style={{ width: seg2Active ? `${availWidth / AVAIL_WEIGHT * 100}%` : "0%" }}
          />
        </div>
        {/* Experience zone */}
        <div className={styles.zone} style={{ flex: EXP_WEIGHT }}>
          <div
            className={`${styles.seg} ${styles.exp}`}
            style={{ width: seg3Active ? `${expWidth / EXP_WEIGHT * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* ── Legend ── */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotGap}`} />
          <span className={styles.legendLabel}>Gap-fill</span>
          <span className={styles.legendVal}>{gapFill}%</span>
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotAvail}`} />
          <span className={styles.legendLabel}>Availability</span>
          <span className={styles.legendVal}>{availability}%</span>
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotExp}`} />
          <span className={styles.legendLabel}>Experience</span>
          <span className={styles.legendVal}>{experience}%</span>
        </span>
      </div>
    </div>
  );
}
