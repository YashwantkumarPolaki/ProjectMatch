import { useInterest } from "../../context/InterestContext.jsx";
import { limitWords } from "../../utils/textUtils.js";
import styles from "./ProjectDetailsModal.module.css";

/**
 * ProjectDetailsModal — Detailed Project Overview Modal
 * General professional & research project modal with Project Lead contact info,
 * domains/tech stacks list, description narrative, required skills, and action buttons.
 */
export default function ProjectDetailsModal({ project, onClose, onApply }) {
  const { currentUser, onRequireAuth } = useInterest() || {};

  if (!project) return null;

  const handleApplyClick = () => {
    if (onApply) {
      const res = onApply(project);
      if (res === false) return;
    } else {
      if (!currentUser) {
        onClose();
        onRequireAuth?.();
        return;
      }
    }
    alert(`Application submitted for "${project.title}"!`);
    onClose();
  };

  const lead = project.lead || {
    initial: "R",
    name: "Ramprasath M.",
    email: "ramprasath@projectmatch.dev",
    role: "Lead AI Researcher & Project Founder",
    phone: "+91 98765 43210",
  };

  const domains = project.domains || project.departments || [
    "Artificial Intelligence",
    "Computer Vision",
    "Medical Imaging",
    "Deep Learning",
    "Data Science Systems",
  ];

  const timeline = project.timeline || project.year || "Q3-Q4 2026";
  const code = project.code || "PRJ-2026-86";

  const allSkills = [
    ...new Set([
      ...project.roles.flatMap((r) => r.requiredSkills),
      ...(project.id === "proj5" ? ["PyTorch", "Python", "TensorFlow"] : []),
    ]),
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Modal Header ── */}
        <div className={styles.headerRow}>
          <h2 className={styles.modalTitle}>Project Details</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className={styles.body}>
          {/* Status & Domains Box */}
          <div className={styles.metaRow}>
            <span className={styles.statusBadge}>{project.status || "ACTIVE"}</span>
            <div className={styles.deptBox}>
              {domains.join(", ")}
            </div>
          </div>

          {/* Project Title */}
          <h1 className={styles.projectTitle}>{project.title}</h1>

          {/* Project Lead Contact Card */}
          <div className={styles.facultyCard}>
            <div className={styles.facultyLeft}>
              <div className={styles.facultyAvatar}>{lead.initial}</div>
              <div className={styles.facultyInfo}>
                <div className={styles.facultyName}>{lead.name}</div>
                <div className={styles.facultyEmail}>{lead.email}</div>
                <div className={styles.facultyDept}>{lead.role}</div>
              </div>
            </div>
            <a
              href={`mailto:${lead.email}`}
              className={styles.callFacultyBtn}
              onClick={(e) => {
                e.preventDefault();
                alert(`Contacting Team Lead: ${lead.name} (${lead.email})`);
              }}
            >
              <span>💬</span> Contact Lead
            </a>
          </div>

          {/* Description Section */}
          <div>
            <h3 className={styles.sectionHeading}>
              <span>📖</span> Description
            </h3>
            <p className={styles.descriptionText}>{limitWords(project.description, 150)}</p>
          </div>

          {/* Required Skills Section */}
          <div>
            <h3 className={styles.sectionHeading}>Required Skills</h3>
            <div className={styles.skillsRow}>
              {allSkills.map((s) => (
                <span key={s} className={styles.skillPill}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span>📅</span> Timeline: <strong>{timeline}</strong>
            </div>
            <div className={styles.metaItem}>
              <span>🏢</span> Code: <strong>{code}</strong>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className={styles.footer}>
          <button
            className={styles.applyBtn}
            onClick={handleApplyClick}
          >
            Apply Now
          </button>
          <button className={styles.closeFooterBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
