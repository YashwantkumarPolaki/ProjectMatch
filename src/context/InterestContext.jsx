import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { db } from "../firebase.js";
import {
  recordProjectViewInDb,
  subscribeToInterests,
  toggleApproveInDb,
  togglePersonInterestInDb,
  toggleProjectInterestInDb,
  toggleShortlistInDb,
} from "../services/dataService.js";

const SEED_PROJECT_INTEREST = new Set(["proj1:p2", "proj3:p6"]);
const SEED_PERSON_INTEREST = new Set(["p2:proj1", "p6:proj3"]);

const InterestContext = createContext(null);

export function InterestProvider({ children, projects, currentUser, onRequireAuth }) {
  const [projectInterest, setProjectInterest] = useState(SEED_PROJECT_INTEREST);
  const [personInterest, setPersonInterest] = useState(SEED_PERSON_INTEREST);
  const [shortlisted, setShortlisted] = useState(new Set());
  const [approved, setApproved] = useState(new Set());
  const [viewed, setViewed] = useState(new Set());
  const [rawDocs, setRawDocs] = useState([]);

  useEffect(() => {
    const unsub = subscribeToInterests(db, (docs) => {
      setRawDocs(docs);
      const projSet = new Set();
      const persSet = new Set();
      const shortSet = new Set();
      const appSet = new Set();
      const viewSet = new Set();

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
        if (item.approved) {
          appSet.add(`${item.projectId}:${item.personId}`);
        }
        if (item.viewed) {
          viewSet.add(`${item.projectId}:${item.personId}`);
        }
      });

      if (
        projSet.size > 0 ||
        persSet.size > 0 ||
        shortSet.size > 0 ||
        appSet.size > 0 ||
        viewSet.size > 0
      ) {
        setProjectInterest(projSet);
        setPersonInterest(persSet);
        setShortlisted(shortSet);
        setApproved(appSet);
        setViewed(viewSet);
      }
    });

    return () => unsub();
  }, []);

  // Toggle: project team interested in a person
  const toggleProjectInterest = useCallback(
    (projectId, personId) => {
      if (!currentUser) {
        onRequireAuth?.();
        return;
      }
      const key = `${projectId}:${personId}`;
      setProjectInterest((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      toggleProjectInterestInDb(db, projectId, personId, rawDocs);
    },
    [rawDocs, currentUser, onRequireAuth]
  );

  // Toggle: person interested in a project
  const togglePersonInterest = useCallback(
    (personId, projectId) => {
      if (!currentUser) {
        onRequireAuth?.();
        return;
      }
      const key = `${personId}:${projectId}`;
      setPersonInterest((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      togglePersonInterestInDb(db, personId, projectId, rawDocs);
    },
    [rawDocs, currentUser, onRequireAuth]
  );

  // Toggle: project owner shortlisting a candidate
  const toggleShortlist = useCallback(
    (projectId, personId) => {
      if (!currentUser) {
        onRequireAuth?.();
        return;
      }
      const key = `${projectId}:${personId}`;
      setShortlisted((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      toggleShortlistInDb(db, projectId, personId, rawDocs);
    },
    [rawDocs, currentUser, onRequireAuth]
  );

  // Toggle: project owner approving a shortlisted candidate for a team role
  const toggleApprove = useCallback(
    (projectId, personId) => {
      if (!currentUser) {
        onRequireAuth?.();
        return;
      }
      const key = `${projectId}:${personId}`;
      setApproved((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      toggleApproveInDb(db, projectId, personId, rawDocs);
    },
    [rawDocs, currentUser, onRequireAuth]
  );

  // Record: candidate viewing a project detail page
  const recordView = useCallback(
    (projectId, personId) => {
      if (!personId || !projectId) return;
      const key = `${projectId}:${personId}`;
      setViewed((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      recordProjectViewInDb(db, projectId, personId, rawDocs);
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

  const isApproved = useCallback(
    (projectId, personId) => approved.has(`${projectId}:${personId}`),
    [approved]
  );

  const isViewed = useCallback(
    (projectId, personId) => viewed.has(`${projectId}:${personId}`),
    [viewed]
  );

  const isMutualMatch = useCallback(
    (personId, projectId) =>
      projectInterest.has(`${projectId}:${personId}`) &&
      personInterest.has(`${personId}:${projectId}`),
    [projectInterest, personInterest]
  );

  // Count filled roles (mutual matches or approved candidates) for a project
  const getFilledCount = useCallback(
    (projectId) => {
      const filledSet = new Set();
      for (const key of projectInterest) {
        const [pId, personId] = key.split(":");
        if (pId === projectId && personInterest.has(`${personId}:${projectId}`)) {
          filledSet.add(personId);
        }
      }
      for (const key of approved) {
        const [pId, personId] = key.split(":");
        if (pId === projectId) {
          filledSet.add(personId);
        }
      }
      return filledSet.size;
    },
    [projectInterest, personInterest, approved]
  );

  // Stats for project owner applicant review
  const getProjectApplicantStats = useCallback(
    (projectId) => {
      let applicantCount = 0;
      let shortlistedCount = 0;
      let approvedCount = 0;
      const applicantPersonIds = [];

      for (const item of rawDocs) {
        if (item.projectId === projectId && item.personInterest) {
          applicantCount++;
          applicantPersonIds.push(item.personId);
          if (item.shortlisted) {
            shortlistedCount++;
          }
          if (item.approved) {
            approvedCount++;
          }
        }
      }

      return { applicantCount, shortlistedCount, approvedCount, applicantPersonIds };
    },
    [rawDocs]
  );

  // Compute project lifecycle stage
  const getProjectStage = useCallback(
    (project) => {
      const totalRoles = project.roles.length;
      const filled = Math.min(getFilledCount(project.id), totalRoles);
      if (filled >= totalRoles) return "Locked";
      if (totalRoles > 1 && filled === totalRoles - 1) return "Almost Locked";
      return "Forming";
    },
    [getFilledCount]
  );

  // Spots remaining
  const spotsRemaining = useCallback(
    (project) => {
      const totalRoles = project.roles.length;
      const filled = Math.min(getFilledCount(project.id), totalRoles);
      return Math.max(0, totalRoles - filled);
    },
    [getFilledCount]
  );

  return (
    <InterestContext.Provider
      value={{
        currentUser,
        onRequireAuth,
        toggleProjectInterest,
        togglePersonInterest,
        toggleShortlist,
        toggleApprove,
        recordView,
        isProjectInterested,
        isPersonInterested,
        isShortlisted,
        isApproved,
        isViewed,
        isMutualMatch,
        getMutualMatchCount: getFilledCount,
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
