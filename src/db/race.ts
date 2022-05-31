import { RaceSchema } from "../constants/schemas/race";
import { db } from "../config/firestore";
import { FieldValue } from "firebase-admin/firestore";

export const saveRaceStats = async (uid: string, raceData: RaceSchema) => {
  const userRaceCollectionDoc = db.collection(`users/${uid}/races`).doc();
  userRaceCollectionDoc.set({
    ...raceData,
    timestamp: FieldValue.serverTimestamp(),
  });
};
