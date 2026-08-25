import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { PROFILES } from "../data/profiles.js";
import { PROJECTS } from "../data/projects.js";

// Initial seed interest pairs
const INITIAL_INTERESTS = [
  { id: "proj1:p2", projectId: "proj1", personId: "p2", projectInterest: true, personInterest: true },
  { id: "proj3:p6", projectId: "proj3", personId: "p6", projectInterest: true, personInterest: true },
];

/**
 * Migrate seed data into Firestore on first load if collection is empty.
 */
export async function seedFirestoreIfEmpty(db) {
  try {
    const profileSnap = await getDocs(collection(db, "profiles"));
    if (profileSnap.empty) {
      console.log("🌱 Seeding Firestore profiles...");
      const batch = writeBatch(db);
      PROFILES.forEach((profile) => {
        const ref = doc(db, "profiles", profile.id);
        batch.set(ref, profile);
      });
      await batch.commit();
      console.log("✅ Firestore profiles seeded!");
    }

    const projectSnap = await getDocs(collection(db, "projects"));
    if (projectSnap.empty) {
      console.log("🌱 Seeding Firestore projects...");
      const batch = writeBatch(db);
      PROJECTS.forEach((project) => {
        const ref = doc(db, "projects", project.id);
        batch.set(ref, project);
      });
      await batch.commit();
      console.log("✅ Firestore projects seeded!");
    }

    const interestSnap = await getDocs(collection(db, "interests"));
    if (interestSnap.empty) {
      console.log("🌱 Seeding Firestore interest state...");
      const batch = writeBatch(db);
      INITIAL_INTERESTS.forEach((item) => {
        const ref = doc(db, "interests", item.id);
        batch.set(ref, item);
      });
      await batch.commit();
      console.log("✅ Firestore interest state seeded!");
    }
  } catch (err) {
    console.warn("⚠️ Firestore auto-seed check skipped or failed:", err.message);
  }
}

/**
 * Real-time subscription to profiles collection.
 */
export function subscribeToProfiles(db, onUpdate, onError) {
  try {
    return onSnapshot(
      collection(db, "profiles"),
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(PROFILES);
        } else {
          const docs = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          onUpdate(docs);
        }
      },
      (err) => {
        console.warn("Firestore profiles subscription error, falling back to seed:", err.message);
        if (onError) onError(err);
        onUpdate(PROFILES);
      }
    );
  } catch (err) {
    console.warn("Failed to subscribe to profiles:", err.message);
    onUpdate(PROFILES);
    return () => {};
  }
}

/**
 * Real-time subscription to projects collection.
 */
export function subscribeToProjects(db, onUpdate, onError) {
  try {
    return onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(PROJECTS);
        } else {
          const docs = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          onUpdate(docs);
        }
      },
      (err) => {
        console.warn("Firestore projects subscription error, falling back to seed:", err.message);
        if (onError) onError(err);
        onUpdate(PROJECTS);
      }
    );
  } catch (err) {
    console.warn("Failed to subscribe to projects:", err.message);
    onUpdate(PROJECTS);
    return () => {};
  }
}

/**
 * Real-time subscription to interests collection.
 */
export function subscribeToInterests(db, onUpdate) {
  try {
    return onSnapshot(
      collection(db, "interests"),
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => docSnap.data());
        onUpdate(docs);
      },
      (err) => {
        console.warn("Firestore interests subscription error:", err.message);
        onUpdate(INITIAL_INTERESTS);
      }
    );
  } catch (err) {
    console.warn("Failed to subscribe to interests:", err.message);
    onUpdate(INITIAL_INTERESTS);
    return () => {};
  }
}

/**
 * Save a new profile to Firestore.
 */
export async function saveProfileToDb(db, profile) {
  try {
    const ref = doc(db, "profiles", profile.id);
    await setDoc(ref, profile, { merge: true });
    console.log("💾 Saved profile to Firestore:", profile.id);
  } catch (err) {
    console.warn("Could not save profile to Firestore:", err.message);
  }
}

/**
 * Save a new project to Firestore.
 */
export async function saveProjectToDb(db, project) {
  try {
    const ref = doc(db, "projects", project.id);
    await setDoc(ref, project, { merge: true });
    console.log("💾 Saved project to Firestore:", project.id);
  } catch (err) {
    console.warn("Could not save project to Firestore:", err.message);
  }
}

/**
 * Toggle project team interest in a candidate in Firestore.
 */
export async function toggleProjectInterestInDb(db, projectId, personId, currentDocs) {
  const docId = `${projectId}:${personId}`;
  const existing = currentDocs.find((d) => d.id === docId || (d.projectId === projectId && d.personId === personId));
  const newProjectInterest = existing ? !existing.projectInterest : true;
  const newPersonInterest = existing ? Boolean(existing.personInterest) : false;

  try {
    const ref = doc(db, "interests", docId);
    await setDoc(ref, {
      id: docId,
      projectId,
      personId,
      projectInterest: newProjectInterest,
      personInterest: newPersonInterest,
    });
  } catch (err) {
    console.warn("Could not update project interest in Firestore:", err.message);
  }
}

/**
 * Toggle candidate person interest in a project in Firestore.
 */
export async function togglePersonInterestInDb(db, personId, projectId, currentDocs) {
  const docId = `${projectId}:${personId}`;
  const existing = currentDocs.find((d) => d.id === docId || (d.projectId === projectId && d.personId === personId));
  const newPersonInterest = existing ? !existing.personInterest : true;
  const newProjectInterest = existing ? Boolean(existing.projectInterest) : false;

  try {
    const ref = doc(db, "interests", docId);
    await setDoc(ref, {
      id: docId,
      projectId,
      personId,
      projectInterest: newProjectInterest,
      personInterest: newPersonInterest,
    });
  } catch (err) {
    console.warn("Could not update person interest in Firestore:", err.message);
  }
}

/**
 * Toggle shortlisted status for a candidate on a project in Firestore.
 */
export async function toggleShortlistInDb(db, projectId, personId, currentDocs) {
  const docId = `${projectId}:${personId}`;
  const existing = currentDocs.find((d) => d.id === docId || (d.projectId === projectId && d.personId === personId));
  const newShortlisted = existing ? !existing.shortlisted : true;

  try {
    const ref = doc(db, "interests", docId);
    await setDoc(ref, {
      id: docId,
      projectId,
      personId,
      projectInterest: existing ? Boolean(existing.projectInterest) : false,
      personInterest: existing ? Boolean(existing.personInterest) : false,
      shortlisted: newShortlisted,
    }, { merge: true });
  } catch (err) {
    console.warn("Could not update shortlist status in Firestore:", err.message);
  }
}
