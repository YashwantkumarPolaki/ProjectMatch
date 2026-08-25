// ============================================================
// ProjectMatch — Seed Data
// ============================================================

export const PROFILES = [
  {
    id: "p1",
    name: "Aisha Mensah",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha&backgroundColor=b6e3f4",
    skills: ["React", "TypeScript", "CSS", "Figma", "Accessibility"],
    interests: ["EdTech", "Open Source", "Design Systems"],
    availability: 30, // hours/week
    experienceLevel: 4, // 1–5 scale
    bio: "Frontend engineer who obsesses over design systems and inclusive UIs."
  },
  {
    id: "p2",
    name: "Carlos Rivera",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos&backgroundColor=ffdfbf",
    skills: ["Python", "Machine Learning", "Data Analysis", "SQL", "TensorFlow"],
    interests: ["HealthTech", "AI Ethics", "Climate"],
    availability: 20,
    experienceLevel: 3,
    bio: "ML engineer building models that actually get deployed and used."
  },
  {
    id: "p3",
    name: "Priya Nair",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=c0aede",
    skills: ["Node.js", "GraphQL", "PostgreSQL", "Docker", "AWS"],
    interests: ["FinTech", "DevOps", "Open Source"],
    availability: 40,
    experienceLevel: 5,
    bio: "Backend architect with a love for clean APIs and zero-downtime deploys."
  },
  {
    id: "p4",
    name: "Jordan Lee",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan&backgroundColor=d1f4d1",
    skills: ["React", "Vue.js", "GraphQL", "CSS", "Testing"],
    interests: ["Gaming", "AR/VR", "Creative Tools"],
    availability: 15,
    experienceLevel: 2,
    bio: "Junior dev who ships fast and learns faster. Loves building interactive UIs."
  },
  {
    id: "p5",
    name: "Fatima Al-Zahra",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima&backgroundColor=ffd5dc",
    skills: ["Product Management", "User Research", "Roadmapping", "SQL", "Figma"],
    interests: ["Social Impact", "EdTech", "Community"],
    availability: 25,
    experienceLevel: 4,
    bio: "PM who bridges user empathy and business strategy with data."
  },
  {
    id: "p6",
    name: "Marcus Thompson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=b6e3f4",
    skills: ["iOS", "Swift", "Objective-C", "Core Data", "ARKit"],
    interests: ["Mobile", "Accessibility", "Healthcare"],
    availability: 35,
    experienceLevel: 5,
    bio: "Senior iOS engineer who has shipped apps to millions of users."
  },
  {
    id: "p7",
    name: "Yuki Tanaka",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki&backgroundColor=ffdfbf",
    skills: ["Android", "Kotlin", "Jetpack Compose", "Firebase", "REST APIs"],
    interests: ["Mobile", "Music", "Gaming"],
    availability: 20,
    experienceLevel: 3,
    bio: "Android dev who crafts silky-smooth motion and thoughtful UX."
  },
  {
    id: "p8",
    name: "Amara Osei",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amara&backgroundColor=c0aede",
    skills: ["DevOps", "Kubernetes", "Terraform", "CI/CD", "AWS", "Docker"],
    interests: ["Infrastructure", "Security", "Open Source"],
    availability: 40,
    experienceLevel: 4,
    bio: "Infrastructure engineer who turns chaos into reproducible, scalable systems."
  },
  {
    id: "p9",
    name: "Leo Marchetti",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=d1f4d1",
    skills: ["Figma", "Brand Design", "Illustration", "Motion Design", "CSS"],
    interests: ["Design Culture", "Typography", "Film"],
    availability: 20,
    experienceLevel: 3,
    bio: "Product designer who brings brand soul and interaction craft together."
  },
  {
    id: "p10",
    name: "Naomi Park",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Naomi&backgroundColor=ffd5dc",
    skills: ["Data Analysis", "Python", "SQL", "Tableau", "Statistics"],
    interests: ["Sports Analytics", "Health Data", "Storytelling"],
    availability: 30,
    experienceLevel: 3,
    bio: "Data analyst who turns messy datasets into clear narratives."
  },
  {
    id: "p11",
    name: "Devon Okafor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Devon&backgroundColor=b6e3f4",
    skills: ["React", "Node.js", "TypeScript", "MongoDB", "Redis"],
    interests: ["FinTech", "Open Source", "Mentoring"],
    availability: 40,
    experienceLevel: 4,
    bio: "Full-stack engineer building resilient systems with clean code principles."
  },
  {
    id: "p12",
    name: "Sofia Reyes",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia&backgroundColor=ffdfbf",
    skills: ["Machine Learning", "Python", "NLP", "PyTorch", "Research"],
    interests: ["AI Safety", "Language Models", "Healthcare"],
    availability: 25,
    experienceLevel: 4,
    bio: "ML researcher who keeps one foot in academia and one in production."
  },
  {
    id: "p13",
    name: "Kwame Asante",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kwame&backgroundColor=c0aede",
    skills: ["Security", "Penetration Testing", "Python", "AWS", "Compliance"],
    interests: ["Cybersecurity", "Privacy", "Open Source"],
    availability: 20,
    experienceLevel: 4,
    bio: "Security engineer who finds holes before the bad actors do."
  },
  {
    id: "p14",
    name: "Ingrid Hoffman",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ingrid&backgroundColor=d1f4d1",
    skills: ["Technical Writing", "Documentation", "Markdown", "API Design", "Research"],
    interests: ["Developer Experience", "Education", "Writing"],
    availability: 15,
    experienceLevel: 3,
    bio: "Writes docs people actually want to read. DX evangelist."
  },
  {
    id: "p15",
    name: "Ravi Shankar",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi&backgroundColor=ffd5dc",
    skills: ["Rust", "WebAssembly", "C++", "Performance", "Systems Programming"],
    interests: ["Systems", "Gaming Engines", "WebAssembly"],
    availability: 35,
    experienceLevel: 5,
    bio: "Systems programmer obsessed with performance and correctness."
  },
  {
    id: "p16",
    name: "Zara Ahmed",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zara&backgroundColor=b6e3f4",
    skills: ["Blockchain", "Solidity", "Web3", "React", "Smart Contracts"],
    interests: ["DeFi", "DAOs", "Open Source"],
    availability: 30,
    experienceLevel: 3,
    bio: "Web3 developer building trustless systems and on-chain experiences."
  },
  {
    id: "p17",
    name: "Eli Greenwood",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eli&backgroundColor=ffdfbf",
    skills: ["React", "CSS", "Figma", "User Research", "Accessibility"],
    interests: ["A11y", "Design Systems", "CivicTech"],
    availability: 10,
    experienceLevel: 2,
    bio: "Designer-developer hybrid focused on accessible, inclusive interfaces."
  },
  {
    id: "p18",
    name: "Mei Lin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mei&backgroundColor=c0aede",
    skills: ["Go", "Microservices", "gRPC", "PostgreSQL", "Kubernetes"],
    interests: ["Distributed Systems", "Cloud Native", "Performance"],
    availability: 40,
    experienceLevel: 5,
    bio: "Backend engineer building distributed systems that scale gracefully."
  }
];

