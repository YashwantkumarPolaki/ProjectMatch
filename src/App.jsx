import { useEffect, useState } from "react";
import { ALL_SKILLS, AVAILABILITY, EXPERIENCE, PROFILES } from "./data/profiles.js";
import { PROJECTS } from "./data/projects.js";
import { runVerification } from "./matching/engine.js";
import { InterestProvider, useInterest } from "./context/InterestContext.jsx";
import ProjectPage from "./components/ProjectPage/ProjectPage.jsx";
import PersonPage from "./components/PersonPage/PersonPage.jsx";
import ProjectDetailsModal from "./components/ProjectDetailsModal/ProjectDetailsModal.jsx";
import PostProjectModal from "./components/PostProjectModal/PostProjectModal.jsx";
import EditProfileModal from "./components/EditProfileModal/EditProfileModal.jsx";
import LoadingSkeleton from "./components/LoadingSkeleton/LoadingSkeleton.jsx";
import TagInput from "./components/TagInput/TagInput.jsx";
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  saveProfileToDb,
  seedFirestoreIfEmpty,
  subscribeToProfiles,
  subscribeToProjects,
} from "./services/dataService.js";
import styles from "./App.module.css";

// ── Mini project card for the project list ─────────────────
function ProjectListCard({ project, index, onClick, onOpenDetails }) {
  const [visible, setVisible] = useState(false);
  const { getProjectStage, spotsRemaining, getProjectApplicantStats } = useInterest();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 60);
    return () => clearTimeout(t);
  }, [index]);

  const stage = getProjectStage(project);
  const spots = spotsRemaining(project);
  const { applicantCount, shortlistedCount } = getProjectApplicantStats(project.id);

  const unmetSkills = [
    ...new Set(project.roles.flatMap((r) => r.requiredSkills)),
  ].filter((s) => !project.coveredSkills.includes(s));

  return (
    <div
      className={`${styles.projectCard} ${visible ? styles.visible : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className={styles.projectCardLeft}>
        <div className={styles.badgeRow}>
          <span className={styles.catBadge}>{project.category}</span>
          {applicantCount > 0 && (
            <span className={styles.catBadge} style={{ background: "#F0FDFA", color: "#0F766E", border: "1px solid #CCFBF1" }}>
              📥 {applicantCount} {applicantCount === 1 ? "Applicant" : "Applicants"} ({shortlistedCount} Shortlisted)
            </span>
          )}
          {stage === "Almost Locked" && (
            <span className={styles.urgencyBadge}>
              ⚡ {spots} {spots === 1 ? "spot" : "spots"} left — closing soon
            </span>
          )}
          {stage === "Locked" && (
            <span className={styles.lockedBadge}>
              🔒 Fully Staffed
            </span>
          )}
          {project.code && (
            <span className={styles.catBadge} style={{ background: "#F1F5F9", color: "#64748B" }}>
              Code: {project.code}
            </span>
          )}
        </div>
        <h2 className={styles.projectCardTitle}>{project.title}</h2>
        <p className={styles.projectCardDesc}>{project.description}</p>
        <div className={styles.projectCardGaps}>
          <span className={styles.gapsLabel}>Seeking: </span>
          {unmetSkills.map((s) => (
            <span key={s} className={styles.gapChip}>{s}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
        <button
          className={styles.btnSecondary}
          style={{ padding: "5px 12px", fontSize: "12px" }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails?.(project);
          }}
        >
          View Details
        </button>
        <span className={styles.projectCardArrow}>→</span>
      </div>
    </div>
  );
}

// ── Mini person card for the people list ────────────────────
function PersonListCard({ person, index, onClick }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 40);
    return () => clearTimeout(t);
  }, [index]);

  const avatarUrl = `https://api.dicebear.com/7.x/${person.avatarStyle || "avataaars"}/svg?seed=${person.avatarSeed}&backgroundColor=${person.avatarBg || "b6e3f4"}`;

  return (
    <div
      className={`${styles.personCard} ${visible ? styles.visible : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className={styles.personCardAvatar}>
        <img src={avatarUrl} alt={person.name} loading="lazy" />
      </div>
      <div className={styles.personCardBody}>
        <h3 className={styles.personCardName}>{person.name}</h3>
        <p className={styles.personCardLevel}>{person.experienceLevel} · {person.availability}</p>
        <div className={styles.personCardSkills}>
          {person.skills.slice(0, 3).map((s) => (
            <span key={s} className={styles.personSkillChip}>{s}</span>
          ))}
          {person.skills.length > 3 && (
            <span className={styles.moreChip}>+{person.skills.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Project List View Content with Search & Category Filter ──
function ProjectListContent({ projects = PROJECTS, isLoading, onSelectProject, onOpenDetails }) {
  const { getProjectStage } = useInterest();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Projects");

  const categories = [
    "All Projects",
    "Design Needs",
    "Engineering",
    "EdTech",
    "Security / DevTools",
    "HealthTech",
    "Open Source",
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.lead?.name && p.lead.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.roles.some((r) =>
        r.requiredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    let matchesCategory = true;
    if (selectedCategory === "Design Needs") {
      matchesCategory = p.roles.some((r) =>
        r.requiredSkills.some((s) => ["UI Design", "Figma", "Copywriting"].includes(s))
      );
    } else if (selectedCategory === "Engineering") {
      matchesCategory = p.roles.some((r) =>
        r.requiredSkills.some((s) => ["Backend/Node", "Data Engineering", "React", "ML"].includes(s))
      );
    } else if (selectedCategory !== "All Projects") {
      matchesCategory = p.category.includes(selectedCategory);
    }

    return matchesSearch && matchesCategory;
  });

  const activeProjects = filteredProjects
    .filter((p) => getProjectStage(p) !== "Locked")
    .sort((a, b) => {
      const sa = getProjectStage(a) === "Almost Locked" ? 0 : 1;
      const sb = getProjectStage(b) === "Almost Locked" ? 0 : 1;
      return sa - sb;
    });

  const lockedProjects = filteredProjects.filter((p) => getProjectStage(p) === "Locked");

  return (
    <div className={styles.listPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Browse Projects</h1>
        <p className={styles.pageSubtitle}>
          Discover your next venture and team up with high-output professionals to fill specific skill gaps.
        </p>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search projects by skills, lead, code, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.pillsRow}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.pillBtn} ${selectedCategory === cat ? styles.pillBtnActive : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <>
          <div className={styles.projectList}>
            {activeProjects.map((p, i) => (
              <ProjectListCard
                key={p.id}
                project={p}
                index={i}
                onClick={() => onSelectProject(p)}
                onOpenDetails={onOpenDetails}
              />
            ))}
            {activeProjects.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 16px", background: "var(--bg-subtle)", borderRadius: "12px", border: "1px dashed var(--border)" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔎</div>
                <h3 style={{ fontFamily: "var(--font-head)", fontSize: "18px", margin: "0 0 6px 0" }}>No Projects Available</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
                  No active projects match your search criteria or category filter.
                </p>
              </div>
            )}
          </div>

          {lockedProjects.length > 0 && (
            <>
              <h2 className={styles.sectionHeading}>Completed / Staffed Projects</h2>
              <div className={styles.projectList}>
                {lockedProjects.map((p, i) => (
                  <ProjectListCard
                    key={p.id}
                    project={p}
                    index={i}
                    onClick={() => onSelectProject(p)}
                    onOpenDetails={onOpenDetails}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Landing Page View ────────────────────────────────────────
function LandingView({ projects = PROJECTS, onBrowse, onOpenDetails }) {
  const featuredProject = projects.find((p) => p.id === "proj5") || projects[0];

  return (
    <div className={styles.listPage}>
      {/* Split Hero */}
      <div className={styles.landingSplitHero}>
        <div className={styles.landingHeroLeft}>
          <h1 className={styles.landingTitle}>Find the missing piece for your team</h1>
          <p className={styles.landingSubtitle}>
            Connect with high-output professionals and creatives to build your next big venture. Precision matching based on skills, work style, and availability.
          </p>
          <div className={styles.heroBtnRow}>
            <button className={styles.btnPrimary} onClick={onBrowse}>
              Browse Projects →
            </button>
            <button className={styles.btnSecondary} onClick={() => onOpenDetails(featuredProject)}>
              View Featured Research
            </button>
          </div>

          <div className={styles.statsRowInline}>
            <div className={styles.statItemInline}>
              <span className={styles.statNumInline}>2,500+</span>
              <span className={styles.statLabelInline}>Active Projects</span>
            </div>
            <div className={styles.statItemInline}>
              <span className={styles.statNumInline}>15k+</span>
              <span className={styles.statLabelInline}>Professionals</span>
            </div>
            <div className={styles.statItemInline}>
              <span className={styles.statNumInline}>92%</span>
              <span className={styles.statLabelInline}>Match Rate</span>
            </div>
          </div>
        </div>

        <div className={styles.landingHeroRight}>
          <div className={styles.graphicBox}>
            <div className={styles.graphicShape}>
              🧩
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards with Checklists */}
      <div className={styles.landingGrid}>
        <div className={styles.landingCard}>
          <div className={styles.landingCardIcon}>🧩</div>
          <h2 className={styles.landingCardTitle}>For Project Owners</h2>
          <p className={styles.landingCardDesc}>
            Post your vision and let our algorithm find the exact skills you're missing. Review detailed compatibility breakdowns before reaching out.
          </p>
          <div className={styles.checkList}>
            <div className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span> Automated skill matching
            </div>
            <div className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span> Work style compatibility scores
            </div>
            <div className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span> Streamlined outreach
            </div>
          </div>
          <span className={styles.linkText} onClick={onBrowse}>
            Learn more →
          </span>
        </div>

        <div className={styles.landingCard}>
          <div className={styles.landingCardIcon}>💼</div>
          <h2 className={styles.landingCardTitle}>For Team Members</h2>
          <p className={styles.landingCardDesc}>
            Discover ambitious projects looking for your exact expertise. Filter by equity, commitment level, and remote flexibility.
          </p>
          <div className={styles.checkList}>
            <div className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span> Curated project feed
            </div>
            <div className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span> Transparent compensation details
            </div>
            <div className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span> Direct communication with founders
            </div>
          </div>
          <span className={styles.linkText} onClick={onBrowse}>
            Explore opportunities →
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard View (Exact Mockup Layout) ─────────────────────
function DashboardView({ projects = PROJECTS, isLoading, onSelectProject, onOpenDetails }) {
  const p0 = projects[0] || PROJECTS[0];
  const p1 = projects[1] || PROJECTS[1];

  return (
    <div className={styles.listPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Welcome back!</h1>
        <p className={styles.pageSubtitle}>
          Here's an overview of your project matching activity.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={2} />
      ) : (
        <>
          {/* 4 Metric Cards */}
          <div className={styles.dashboardGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Applications Sent</span>
                <div className={styles.metricIcon}>📤</div>
              </div>
              <div className={styles.metricBodyRow}>
                <span className={styles.metricNum}>12</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Active Matches</span>
                <div className={styles.metricIcon}>🤝</div>
              </div>
              <div className={styles.metricBodyRow}>
                <span className={styles.metricNum}>4</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Mutual Matches</span>
                <div className={styles.metricIcon}>💚</div>
              </div>
              <div className={styles.metricBodyRow}>
                <span className={styles.metricNum}>2</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricLabel}>Profile Views</span>
                <div className={styles.metricIcon}>👁️</div>
              </div>
              <div className={styles.metricBodyRow}>
                <span className={styles.metricNum}>87</span>
              </div>
            </div>
          </div>

          {/* 2-Column Split: Recent Matches & Skill Alignment */}
          <div className={styles.dashboardSplit}>
            <div className={styles.dashBox}>
              <h2 className={styles.dashBoxTitle}>Recent Matches</h2>
              <div className={styles.projectList}>
                {p0 && (
                  <div className={styles.matchRow} onClick={() => onOpenDetails(p0)} style={{ cursor: "pointer" }}>
                    <div className={styles.matchRowLeft}>
                      <div className={styles.matchBadgeIcon}>M</div>
                      <div>
                        <div className={styles.matchRowTitle}>{p0.title.slice(0, 48)}...</div>
                        <div className={styles.matchRowSub}>Match score: 98% · {p0.lead?.name}</div>
                      </div>
                    </div>
                    <button
                      className={styles.btnPrimary}
                      style={{ padding: "5px 14px", fontSize: "13px" }}
                      onClick={(e) => { e.stopPropagation(); onOpenDetails(p0); }}
                    >
                      View
                    </button>
                  </div>
                )}

                {p1 && (
                  <div className={styles.matchRow} onClick={() => onSelectProject(p1)} style={{ cursor: "pointer" }}>
                    <div className={styles.matchRowLeft}>
                      <div className={styles.matchBadgeIcon}>S</div>
                      <div>
                        <div className={styles.matchRowTitle}>{p1.title}</div>
                        <div className={styles.matchRowSub}>Match score: 92%</div>
                      </div>
                    </div>
                    <button className={styles.btnSecondary} style={{ padding: "5px 14px", fontSize: "13px" }}>
                      Pending
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.dashBox}>
              <h2 className={styles.dashBoxTitle}>Skill Alignment</h2>
              <p className={styles.dashBoxSub}>
                Based on your recent applications, here are your strongest matches.
              </p>
              <div className={styles.skillPillsWrap}>
                <span className={styles.skillAlignPill}>PyTorch (98%)</span>
                <span className={styles.skillAlignPill}>Python (95%)</span>
                <span className={styles.skillAlignPill}>TensorFlow (88%)</span>
                <span className={styles.skillAlignPill}>Figma (82%)</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Auth Modal Component (Firebase Auth Connected) ───────────
function AuthModal({ onClose, onCreateProfile, onSignupAsOwner }) {
  const [authTab, setAuthTab] = useState("signin");
  const [step, setStep] = useState(1);

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 field (Role intent)
  const [intent, setIntent] = useState("candidate"); // "candidate" | "owner"

  // Step 3 fields (Candidate profile details)
  const [skills, setSkills] = useState(["React", "UI Design"]);
  const [availability, setAvailability] = useState(AVAILABILITY.HIGH);
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE.ADVANCED);
  const [interests, setInterests] = useState(["EdTech", "AI Ethics"]);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

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

  const totalSteps = intent === "owner" ? 2 : 3;

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) {
      alert("Please enter your email and password.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, signInEmail.trim(), signInPassword.trim());
      console.log("Firebase Auth signed in:", signInEmail);
      onClose();
    } catch (err) {
      alert(`Sign in error: ${err.message}`);
    }
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Please fill in your name, email, and password.");
      return;
    }
    setStep(2);
  };

  const handleStep2Next = async () => {
    if (intent === "candidate") {
      setStep(3);
    } else {
      let uid = `p_${Date.now()}`;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        uid = cred.user.uid;
      } catch (err) {
        console.warn("Firebase Auth owner signup note:", err.message);
      }

      const ownerProfile = {
        id: uid,
        name: name.trim() || "Project Founder",
        email: email.trim(),
        avatarSeed: name.trim().split(" ")[0] || "User",
        avatarStyle: "avataaars",
        avatarBg: "b6e3f4",
        skills: ["Product Management"],
        interests: ["Open Source"],
        availability: AVAILABILITY.HIGH,
        experienceLevel: EXPERIENCE.ADVANCED,
        bio: "Project Founder & Hiring Lead",
        role: "owner",
      };

      saveProfileToDb(db, ownerProfile);
      onSignupAsOwner?.({ name: name.trim(), email: email.trim(), id: uid }, ownerProfile);
      onClose();
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    let uid = `p_${Date.now()}`;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
      uid = cred.user.uid;
    } catch (err) {
      console.warn("Firebase Auth candidate signup note:", err.message);
    }

    const newProfile = {
      id: uid,
      name: name.trim() || "New Member",
      email: email.trim(),
      phone: phone.trim() || undefined,
      avatarSeed: name.trim().split(" ")[0] || "User",
      avatarStyle: "avataaars",
      avatarBg: "b6e3f4",
      skills: skills.length > 0 ? skills : ["React"],
      interests: interests.length > 0 ? interests : ["Open Source"],
      availability: availability || AVAILABILITY.HIGH,
      experienceLevel: experienceLevel || EXPERIENCE.ADVANCED,
      bio: bio.trim() || "Passionate builder looking for exciting project opportunities.",
      role: "candidate",
    };

    saveProfileToDb(db, newProfile);
    onCreateProfile?.(newProfile);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.authCard} ${authTab === "signup" ? styles.authCardLarge : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.authHeader}>
          <div className={styles.logo} style={{ justifyContent: "center", marginBottom: "4px" }}>
            Project<span>Match</span>
          </div>
          <p className={styles.authSub}>
            {authTab === "signin"
              ? "Welcome back. Connect and collaborate."
              : "Create your account and start matching."}
          </p>
        </div>

        <div className={styles.authTabs}>
          <button
            className={`${styles.authTab} ${authTab === "signin" ? styles.authTabActive : ""}`}
            onClick={() => {
              setAuthTab("signin");
              setStep(1);
            }}
          >
            Sign In
          </button>
          <button
            className={`${styles.authTab} ${authTab === "signup" ? styles.authTabActive : ""}`}
            onClick={() => {
              setAuthTab("signup");
              setStep(1);
            }}
          >
            Sign Up
          </button>
        </div>

        {authTab === "signin" && (
          <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email address</label>
              <div className={styles.inputIconWrap}>
                <span className={styles.inputIcon}>✉️</span>
                <input
                  type="email"
                  className={styles.inputWithIcon}
                  placeholder="you@company.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.formLabel}>Password</label>
                <a href="#forgot" className={styles.forgotLink} onClick={(e) => e.preventDefault()}>
                  Forgot password?
                </a>
              </div>
              <div className={styles.inputIconWrap}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  className={styles.inputWithIcon}
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.checkboxRow}>
              <input type="checkbox" id="remember" defaultChecked />
              <label htmlFor="remember">Remember me for 30 days</label>
            </div>

            <button type="submit" className={styles.btnPrimary} style={{ width: "100%", height: "42px" }}>
              Sign In →
            </button>

            <div className={styles.dividerRow}>Or continue with</div>

            <div className={styles.socialRow} style={{ gridTemplateColumns: "1fr" }}>
              <button type="button" className={styles.btnSecondary} onClick={onClose} style={{ width: "100%" }}>
                Google
              </button>
            </div>
          </form>
        )}

        {authTab === "signup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Step Indicator Header */}
            <div>
              <div className={styles.stepHeader}>
                <span className={styles.stepBadge}>Step {step} of {totalSteps}</span>
                <span className={styles.authSub} style={{ fontSize: "12px" }}>
                  {step === 1 && "Account Credentials"}
                  {step === 2 && "Role Selection"}
                  {step === 3 && "Profile Details"}
                </span>
              </div>
              <div className={styles.stepProgressBar}>
                <div
                  className={styles.stepProgressFill}
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 1: Credentials */}
            {step === 1 && (
              <form onSubmit={handleStep1Next} className={styles.stepContent}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <div className={styles.inputIconWrap}>
                    <span className={styles.inputIcon}>👤</span>
                    <input
                      type="text"
                      className={styles.inputWithIcon}
                      placeholder="e.g. Pooja Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email address</label>
                  <div className={styles.inputIconWrap}>
                    <span className={styles.inputIcon}>✉️</span>
                    <input
                      type="email"
                      className={styles.inputWithIcon}
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <div className={styles.inputIconWrap}>
                    <span className={styles.inputIcon}>🔒</span>
                    <input
                      type="password"
                      className={styles.inputWithIcon}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className={styles.btnPrimary} style={{ width: "100%", height: "42px", marginTop: "8px" }}>
                  Continue →
                </button>
              </form>
            )}

            {/* Step 2: Role Selection */}
            {step === 2 && (
              <div className={styles.stepContent}>
                <h3 className={styles.authTitle} style={{ fontSize: "18px", textAlign: "left" }}>
                  What are you here for?
                </h3>
                <p className={styles.authSub} style={{ textAlign: "left", marginBottom: "8px" }}>
                  Select your primary goal on ProjectMatch.
                </p>

                <div className={styles.roleCardsGrid}>
                  <div
                    className={`${styles.roleCardItem} ${intent === "candidate" ? styles.roleCardSelected : ""}`}
                    onClick={() => setIntent("candidate")}
                  >
                    <span className={styles.roleCardIcon}>🧩</span>
                    <div className={styles.roleCardText}>
                      <span className={styles.roleCardTitle}>Looking for a project</span>
                      <span className={styles.roleCardDesc}>
                        Join an ambitious team, fill critical skill gaps, and build your portfolio.
                      </span>
                    </div>
                    <div className={styles.roleCardRadio}>
                      {intent === "candidate" && <div className={styles.roleCardRadioInner} />}
                    </div>
                  </div>

                  <div
                    className={`${styles.roleCardItem} ${intent === "owner" ? styles.roleCardSelected : ""}`}
                    onClick={() => setIntent("owner")}
                  >
                    <span className={styles.roleCardIcon}>🎯</span>
                    <div className={styles.roleCardText}>
                      <span className={styles.roleCardTitle}>Hiring a team</span>
                      <span className={styles.roleCardDesc}>
                        Post a project, define required roles, and discover precision-matched talent.
                      </span>
                    </div>
                    <div className={styles.roleCardRadio}>
                      {intent === "owner" && <div className={styles.roleCardRadioInner} />}
                    </div>
                  </div>
                </div>

                <div className={styles.stepNavRow}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setStep(1)}
                    style={{ padding: "8px 16px" }}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleStep2Next}
                    style={{ padding: "9px 20px" }}
                  >
                    {intent === "candidate" ? "Next: Profile Details →" : "Complete Signup & Post Project →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Profile Details (Candidate) */}
            {step === 3 && intent === "candidate" && (
              <form onSubmit={handleStep3Submit} className={styles.stepContent}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Your Core Skills</label>
                  <TagInput
                    selectedTags={skills}
                    onChange={setSkills}
                    suggestedTags={ALL_SKILLS}
                    placeholder="Add a skill (e.g. Python, Figma)..."
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Availability</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      style={{ height: "38px", width: "100%", borderRadius: "8px" }}
                    >
                      <option value={AVAILABILITY.LOW}>&lt;5 hrs/wk</option>
                      <option value={AVAILABILITY.MID}>5-15 hrs/wk</option>
                      <option value={AVAILABILITY.HIGH}>15+ hrs/wk</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      style={{ height: "38px", width: "100%", borderRadius: "8px" }}
                    >
                      <option value={EXPERIENCE.BEGINNER}>Beginner</option>
                      <option value={EXPERIENCE.INTERMEDIATE}>Intermediate</option>
                      <option value={EXPERIENCE.ADVANCED}>Advanced</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Interests (Optional)</label>
                  <TagInput
                    selectedTags={interests}
                    onChange={setInterests}
                    suggestedTags={suggestedInterests}
                    placeholder="Add an interest..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number (Optional)</label>
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
                    <label className={styles.formLabel}>Short Bio (Optional)</label>
                    <span className={styles.charCounter}>{bio.length}/120</span>
                  </div>
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="e.g. Senior developer passionate about accessible UX."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    style={{ width: "100%", height: "38px" }}
                  />
                </div>

                <div className={styles.stepNavRow}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setStep(2)}
                    style={{ padding: "8px 16px" }}
                  >
                    ← Back
                  </button>
                  <button type="submit" className={styles.btnPrimary} style={{ padding: "9px 20px" }}>
                    Complete & Start Matching →
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Footer Component (Mockup Exact Match) ────────────────────
function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <div className={styles.footerLogo}>
            Project<span>Match</span>
          </div>
        </div>

        <div className={styles.footerLinks}>
          <a href="#about" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
            About Us
          </a>
          <a href="#privacy" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
            Privacy Policy
          </a>
          <a href="#terms" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
            Terms of Service
          </a>
          <a href="#help" className={styles.footerLink} onClick={(e) => e.preventDefault()}>
            Help Center
          </a>
        </div>

        <div className={styles.footerCopy}>
          © 2026 ProjectMatch. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// ── Main App Content ─────────────────────────────────────────
function MainContent({ projects, setProjects, profiles, setProfiles, currentUser, setCurrentUser, isLoading, firestoreError, onRetryLoad }) {
  const [tab, setTab] = useState("projects"); // "landing" | "dashboard" | "projects" | "people"
  const [view, setView] = useState(null);     // null | { type: "project"|"person", id }
  const [showAuth, setShowAuth] = useState(false);
  const [showPostProject, setShowPostProject] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [modalProject, setModalProject] = useState(null);

  const [isHiringOwner, setIsHiringOwner] = useState(false);

  useEffect(() => {
    runVerification(profiles, projects);
  }, [profiles, projects]);

  // Auto-close auth modal when currentUser logs in
  useEffect(() => {
    if (currentUser) {
      setShowAuth(false);
    }
  }, [currentUser]);

  // Match current user to a profile (by uid or email)
  const activeUserProfile = currentUser
    ? profiles.find((p) => p.id === currentUser.uid || p.email === currentUser.email)
    : null;

  const isOwner = isHiringOwner || activeUserProfile?.role === "owner";

  const selectedProject = view?.type === "project"
    ? projects.find((p) => p.id === view.id)
    : null;
  const selectedPerson = view?.type === "person"
    ? profiles.find((p) => p.id === view.id)
    : null;

  const handleCreateProfile = (newProfile) => {
    setProfiles((prev) => [newProfile, ...prev.filter((p) => p.id !== newProfile.id)]);
    setShowAuth(false);
    setView({ type: "person", id: newProfile.id });
    setTab("people");
  };

  const handleSignupAsOwner = (ownerData, ownerProfile) => {
    setShowAuth(false);
    setOwnerInfo(ownerData);
    setIsHiringOwner(true);
    if (ownerProfile) {
      setProfiles((prev) => [ownerProfile, ...prev.filter((p) => p.id !== ownerProfile.id)]);
    }
    setShowPostProject(true);
  };

  const handleCreateProject = (newProject) => {
    setProjects((prev) => [newProject, ...prev.filter((p) => p.id !== newProject.id)]);
    setShowPostProject(false);
    setView({ type: "project", id: newProject.id });
  };

  const handleSaveProfile = (updatedProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out note:", err.message);
    }
    setCurrentUser(null);
    setIsHiringOwner(false);
  };

  return (
    <div className={styles.app}>
      {/* ── Firestore Error Boundary Alert Banner ── */}
      {firestoreError && (
        <div style={{ background: "#FEF2F2", borderBottom: "1px solid #FCA5A5", color: "#991B1B", padding: "10px 16px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>⚠️ {firestoreError}</span>
          <button onClick={onRetryLoad} style={{ background: "#991B1B", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
            Refresh
          </button>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div
            className={styles.logo}
            onClick={() => { setView(null); setTab("landing"); }}
          >
            <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-3.5-6.5l-2 2m-7 7l-2 2m11 0l-2-2m-7-7l-2-2"></path>
            </svg>
            Project<span>Match</span>
          </div>

          <div className={styles.navTabs}>
            <button
              className={`${styles.navTab} ${tab === "projects" && !view ? styles.navTabActive : ""}`}
              onClick={() => { setView(null); setTab("projects"); }}
            >
              Browse Projects
            </button>
            <button
              className={`${styles.navTab} ${tab === "people" && !view ? styles.navTabActive : ""}`}
              onClick={() => { setView(null); setTab("people"); }}
            >
              My Matches
            </button>
            <button
              className={`${styles.navTab} ${tab === "dashboard" && !view ? styles.navTabActive : ""}`}
              onClick={() => { setView(null); setTab("dashboard"); }}
            >
              Dashboard
            </button>
          </div>

          <div className={styles.navRight}>
            <button className={styles.navSearchBtn} onClick={() => { setView(null); setTab("projects"); }}>
              🔍
            </button>

            {isOwner && (
              <button
                className={styles.btnSecondary}
                onClick={() => setShowPostProject(true)}
                style={{ padding: "6px 12px", fontSize: "13px" }}
              >
                + Post Project
              </button>
            )}

            {currentUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  className={styles.avatarBtn}
                  onClick={() => {
                    if (activeUserProfile) {
                      setShowEditProfile(true);
                    }
                  }}
                  title="Click to edit profile"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/${activeUserProfile?.avatarStyle || "avataaars"}/svg?seed=${activeUserProfile?.avatarSeed || currentUser.email?.split("@")[0] || "User"}&backgroundColor=${activeUserProfile?.avatarBg || "b6e3f4"}`}
                    alt="User profile avatar"
                  />
                </div>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setShowEditProfile(true)}
                  style={{ padding: "5px 12px", fontSize: "12px" }}
                >
                  ✏️ Edit Profile
                </button>
                <button
                  className={styles.btnSecondary}
                  onClick={handleSignOut}
                  style={{ padding: "5px 12px", fontSize: "12px" }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className={styles.btnPrimary}
                onClick={() => setShowAuth(true)}
                style={{ padding: "6px 14px", fontSize: "13px" }}
              >
                Sign In / Up
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className={styles.main}>
        {/* Project detail */}
        {selectedProject && (
          <ProjectPage
            project={selectedProject}
            profiles={profiles}
            onSelectPerson={(person) => setView({ type: "person", id: person.id })}
            onBack={() => setView(null)}
          />
        )}

        {/* Person detail */}
        {selectedPerson && (
          <PersonPage
            person={selectedPerson}
            projects={projects}
            profiles={profiles}
            onSelectProject={(project) => setView({ type: "project", id: project.id })}
            onBack={() => setView(null)}
          />
        )}

        {/* Views */}
        {!view && (
          <div className={styles.lists}>
            {tab === "landing" && (
              <LandingView
                projects={projects}
                onBrowse={() => setTab("projects")}
                onOpenDetails={(proj) => setModalProject(proj)}
              />
            )}

            {tab === "dashboard" && (
              <DashboardView
                projects={projects}
                isLoading={isLoading}
                onSelectProject={(project) => setView({ type: "project", id: project.id })}
                onOpenDetails={(proj) => setModalProject(proj)}
              />
            )}

            {tab === "projects" && (
              <ProjectListContent
                projects={projects}
                isLoading={isLoading}
                onSelectProject={(project) => setView({ type: "project", id: project.id })}
                onOpenDetails={(proj) => setModalProject(proj)}
              />
            )}

            {tab === "people" && (
              <div className={styles.listPage}>
                <div className={styles.pageHeader}>
                  <h1 className={styles.pageTitle}>My Matches</h1>
                  <p className={styles.pageSubtitle}>
                    {profiles.length} candidates ready to join projects that need their specific skills.
                  </p>
                </div>
                {isLoading ? (
                  <LoadingSkeleton count={4} />
                ) : profiles.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 16px", background: "var(--bg-subtle)", borderRadius: "12px", border: "1px dashed var(--border)" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>👥</div>
                    <h3 style={{ fontFamily: "var(--font-head)", fontSize: "18px", margin: "0 0 6px 0" }}>No Candidates Found</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
                      No candidates match your selection yet.
                    </p>
                  </div>
                ) : (
                  <div className={styles.peopleGrid}>
                    {profiles.map((p, i) => (
                      <PersonListCard
                        key={p.id}
                        person={p}
                        index={i}
                        onClick={() => setView({ type: "person", id: p.id })}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuth && !currentUser && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onCreateProfile={handleCreateProfile}
          onSignupAsOwner={handleSignupAsOwner}
        />
      )}

      {/* Post Project Modal */}
      {showPostProject && (
        <PostProjectModal
          ownerInfo={ownerInfo || (currentUser ? { email: currentUser.email, id: currentUser.uid, name: currentUser.displayName || "Project Owner" } : null)}
          onClose={() => setShowPostProject(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (activeUserProfile || currentUser) && (
        <EditProfileModal
          profile={
            activeUserProfile || {
              id: currentUser?.uid || `user_${Date.now()}`,
              name: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Member",
              email: currentUser?.email || "",
              skills: ["React"],
              interests: ["Open Source"],
              availability: AVAILABILITY.HIGH,
              experienceLevel: EXPERIENCE.ADVANCED,
              bio: "",
              role: "candidate",
            }
          }
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Project Details Modal */}
      {modalProject && (
        <ProjectDetailsModal
          project={modalProject}
          onClose={() => setModalProject(null)}
          onApply={(proj) => console.log("Applied to", proj.title)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  const [projects, setProjects] = useState(PROJECTS);
  const [profiles, setProfiles] = useState(PROFILES);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);

  useEffect(() => {
    // 1. Listen for persistent Firebase Auth state changes
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      console.log("🔒 Firebase Auth state updated:", user ? user.email : "Logged Out");
      setCurrentUser(user);
    });

    // 2. Auto seed Firestore on first load if collections are empty
    seedFirestoreIfEmpty(db);

    // 3. Subscribe to live Firestore changes
    const unsubProfiles = subscribeToProfiles(
      db,
      (data) => {
        if (data && data.length > 0) {
          setProfiles(data);
        }
        setIsLoading(false);
      },
      (err) => {
        setFirestoreError("Something went wrong loading profiles. Try refreshing.");
        setIsLoading(false);
      }
    );

    const unsubProjects = subscribeToProjects(
      db,
      (data) => {
        if (data && data.length > 0) {
          setProjects(data);
        }
        setIsLoading(false);
      },
      (err) => {
        setFirestoreError("Something went wrong loading projects. Try refreshing.");
        setIsLoading(false);
      }
    );

    return () => {
      unsubAuth();
      unsubProfiles();
      unsubProjects();
    };
  }, []);

  const handleRetryLoad = () => {
    setFirestoreError(null);
    window.location.reload();
  };

  return (
    <InterestProvider projects={projects}>
      <MainContent
        projects={projects}
        setProjects={setProjects}
        profiles={profiles}
        setProfiles={setProfiles}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        isLoading={isLoading}
        firestoreError={firestoreError}
        onRetryLoad={handleRetryLoad}
      />
    </InterestProvider>
  );
}
