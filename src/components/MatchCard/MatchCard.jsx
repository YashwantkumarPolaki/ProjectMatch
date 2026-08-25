import { useEffect, useRef, useState } from "react";
import { useCountUp, useMountTrigger } from "../../hooks/useAnimation.js";
import ScoreBar from "../ScoreBar/ScoreBar.jsx";
import styles from "./MatchCard.module.css";

function scoreClass(score) {
  if (score >= 70) return styles.high;
  if (score >= 45) return styles.mid;
  return styles.low;
}

function expLabel(level) {
  const map = { Beginner: "Beginner", Intermediate: "Mid-level", Advanced: "Senior" };
  return map[level] || level;
}

function expDots(level) {
  const filled = { Beginner: 1, Intermediate: 2, Advanced: 3 }[level] || 1;
  return Array.from({ length: 3 }, (_, i) => (
    <span
      key={i}
      className={`${styles.dot} ${i < filled ? styles.dotFilled : ""}`}
    />
  ));
}

/**
 * MatchCard — used for both project match lists and person project lists.
 *
 * Props (Round 1, unchanged):
 *   candidate, scores, whyMatched, rank, delay, onClick, animate
 *
 * Props (Round 2 additions):
 *   isMutual:        bool  — highlight as mutual match
 *   isInterested:    bool  — "Interested" button active state
 *   onInterest:      () => void — toggle interest handler
 *   interestLabel:   string — button label (e.g. "Mark Interest" / "I'm Interested")
 */
export default function MatchCard({
  candidate,
  lead,
  scores,
  whyMatched,
  rank,
  delay = 0,
  onClick,
  animate = true,
  // Feature 2 props:
  isMutual = false,
  isInterested = false,
  onInterest,
  interestLabel = "Express Interest",
  isShortlisted = false,
  onShortlist,
  isApproved = false,
  onApprove,
  isViewed = false,
}) {
  const mounted = useMountTrigger(delay);
  const displayScore = useCountUp(animate ? scores.overallScore : 0, delay);
  const contactPerson = lead || candidate;

  // Track previous mutual state to fire pulse animation only on transition false→true
  const prevMutual = useRef(isMutual);
  const [pulseClass, setPulseClass] = useState("");

  useEffect(() => {
    if (!prevMutual.current && isMutual) {
      // Became mutual — play pulse once
      setPulseClass(styles.mutualPulseAnim);
      const t = setTimeout(() => setPulseClass(""), 400);
      return () => clearTimeout(t);
    }
    prevMutual.current = isMutual;
  }, [isMutual]);

  const avatarUrl = `https://api.dicebear.com/7.x/${candidate.avatarStyle || "avataaars"}/svg?seed=${candidate.avatarSeed}&backgroundColor=${candidate.avatarBg || "b6e3f4"}`;

  // Determine which candidate skills are semantic (non-exact) gap matches
  const semanticMatchSkills = new Set(
    (scores.semanticMatches ?? [])
      .filter((m) => !m.isExact)
      .map((m) => m.matchedSkill)
  );

  return (
    <div
      className={[
        styles.card,
        mounted ? styles.visible : "",
        isMutual || isApproved ? styles.mutual : "",
        pulseClass,
      ].filter(Boolean).join(" ")}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      {/* ── Top Ribbon Badges ── */}
      {isApproved ? (
        <div className={styles.approvedBadge}>
          <span>✅</span> Approved
        </div>
      ) : isMutual ? (
        <div className={styles.mutualBadge}>
          <span>🤝</span> Mutual Match
        </div>
      ) : null}

      {/* ── Header row ── */}
      <div className={styles.header}>
        <div className={styles.identity}>
          <span className={`${styles.rank} ${rank <= 3 ? styles.rankTop : ""}`}>
            #{rank}
          </span>
          <div className={styles.avatar}>
            <img src={avatarUrl} alt={candidate.name} loading="lazy" />
          </div>
          <div className={styles.nameBlock}>
            <h3 className={styles.name}>{candidate.name}</h3>
            <div className={styles.expRow}>
              <span className={styles.expDots}>{expDots(candidate.experienceLevel)}</span>
              <span className={styles.expText}>{expLabel(candidate.experienceLevel)}</span>
              <span className={styles.availBadge}>{candidate.availability}</span>
              {isViewed && (
                <span className={styles.viewedBadge} title="Candidate viewed this project">
                  👁 Viewed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score badge */}
        <div className={`${styles.scoreBadge} ${scoreClass(scores.overallScore)}`}>
          <span className={styles.scoreNum}>
            {animate ? displayScore : scores.overallScore}
          </span>
          <span className={styles.scoreSuffix}>pts</span>
        </div>
      </div>

      {/* ── Breakdown bar ── */}
      <ScoreBar
        gapFill={scores.gapFillPercent}
        availability={scores.availabilityScore}
        experience={scores.experienceScore}
      />

      {/* ── Why matched ── */}
      {whyMatched && (
        <div>
          <p className={styles.why}>
            <span className={styles.whyIcon}>✦</span> {whyMatched}
          </p>
          {/* Semantic match tag if any synonym matches present */}
          {semanticMatchSkills.size > 0 && (
            <span className={styles.semanticTag}>
              ≈ related skill
            </span>
          )}
        </div>
      )}

      {/* ── Skills chips ── */}
      <div className={styles.skills}>
        {candidate.skills.map((s) => {
          const isGapFill = scores.filledUnmetSkills?.includes(s);
          const isSemantic = semanticMatchSkills.has(s);
          return (
            <span
              key={s}
              className={[
                styles.chip,
                isGapFill ? styles.chipGap : "",
                !isGapFill && isSemantic ? styles.chipSemantic : "",
              ].filter(Boolean).join(" ")}
            >
              {s}
            </span>
          );
        })}
      </div>

      {/* ── Contact Lead Panel (Mutual Match or Approved Only) ── */}
      {(isMutual || isApproved) && (
        <div
          className={styles.contactPanel}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.contactHeader}>
            <span>📞</span> Contact Info ({isApproved ? "Approved Team Member" : "Mutual Match"})
          </div>
          <div className={styles.contactDetails}>
            {contactPerson.email && (
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>Email:</span>
                <a href={`mailto:${contactPerson.email}`} className={styles.contactLink}>
                  {contactPerson.email}
                </a>
              </div>
            )}
            {contactPerson.phone && (
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>Phone:</span>
                <a href={`tel:${contactPerson.phone}`} className={styles.contactLink}>
                  {contactPerson.phone}
                </a>
              </div>
            )}
            {!contactPerson.email && !contactPerson.phone && (
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>Email:</span>
                <span className={styles.contactLink}>Contact via platform</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Action buttons footer ── */}
      {(onInterest || onShortlist || onApprove) && (
        <div className={styles.footer} style={{ gap: "8px", flexWrap: "wrap" }}>
          {onShortlist && (
            <button
              className={`${styles.shortlistBtn} ${isShortlisted ? styles.shortlistedActive : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onShortlist();
              }}
            >
              {isShortlisted ? "⭐ Shortlisted" : "☆ Shortlist"}
            </button>
          )}

          {onApprove && (
            <button
              className={`${styles.approveBtn} ${isApproved ? styles.approvedActive : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
            >
              {isApproved ? "✅ Approved" : "✓ Approve Candidate"}
            </button>
          )}

          {onInterest && (
            <button
              className={`${styles.interestedBtn} ${isInterested ? styles.active : ""}`}
              onClick={(e) => {
                e.stopPropagation(); // don't trigger card click
                onInterest();
              }}
            >
              {isInterested ? "✓ Interested" : interestLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