export const PROJECTS = [
  {
    id: "proj1",
    title: "Sage — AI-Powered Learning Platform",
    description: "Adaptive learning platform using ML to personalize educational content. Building a full-stack web app with real-time quiz generation, progress analytics, and a teacher dashboard.",
    category: "EdTech",
    teamSize: 5,
    currentTeam: ["p5"], // Fatima (PM) already on team
    roles: [
      {
        id: "r1-1",
        title: "Frontend Engineer",
        requiredSkills: ["React", "TypeScript", "CSS"],
        desiredExperience: 3, // minimum experience level
        hoursPerWeek: 20
      },
      {
        id: "r1-2",
        title: "ML Engineer",
        requiredSkills: ["Machine Learning", "Python", "NLP"],
        desiredExperience: 3,
        hoursPerWeek: 25
      },
      {
        id: "r1-3",
        title: "Backend Engineer",
        requiredSkills: ["Node.js", "PostgreSQL", "GraphQL"],
        desiredExperience: 3,
        hoursPerWeek: 20
      }
    ]
  },
  {
    id: "proj2",
    title: "Veritas — Open Source Security Audit Tool",
    description: "CLI and web dashboard for automated security auditing of cloud infrastructure. Generates compliance reports and integrates with CI/CD pipelines.",
    category: "Security",
    teamSize: 4,
    currentTeam: ["p13"], // Kwame (Security) already on team
    roles: [
      {
        id: "r2-1",
        title: "DevOps / Infrastructure",
        requiredSkills: ["DevOps", "Kubernetes", "Terraform", "AWS"],
        desiredExperience: 4,
        hoursPerWeek: 30
      },
      {
        id: "r2-2",
        title: "Backend Engineer",
        requiredSkills: ["Go", "gRPC", "PostgreSQL"],
        desiredExperience: 4,
        hoursPerWeek: 30
      },
      {
        id: "r2-3",
        title: "Technical Writer",
        requiredSkills: ["Technical Writing", "Documentation", "API Design"],
        desiredExperience: 2,
        hoursPerWeek: 15
      }
    ]
  },
  {
    id: "proj3",
    title: "Pulse — Real-Time Health Tracking Mobile App",
    description: "Cross-platform health tracking app with wearable integrations, ML-based anomaly detection, and a clean consumer-grade design. Targeting iOS-first launch.",
    category: "HealthTech",
    teamSize: 5,
    currentTeam: ["p2"], // Carlos (ML) already on team
    roles: [
      {
        id: "r3-1",
        title: "iOS Engineer",
        requiredSkills: ["iOS", "Swift", "Core Data"],
        desiredExperience: 4,
        hoursPerWeek: 35
      },
      {
        id: "r3-2",
        title: "Product Designer",
        requiredSkills: ["Figma", "Brand Design", "Motion Design"],
        desiredExperience: 3,
        hoursPerWeek: 20
      },
      {
        id: "r3-3",
        title: "Backend Engineer",
        requiredSkills: ["Node.js", "PostgreSQL", "AWS"],
        desiredExperience: 3,
        hoursPerWeek: 25
      }
    ]
  },
  {
    id: "proj4",
    title: "Mosaic — Community-Driven Design System",
    description: "Open-source design system and component library for accessibility-first web products. Includes Figma kit, React components, comprehensive docs, and a showcase site.",
    category: "Open Source",
    teamSize: 4,
    currentTeam: ["p9"], // Leo (Designer) already on team
    roles: [
      {
        id: "r4-1",
        title: "Frontend / React Engineer",
        requiredSkills: ["React", "TypeScript", "CSS", "Accessibility"],
        desiredExperience: 3,
        hoursPerWeek: 20
      },
      {
        id: "r4-2",
        title: "Documentation Lead",
        requiredSkills: ["Technical Writing", "Documentation", "Markdown"],
        desiredExperience: 2,
        hoursPerWeek: 15
      },
      {
        id: "r4-3",
        title: "Systems Engineer (Tooling)",
        requiredSkills: ["Rust", "WebAssembly", "Performance"],
        desiredExperience: 4,
        hoursPerWeek: 25
      }
    ]
  }
];
