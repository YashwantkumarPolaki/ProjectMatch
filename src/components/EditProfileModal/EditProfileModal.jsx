import { useState } from "react";
import TagInput from "../TagInput/TagInput.jsx";
import { ALL_SKILLS, AVAILABILITY, EXPERIENCE } from "../../data/profiles.js";
import { db } from "../../firebase.js";
import { saveProfileToDb } from "../../services/dataService.js";
import styles from "./EditProfileModal.module.css";

export default function EditProfileModal({ profile, onClose, onSave }) {
  const [name, setName] = useState(profile?.name || "");
  const [skills, setSkills] = useState(profile?.skills || ["React"]);
  const [availability, setAvailability] = useState(profile?.availability || AVAILABILITY.HIGH);
  const [experienceLevel, setExperienceLevel] = useState(profile?.experienceLevel || EXPERIENCE.ADVANCED);
  const [interests, setInterests] = useState(profile?.interests || ["Open Source"]);
  const [phone, setPhone] = useState(profile?.phone || "");
  const [bio, setBio] = useState(profile?.bio || "");

  const suggestedInterests = [
    "Healthcare",
    "EdTech",
    "FinTech",
    "Climate",
    "Gaming",
    "AI Ethics",
    "Open Source",
    "Developer Tools",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    const updatedProfile = {
      ...profile,
      id: profile.id, // Preserve exact document ID to avoid creating duplicates
      name: name.trim(),
      skills: skills.length > 0 ? skills : ["React"],
      availability,
      experienceLevel,
      interests,
      phone: phone.trim() || undefined,
      bio: bio.trim(),
    };

    saveProfileToDb(db, updatedProfile);
    onSave?.(updatedProfile);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit Profile</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Your Core Skills</label>
            <TagInput
              selectedTags={skills}
              onChange={setSkills}
              suggestedTags={ALL_SKILLS}
              placeholder="Add a skill..."
            />
          </div>

          <div className={styles.row2Col}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Availability</label>
              <select
                className={styles.select}
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value={AVAILABILITY.LOW}>&lt;5 hrs/wk</option>
                <option value={AVAILABILITY.MID}>5-15 hrs/wk</option>
                <option value={AVAILABILITY.HIGH}>15+ hrs/wk</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Experience Level</label>
              <select
                className={styles.select}
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                <option value={EXPERIENCE.BEGINNER}>Beginner</option>
                <option value={EXPERIENCE.INTERMEDIATE}>Intermediate</option>
                <option value={EXPERIENCE.ADVANCED}>Advanced</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Interests</label>
            <TagInput
              selectedTags={interests}
              onChange={setInterests}
              suggestedTags={suggestedInterests}
              placeholder="Add an interest..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Phone Number (Optional)</label>
            <div className={styles.inputIconWrap}>
              <span className={styles.inputIcon}>📞</span>
              <input
                type="tel"
                className={styles.inputWithIcon}
                placeholder="e.g. +91 98765 43210 (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Short Bio</label>
              <span className={styles.charCounter}>{bio.length}/120</span>
            </div>
            <input
              type="text"
              maxLength={120}
              className={styles.input}
              placeholder="Describe your passion and expertise..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
