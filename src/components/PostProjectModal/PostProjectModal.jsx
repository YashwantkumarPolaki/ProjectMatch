import { useState } from "react";
import TagInput from "../TagInput/TagInput.jsx";
import { ALL_SKILLS, AVAILABILITY, EXPERIENCE } from "../../data/profiles.js";
import { db } from "../../firebase.js";
import { saveProjectToDb } from "../../services/dataService.js";
import styles from "./PostProjectModal.module.css";

export default function PostProjectModal({ ownerInfo, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Engineering");
  const [coveredSkills, setCoveredSkills] = useState([]);
  const [roles, setRoles] = useState([
    {
      roleName: "Full Stack Developer",
      requiredSkills: ["React", "Backend/Node"],
      impliedExperience: EXPERIENCE.INTERMEDIATE,
      impliedAvailability: AVAILABILITY.HIGH,
    },
  ]);

  const categories = [
    "Engineering",
    "Design Needs",
    "EdTech",
    "Security / DevTools",
    "HealthTech",
    "Open Source",
    "AI / ML",
  ];

  const handleAddRole = () => {
    setRoles([
      ...roles,
      {
        roleName: "",
        requiredSkills: [],
        impliedExperience: EXPERIENCE.INTERMEDIATE,
        impliedAvailability: AVAILABILITY.MID,
      },
    ]);
  };

  const handleRemoveRole = (index) => {
    if (roles.length > 1) {
      setRoles(roles.filter((_, i) => i !== index));
    }
  };

  const handleRoleChange = (index, field, value) => {
    const updated = [...roles];
    updated[index] = { ...updated[index], [field]: value };
    setRoles(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please provide a project title and description.");
      return;
    }

    // Ensure all roles have a title
    const formattedRoles = roles.map((r, i) => ({
      roleName: r.roleName.trim() || `Team Role ${i + 1}`,
      requiredSkills: r.requiredSkills.length > 0 ? r.requiredSkills : ["React"],
      impliedExperience: r.impliedExperience || EXPERIENCE.INTERMEDIATE,
      impliedAvailability: r.impliedAvailability || AVAILABILITY.MID,
    }));

    const ownerName = ownerInfo?.name || "Project Founder";
    const ownerEmail = ownerInfo?.email || "founder@projectmatch.dev";

    const newProject = {
      id: `proj_${Date.now()}`,
      ownerId: ownerInfo?.id || ownerInfo?.uid || ownerInfo?.email || `owner_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      status: "ACTIVE",
      domains: [category],
      lead: {
        initial: ownerName.charAt(0).toUpperCase() || "F",
        name: ownerName,
        email: ownerEmail,
        role: "Project Founder & Lead",
        phone: "+91 98765 00000",
      },
      timeline: "Q3-Q4 2026",
      code: `PRJ-2026-${Math.floor(10 + Math.random() * 90)}`,
      coveredSkills,
      roles: formattedRoles,
    };

    saveProjectToDb(db, newProject);
    onSubmit(newProject);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Post a New Project</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Project Title *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Veritas — Open-Source Security Dashboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description *</label>
            <textarea
              className={styles.textarea}
              placeholder="Describe your venture, what you've built so far, and what skills your team needs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Category</label>
            <select
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Existing Skills Covered by Team</label>
            <span className={styles.sublabel}>
              Skills your existing team already has (helps calculate skill gaps)
            </span>
            <TagInput
              selectedTags={coveredSkills}
              onChange={setCoveredSkills}
              suggestedTags={ALL_SKILLS}
              placeholder="Add existing skill..."
            />
          </div>

          <div className={styles.sectionHeading}>
            <span>Roles Needed ({roles.length})</span>
          </div>

          {roles.map((role, idx) => (
            <div key={idx} className={styles.roleCard}>
              <div className={styles.roleHeader}>
                <span className={styles.roleTitle}>Role #{idx + 1}</span>
                {roles.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeRoleBtn}
                    onClick={() => handleRemoveRole(idx)}
                  >
                    Remove Role
                  </button>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Role Title</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Product Designer, ML Specialist"
                  value={role.roleName}
                  onChange={(e) => handleRoleChange(idx, "roleName", e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Required Skills for Role</label>
                <TagInput
                  selectedTags={role.requiredSkills}
                  onChange={(tags) => handleRoleChange(idx, "requiredSkills", tags)}
                  suggestedTags={ALL_SKILLS}
                  placeholder="Add required skill..."
                />
              </div>

              <div className={styles.row2Col}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Implied Experience</label>
                  <select
                    className={styles.select}
                    value={role.impliedExperience}
                    onChange={(e) => handleRoleChange(idx, "impliedExperience", e.target.value)}
                  >
                    <option value={EXPERIENCE.BEGINNER}>Beginner</option>
                    <option value={EXPERIENCE.INTERMEDIATE}>Intermediate</option>
                    <option value={EXPERIENCE.ADVANCED}>Advanced</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Implied Availability</label>
                  <select
                    className={styles.select}
                    value={role.impliedAvailability}
                    onChange={(e) => handleRoleChange(idx, "impliedAvailability", e.target.value)}
                  >
                    <option value={AVAILABILITY.LOW}>&lt;5 hrs/wk</option>
                    <option value={AVAILABILITY.MID}>5-15 hrs/wk</option>
                    <option value={AVAILABILITY.HIGH}>15+ hrs/wk</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button type="button" className={styles.addRoleBtn} onClick={handleAddRole}>
            + Add Another Role
          </button>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnSecondary || styles.closeBtn}
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 600,
                padding: "9px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Publish Project →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
