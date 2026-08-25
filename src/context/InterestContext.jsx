import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { db } from "../firebase.js";
import {
  subscribeToInterests,
  togglePersonInterestInDb,
  toggleProjectInterestInDb,
  toggleShortlistInDb,
} from "../services/dataService.js";

const SEED_PROJECT_INTEREST = new Set(["proj1:p2", "proj3:p6"]);
const SEED_PERSON_INTEREST = new Set(["p2:proj1", "p6:proj3"]);

const InterestContext = createContext(null);

export function InterestProvider({ children, projects }) {
  const [projectInterest, setProjectInterest] = useState(SEED_PROJECT_INTEREST);
  const [personInterest, setPersonInterest] = useState(SEED_PERSON_INTEREST);
  const [shortlisted, setShortlisted] = useState(new Set());
  const [rawDocs, setRawDocs] = useState([]);

  useEffect(() => {
    const unsub = subscribeToInterests(db, (docs) => {
      setRawDocs(docs);
      const projSet = new Set();
      const persSet = new Set();
      const shortSet = new Set();

      docs.forEach((item) => {
        if (item.projectInterest) {
          projSet.add(`${item.projectId}:${item.personId}`);
        }
        if (item.personInterest) {
          persSet.add(`${item.personId}:${item.projectId}`);
        }
        if (item.shortlisted) {
          shortSet.add(`${item.projectId}:${item.personId}`);
        }
      });

      if (projSet.size > 0 || persSet.size > 0 || shortSet.size > 0) {
        setProjectInterest(projSet);
        setPersonInterest(persSet);
        setShortlisted(shortSet);
      }
    });

    return () => unsub();
  }, []);

  // Toggle: project team interested in a person
  const toggleProjectInterest = useCallback(
    (projectId, personId) => {
      const key = `${projectId}:${personId}`;
      setProjectInterest((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      toggleProjectInterestInDb(db, projectId, personId, rawDocs);
    },
    [rawDocs]
  );

  // Toggle: person interested in a project
  const togglePersonInterest = useCallback(
    (personId, projectId) => {
      const key = `${personId}:${projectId}`;
      setPersonInterest((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      togglePersonInterestInDb(db, personId, projectId, rawDocs);
    },
    [rawDocs]
  );

  // Toggle: project owner shortlisting a candidate
  const toggleShortlist = useCallback(
    (projectId, personId) => {
      const key = `${projectId}:${personId}`;
      setShortlisted((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      toggleShortlistInDb(db, projectId, personId, rawDocs);
    },
    [rawDocs]
  );

  const isProjectInterested = useCallback(
    (projectId, personId) => projectInterest.has(`${projectId}:${personId}`),
    [projectInterest]
  );

  const isPersonInterested = useCallback(
    (personId, projectId) => personInterest.has(`${personId}:${projectId}`),
    [personInterest]
  );

  const isShortlisted = useCallback(
    (projectId, personId) => shortlisted.has(`${projectId}:${personId}`),
    [shortlisted]
  );

  const isMutualMatch = useCallback(
    (personId, projectId) =>
      projectInterest.has(`${projectId}:${personId}`) &&
      personInterest.has(`${personId}:${projectId}`),
    [projectInterest, personInterest]
  );

  // Count mutual matches for a project
  const getMutualMatchCount = useCallback(
    (projectId) => {
      let count = 0;
      for (const key of projectInterest) {
        const [pId, personId] = key.split(":");
        if (pId === projectId && personInterest.has(`${personId}:${projectId}`)) {
          count++;
        }
      }
      return count;
    },
    [projectInterest, personInterest]
  );

  // Stats for project owner applicant review
  const getProjectApplicantStats = useCallback(
    (projectId) => {
      let applicantCount = 0;
      let shortlistedCount = 0;
      const applicantPersonIds = [];

      for (const item of rawDocs) {
        if (item.projectId === projectId && item.personInterest) {
          applicantCount++;
          applicantPersonIds.push(item.personId);
          if (item.shortlisted) {
            shortlistedCount++;
          }
        }
      }

      return { applicantCount, shortlistedCount, applicantPersonIds };
    },
    [rawDocs]
  );

  // Compute project lifecycle stage
  const getProjectStage = useCallback(
    (project) => {
      const totalRoles = project.roles.length;
      const filled = Math.min(getMutualMatchCount(project.id), totalRoles);
      if (filled >= totalRoles) return "Locked";
      if (totalRoles > 1 && filled === totalRoles - 1) return "Almost Locked";
      return "Forming";
    },
    [getMutualMatchCount]
  );

  // Spots remaining
  const spotsRemaining = useCallback(
    (project) => {
      const totalRoles = project.roles.length;
      const filled = Math.min(getMutualMatchCount(project.id), totalRoles);
      return Math.max(0, totalRoles - filled);
    },
    [getMutualMatchCount]
  );

  return (
    <InterestContext.Provider
      value={{
        toggleProjectInterest,
        togglePersonInterest,
        toggleShortlist,
        isProjectInterested,
        isPersonInterested,
        isShortlisted,
        isMutualMatch,
        getMutualMatchCount,
        getProjectApplicantStats,
        getProjectStage,
        spotsRemaining,
      }}
    >
      {children}
    </InterestContext.Provider>
  );
}

export function useInterest() {
  const ctx = useContext(InterestContext);
  if (!ctx) throw new Error("useInterest must be used inside <InterestProvider>");
  return ctx;
}
