import { AVAILABILITY, EXPERIENCE } from "./profiles.js";

// ── Seed Projects ─────────────────────────────────────────────
// Supports technical, enterprise, open-source, and research ventures with project lead metadata.

export const PROJECTS = [
  {
    id: "proj5",
    title: "A Hybrid CNN–Transformer Framework for Contrast-less Multiple Sclerosis Lesion Classification in Brain MRI",
    description:
      "Multiple sclerosis (MS) lesion identification on MRI is vital for diagnosis and ongoing disease monitoring. Contrast agents carry accumulation risks, added costs, and longer scan times, driving the need for contrast-free alternatives built from routine T1, T2, and FLAIR sequences. We present a hybrid CNN–Transformer framework pairing an ImageNet-pretrained ResNet-50 stem for local feature extraction with a four-layer Transformer encoder for global contextual reasoning over tokenized feature maps. Evaluated on the public multi-scanner MSLesSeg dataset under strict patient-level splits, our model achieves 82.78% accuracy and 0.808 macro-F1 score, outperforming baseline CNNs while eliminating contrast agent risks for longitudinal patient scanning.",
    category: "HealthTech / AI",
    status: "ACTIVE",
    domains: [
      "Artificial Intelligence",
      "Computer Vision",
      "Medical Imaging",
      "Deep Learning",
      "Data Science Systems",
      "Biomedical Engineering",
    ],
    lead: {
      initial: "R",
      name: "Ramprasath M.",
      email: "ramprasath@projectmatch.dev",
      role: "Lead AI Researcher & Project Founder",
      phone: "+91 98765 43210",
    },
    timeline: "Q3-Q4 2026",
    code: "PRJ-2026-86",
    coveredSkills: ["ML", "Research"],
    roles: [
      {
        roleName: "Deep Learning Specialist",
        requiredSkills: ["ML", "Data Engineering", "Research"],
        impliedExperience: EXPERIENCE.ADVANCED,
        impliedAvailability: AVAILABILITY.HIGH,
      },
    ],
  },
  {
    id: "proj1",
    title: "Sage — Adaptive Learning Platform",
    description:
      "An AI-powered EdTech platform personalizing curriculum in real-time. The core team covers React, backend, and growth — but we urgently need a Product Designer for the student-facing experience and an ML Engineer to power the adaptive curriculum engine.",
    category: "EdTech",
    status: "ACTIVE",
    domains: [
      "EdTech",
      "Cognitive Systems",
      "Product Design",
    ],
    lead: {
      initial: "A",
      name: "Anand Kumar",
      email: "anand@projectmatch.dev",
      role: "Product Lead & Founder",
      phone: "+91 98765 12345",
    },
    timeline: "Q3 2026",
    code: "PRJ-2026-04",
    coveredSkills: ["React", "Backend/Node", "Growth Marketing", "Research"],
    roles: [
      {
        roleName: "Product Designer",
        requiredSkills: ["UI Design", "Figma", "Copywriting"],
        impliedExperience: EXPERIENCE.INTERMEDIATE,
        impliedAvailability: AVAILABILITY.HIGH,
      },
      {
        roleName: "ML Engineer",
        requiredSkills: ["ML", "Data Engineering"],
        impliedExperience: EXPERIENCE.ADVANCED,
        impliedAvailability: AVAILABILITY.MID,
      },
    ],
  },
  {
    id: "proj2",
    title: "Veritas — Open-Source Security Dashboard",
    description:
      "CLI + web dashboard for automated cloud infrastructure auditing with CI/CD integration. Design and PM are in place — we need serious backend and data engineering depth to ship the audit engine.",
    category: "Security / DevTools",
    status: "ACTIVE",
    domains: [
      "Cybersecurity",
      "Cloud Infrastructure",
      "DevOps",
    ],
    lead: {
      initial: "S",
      name: "Sundaram S.",
      email: "sundaram@projectmatch.dev",
      role: "Engineering Director",
      phone: "+91 98765 67890",
    },
    timeline: "Q4 2026",
    code: "PRJ-2026-52",
    coveredSkills: ["UI Design", "Figma", "Product Management", "Copywriting", "Growth Marketing"],
    roles: [
      {
        roleName: "Backend / Data Engineer",
        requiredSkills: ["Backend/Node", "Data Engineering", "Research"],
        impliedExperience: EXPERIENCE.ADVANCED,
        impliedAvailability: AVAILABILITY.HIGH,
      },
    ],
  },
  {
    id: "proj3",
    title: "Pulse — Real-Time Health Intelligence",
    description:
      "Consumer health app with wearable integrations and anomaly detection. Frontend and growth are locked — we need someone who lives in ML pipelines, data engineering, and health research.",
    category: "HealthTech",
    status: "ACTIVE",
    domains: [
      "Health Analytics",
      "Wearable IoT",
      "Data Science",
    ],
    lead: {
      initial: "M",
      name: "Meenakshi K.",
      email: "meenakshi@projectmatch.dev",
      role: "Tech Lead & Health Systems Lead",
      phone: "+91 98765 89012",
    },
    timeline: "Q3-Q4 2026",
    code: "PRJ-2026-91",
    coveredSkills: ["React", "UI Design", "Figma", "Growth Marketing"],
    roles: [
      {
        roleName: "ML / Data Specialist",
        requiredSkills: ["ML", "Data Engineering", "Research"],
        impliedExperience: EXPERIENCE.ADVANCED,
        impliedAvailability: AVAILABILITY.MID,
      },
    ],
  },
  {
    id: "proj4",
    title: "Mosaic — Community Design System",
    description:
      "Open-source design system for accessibility-first products. Core contributors handle React components and design — we need someone to drive adoption through growth marketing, compelling copywriting, and product strategy.",
    category: "Open Source",
    status: "ACTIVE",
    domains: [
      "Open Source",
      "Design Systems",
      "Frontend Architecture",
    ],
    lead: {
      initial: "R",
      name: "Rajesh P.",
      email: "rajesh@projectmatch.dev",
      role: "Design Systems Maintainer",
      phone: "+91 98765 34567",
    },
    timeline: "Ongoing 2026",
    code: "PRJ-2026-19",
    coveredSkills: ["React", "UI Design", "Figma", "Backend/Node", "Data Engineering"],
    roles: [
      {
        roleName: "Growth & Content Lead",
        requiredSkills: ["Growth Marketing", "Copywriting", "Product Management"],
        impliedExperience: EXPERIENCE.INTERMEDIATE,
        impliedAvailability: AVAILABILITY.MID,
      },
    ],
  },
];
