import styles from "./LoadingSkeleton.module.css";

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className={styles.skeletonWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonTextGroup}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonSub} />
            </div>
          </div>
          <div className={styles.skeletonBody} />
          <div className={styles.skeletonChips}>
            <div className={styles.skeletonChip} />
            <div className={styles.skeletonChip} />
            <div className={styles.skeletonChip} />
          </div>
        </div>
      ))}
    </div>
  );
}
